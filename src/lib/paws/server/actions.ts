import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { LoggedAction } from "../types";
import { clampBasePoints, clampLoggedPoints, hoursFromNow, id } from "@/lib/utils";
import {
  getProfile,
  getActiveCouple,
  partnerIdOf,
  notify,
  updateStreak,
  evaluateBadges,
  buildExportCsv,
} from "./helpers";

type Ctx = { userId: string };

export const logAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      action_type_id: number;
      direction: "self" | "partner";
      note?: string;
      photo_data?: string | null;
      attention_to_detail?: boolean;
      points_override?: number;
      occurred_on?: string | null;
      send_now?: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("You need a partner first");
    const partner = partnerIdOf(c, userId)!;
    const applies_to = data.direction === "self" ? userId : partner;
    const sql = await getSql();
    const types = await sql<{
      id: number;
      name: string;
      kind: "positive" | "negative";
      base_points: number;
      category: string;
    }>`select id, name, kind, base_points, category from action_types
       where id = ${data.action_type_id} and couple_id = ${c.id} and archived = false`;
    const at = types[0];
    if (!at) throw new Error("Action not found");

    const pref = await sql<{ preferred_points: number }>`
      select preferred_points from action_preferences
      where user_id = ${applies_to} and action_type_id = ${at.id}`;
    let points = clampBasePoints(
      data.points_override ?? pref[0]?.preferred_points ?? at.base_points,
    );
    const detail = Boolean(data.attention_to_detail) && at.kind === "positive";
    if (at.kind === "negative" && points > 0) points = -Math.abs(points);
    if (at.kind === "positive" && points < 0) points = Math.abs(points);
    points = clampBasePoints(points);
    if (detail) points += 2;

    const photo =
      data.photo_data && data.photo_data.length < 700_000 ? data.photo_data : null;
    const actionId = id("la");
    const editable = hoursFromNow(24).toISOString();
    const review = hoursFromNow(48).toISOString();
    const sendNow = Boolean(data.send_now);
    const status = sendNow ? "pending" : "held";
    const heldUntil = sendNow
      ? null
      : new Date(Date.now() + 30_000).toISOString();

    let occurredAt: string | null = null;
    if (data.occurred_on && /^\d{4}-\d{2}-\d{2}$/.test(data.occurred_on)) {
      const day = data.occurred_on;
      const candidate = new Date(`${day}T12:00:00.000Z`);
      const tomorrow = new Date();
      tomorrow.setUTCHours(23, 59, 59, 999);
      if (Number.isNaN(candidate.getTime())) throw new Error("That date doesn’t look right");
      if (candidate.getTime() > tomorrow.getTime()) throw new Error("Can’t log something in the future, softie");
      const min = new Date();
      min.setFullYear(min.getFullYear() - 2);
      if (candidate.getTime() < min.getTime()) throw new Error("That’s a bit too far back (max 2 years)");
      occurredAt = candidate.toISOString();
    }

    if (occurredAt) {
      await sql`
        insert into logged_actions (
          id, couple_id, action_type_id, action_name, kind, logged_by, applies_to,
          direction, points, attention_to_detail, note, photo_data, category,
          status, editable_until, review_until, held_until, created_at, updated_at
        ) values (
          ${actionId}, ${c.id}, ${at.id}, ${at.name}, ${at.kind}, ${userId}, ${applies_to},
          ${data.direction}, ${points}, ${detail}, ${data.note ?? ""}, ${photo}, ${at.category},
          ${status}, ${editable}::timestamptz, ${review}::timestamptz,
          ${heldUntil}::timestamptz, ${occurredAt}::timestamptz, now()
        )`;
    } else {
      await sql`
        insert into logged_actions (
          id, couple_id, action_type_id, action_name, kind, logged_by, applies_to,
          direction, points, attention_to_detail, note, photo_data, category,
          status, editable_until, review_until, held_until
        ) values (
          ${actionId}, ${c.id}, ${at.id}, ${at.name}, ${at.kind}, ${userId}, ${applies_to},
          ${data.direction}, ${points}, ${detail}, ${data.note ?? ""}, ${photo}, ${at.category},
          ${status}, ${editable}::timestamptz, ${review}::timestamptz, ${heldUntil}::timestamptz
        )`;
    }

    if (sendNow) {
      const logger = await getProfile(userId);
      const whenNote = occurredAt ? ` (for ${data.occurred_on})` : "";
      await notify(
        partner,
        c.id,
        "action",
        `${logger?.display_name ?? "Your little prince"} logged something`,
        `${at.name} · ${points > 0 ? "+" : ""}${points} Brownie Points${whenNote} — review when you’re ready.`,
      );
    }
    await updateStreak(userId, c.id);
    await evaluateBadges(userId, c.id);
    return { id: actionId, status: status as "held" | "pending", held_until: heldUntil };
  });

export const releaseHeldAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const partner = partnerIdOf(c, userId)!;
    const sql = await getSql();
    const rows = await sql<LoggedAction>`
      select * from logged_actions where id = ${data.id} and couple_id = ${c.id}`;
    const a = rows[0];
    if (!a) throw new Error("Action gone");
    if (a.logged_by !== userId) throw new Error("Only the logger can send this");
    if (a.status !== "held") return { ok: true, status: a.status };

    const editable = hoursFromNow(24).toISOString();
    const review = hoursFromNow(48).toISOString();
    await sql`
      update logged_actions set
        status = 'pending',
        held_until = null,
        editable_until = ${editable}::timestamptz,
        review_until = ${review}::timestamptz,
        updated_at = now()
      where id = ${a.id}`;

    const logger = await getProfile(userId);
    await notify(
      partner,
      c.id,
      "action",
      `${logger?.display_name ?? "Your little prince"} logged something`,
      `${a.action_name} · ${a.points > 0 ? "+" : ""}${a.points} Brownie Points — review when you’re ready.`,
    );
    return { ok: true, status: "pending" as const };
  });

export const cancelHeldAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) throw new Error("Not paired");
    const sql = await getSql();
    const rows = await sql<LoggedAction>`
      select * from logged_actions where id = ${data.id} and couple_id = ${c.id}`;
    const a = rows[0];
    if (!a) throw new Error("Action gone");
    if (a.logged_by !== userId) throw new Error("Only the logger can cancel this");
    if (a.status !== "held") throw new Error("Already sent to your partner");
    await sql`delete from logged_actions where id = ${a.id} and couple_id = ${c.id}`;
    return { ok: true };
  });

export const reviewAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id: string;
      decision: "accept" | "decline" | "modify";
      points?: number;
      category?: string;
      note?: string;
      decline_note?: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const sql = await getSql();
    const rows = await sql<LoggedAction>`
      select * from logged_actions where id = ${data.id} and couple_id = ${c.id}`;
    const a = rows[0];
    if (!a) throw new Error("Action gone");
    if (a.logged_by === userId) throw new Error("Partner reviews this one");
    if (a.status !== "pending") throw new Error("Already settled");

    if (data.decision === "decline") {
      if (!data.decline_note?.trim()) throw new Error("A gentle note is needed when declining");
      await sql`
        update logged_actions set
          status = 'declined', points = 0, archived = true,
          decline_note = ${data.decline_note},
          reviewed_at = now(), reviewed_by = ${userId}, updated_at = now()
        where id = ${a.id}`;
    } else if (data.decision === "modify") {
      const proposed = clampLoggedPoints(data.points ?? a.points, {
        detail: a.attention_to_detail,
        kind: a.kind,
      });
      await sql`
        update logged_actions set
          status = 'modification_pending',
          proposed_points = ${proposed},
          category = ${data.category ?? a.category},
          note = ${data.note ?? a.note},
          reviewed_at = now(), reviewed_by = ${userId}, updated_at = now()
        where id = ${a.id}`;
    } else {
      await sql`
        update logged_actions set
          status = 'accepted',
          proposed_points = null,
          reviewed_at = now(), reviewed_by = ${userId}, updated_at = now()
        where id = ${a.id}`;
    }
    const reviewer = await getProfile(userId);
    const verb =
      data.decision === "decline"
        ? "gently declined"
        : data.decision === "modify"
          ? `proposed ${data.points ?? a.points} Brownie Points for`
          : "accepted";
    await notify(
      a.logged_by,
      c.id,
      "review",
      data.decision === "modify" ? "Point tweak needs your yes" : "A soft review landed",
      data.decision === "modify"
        ? `${reviewer?.display_name ?? "Partner"} wants “${a.action_name}” at ${data.points ?? a.points} BP — both must agree.`
        : `${reviewer?.display_name ?? "Partner"} ${verb} “${a.action_name}”.`,
    );
    await evaluateBadges(userId, c.id);
    return { ok: true };
  });

export const resolveModification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: string; decision: "accept" | "reject" }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const sql = await getSql();
    const rows = await sql<LoggedAction>`
      select * from logged_actions where id = ${data.id} and couple_id = ${c.id}`;
    const a = rows[0];
    if (!a) throw new Error("Action gone");
    if (a.status !== "modification_pending") throw new Error("No tweak waiting");

    const proposer = a.edit_proposed_by ?? null;
    if (proposer) {
      if (proposer === userId) throw new Error("Your partner needs to agree to this tweak");
    } else if (a.logged_by !== userId) {
      throw new Error("Only the person who logged it can confirm the tweak");
    }

    const partner = partnerIdOf(c, userId)!;
    const prior = (a.status_before_mod as LoggedAction["status"] | null) || "pending";

    if (data.decision === "accept") {
      const detail =
        a.proposed_attention_to_detail != null
          ? Boolean(a.proposed_attention_to_detail)
          : a.attention_to_detail;
      const pts = clampLoggedPoints(a.proposed_points ?? a.points, {
        detail,
        kind: a.kind,
      });
      const note = a.proposed_note != null ? a.proposed_note : a.note;
      await sql`
        update logged_actions set
          status = 'modified',
          points = ${pts},
          note = ${note},
          attention_to_detail = ${detail},
          proposed_points = null,
          proposed_note = null,
          proposed_attention_to_detail = null,
          edit_proposed_by = null,
          status_before_mod = null,
          updated_at = now()
        where id = ${a.id}`;
      await notify(
        partner,
        c.id,
        "review",
        "Tweak agreed",
        `“${a.action_name}” is now ${pts} Brownie Points — you both agreed.`,
      );
    } else {
      if (proposer) {
        // Edit-mode proposal declined → restore prior settled status
        await sql`
          update logged_actions set
            status = ${prior === "modified" || prior === "accepted" ? prior : "accepted"},
            proposed_points = null,
            proposed_note = null,
            proposed_attention_to_detail = null,
            edit_proposed_by = null,
            status_before_mod = null,
            updated_at = now()
          where id = ${a.id}`;
        await notify(
          partner,
          c.id,
          "review",
          "Edit declined",
          `They kept the original on “${a.action_name}”.`,
        );
      } else {
        // Legacy review-time modification rejected → back to pending
        await sql`
          update logged_actions set
            status = 'pending',
            proposed_points = null,
            reviewed_at = null,
            reviewed_by = null,
            updated_at = now()
          where id = ${a.id}`;
        await notify(
          partner,
          c.id,
          "review",
          "Tweak declined",
          `They preferred the original score on “${a.action_name}”. Review again if you like.`,
        );
      }
    }
    return { ok: true };
  });

export const proposeEditAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id: string;
      points?: number;
      note?: string;
      attention_to_detail?: boolean;
      category?: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const partner = partnerIdOf(c, userId)!;
    const me = await getProfile(userId);
    const them = await getProfile(partner);
    if (!me?.edit_mode || !them?.edit_mode) {
      throw new Error("Both of you need Edit mode switched on in Nest settings first");
    }
    const sql = await getSql();
    const rows = await sql<LoggedAction>`
      select * from logged_actions where id = ${data.id} and couple_id = ${c.id}`;
    const a = rows[0];
    if (!a) throw new Error("Not found");
    if (a.archived) throw new Error("That entry is archived");
    if (a.status === "held" || a.status === "declined") {
      throw new Error("Can't edit this entry right now");
    }
    if (a.status === "modification_pending") {
      throw new Error("There's already a tweak waiting for agreement");
    }
    if (a.status !== "accepted" && a.status !== "modified") {
      throw new Error("Only accepted or modified entries can be edited in Edit mode");
    }

    const detail =
      data.attention_to_detail !== undefined
        ? Boolean(data.attention_to_detail) && a.kind === "positive"
        : a.attention_to_detail;
    const points = clampLoggedPoints(
      data.points !== undefined ? data.points : a.points,
      { detail, kind: a.kind },
    );
    const note = data.note !== undefined ? data.note : a.note;
    const category = data.category !== undefined ? data.category : a.category;

    await sql`
      update logged_actions set
        status = 'modification_pending',
        proposed_points = ${points},
        proposed_note = ${note},
        proposed_attention_to_detail = ${detail},
        category = ${category},
        edit_proposed_by = ${userId},
        status_before_mod = ${a.status},
        updated_at = now()
      where id = ${a.id}`;

    await notify(
      partner,
      c.id,
      "review",
      "Edit needs your yes",
      `${me.display_name} wants “${a.action_name}” at ${points > 0 ? "+" : ""}${points} BP — open Nest or History to agree.`,
      { force: true },
    );
    return { ok: true };
  });

export const editLoggedAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id: string;
      points?: number;
      note?: string;
      category?: string;
      attention_to_detail?: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) throw new Error("Not paired");
    const sql = await getSql();
    const rows = await sql<LoggedAction>`
      select * from logged_actions where id = ${data.id} and couple_id = ${c.id}`;
    const a = rows[0];
    if (!a) throw new Error("Not found");
    if (a.logged_by !== userId) throw new Error("Only the logger can edit");
    if (a.status === "held") {
      // Always editable while held
    } else if (new Date(a.editable_until).getTime() < Date.now()) {
      throw new Error("Edit window closed (24h)");
    }
    if (a.status === "declined") throw new Error("Already declined");
    const detail = data.attention_to_detail ?? a.attention_to_detail;
    const points = clampLoggedPoints(data.points ?? a.points, {
      detail,
      kind: a.kind,
    });
    await sql`
      update logged_actions set
        points = ${points},
        note = ${data.note ?? a.note},
        category = ${data.category ?? a.category},
        attention_to_detail = ${detail},
        updated_at = now()
      where id = ${a.id}`;
    return { ok: true };
  });

export const listHistory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((q: { search?: string; kind?: string; status?: string } | undefined) => q ?? {})
  .handler(async ({ context, data: q }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) return [] as LoggedAction[];
    const sql = await getSql();
    let rows = await sql<LoggedAction>`
      select la.*,
        pl.display_name as logger_name,
        pa.display_name as applies_name
      from logged_actions la
      left join profiles pl on pl.user_id = la.logged_by
      left join profiles pa on pa.user_id = la.applies_to
      where la.couple_id = ${c.id}
        and (la.status != 'held' or la.logged_by = ${userId})
      order by la.created_at desc
      limit 200`;
    if (q.search) {
      const s = q.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.action_name.toLowerCase().includes(s) ||
          r.note.toLowerCase().includes(s) ||
          r.category.toLowerCase().includes(s),
      );
    }
    if (q.kind) rows = rows.filter((r) => r.kind === q.kind);
    if (q.status) rows = rows.filter((r) => r.status === q.status);
    return rows;
  });

export const exportHistory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) return { csv: "" };
    return { csv: await buildExportCsv(c.id) };
  });

export const requestDeleteAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { entry_type: "action" | "history_wipe"; entry_id?: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const partner = partnerIdOf(c, userId)!;
    const sql = await getSql();
    const existing = await sql<{ id: string; requested_by: string }>`
      select id, requested_by from deletion_requests
      where couple_id = ${c.id} and entry_type = ${data.entry_type}
        and status = 'pending'
        and (entry_id is not distinct from ${data.entry_id ?? null})`;
    if (existing[0] && existing[0].requested_by !== userId) {
      await sql`update deletion_requests set status = 'approved', approved_by = ${userId} where id = ${existing[0].id}`;
      if (data.entry_type === "history_wipe") {
        await sql`delete from logged_actions where couple_id = ${c.id}`;
      } else if (data.entry_id) {
        await sql`delete from logged_actions where id = ${data.entry_id} and couple_id = ${c.id}`;
      }
      const me = await getProfile(userId);
      await notify(
        existing[0].requested_by,
        c.id,
        "review",
        "Delete agreed",
        `${me?.display_name ?? "Partner"} agreed — it's gone from your nest.`,
        { force: true },
      );
      return { status: "approved" as const };
    }
    if (existing[0]?.requested_by === userId) return { status: "pending" as const };
    await sql`
      insert into deletion_requests (id, couple_id, entry_type, entry_id, requested_by)
      values (${id("dr")}, ${c.id}, ${data.entry_type}, ${data.entry_id ?? null}, ${userId})`;
    const me = await getProfile(userId);
    let label = data.entry_type === "history_wipe" ? "wipe all history" : "delete an entry";
    if (data.entry_type === "action" && data.entry_id) {
      const named = await sql<{ action_name: string }>`
        select action_name from logged_actions where id = ${data.entry_id} and couple_id = ${c.id}`;
      if (named[0]?.action_name) label = `delete “${named[0].action_name}”`;
    }
    await notify(
      partner,
      c.id,
      "review",
      "Delete needs your yes",
      `${me?.display_name ?? "Partner"} asked to ${label}. Open Nest home to agree or decline.`,
      { force: true },
    );
    return { status: "pending" as const };
  });

export const respondToDeletion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { request_id: string; decision: "approve" | "reject" }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      couple_id: string;
      entry_type: "action" | "history_wipe";
      entry_id: string | null;
      requested_by: string;
      status: string;
    }>`
      select * from deletion_requests
      where id = ${data.request_id} and couple_id = ${c.id}`;
    const dr = rows[0];
    if (!dr) throw new Error("Request gone");
    if (dr.status !== "pending") throw new Error("Already settled");
    if (dr.requested_by === userId) throw new Error("Your partner needs to respond");

    const me = await getProfile(userId);
    if (data.decision === "approve") {
      await sql`
        update deletion_requests set status = 'approved', approved_by = ${userId}
        where id = ${dr.id}`;
      if (dr.entry_type === "history_wipe") {
        await sql`delete from logged_actions where couple_id = ${c.id}`;
      } else if (dr.entry_id) {
        await sql`delete from logged_actions where id = ${dr.entry_id} and couple_id = ${c.id}`;
      }
      await notify(
        dr.requested_by,
        c.id,
        "review",
        "Delete agreed",
        `${me?.display_name ?? "Partner"} agreed — it's gone from your nest.`,
        { force: true },
      );
      return { status: "approved" as const };
    }

    await sql`
      update deletion_requests set status = 'cancelled', approved_by = ${userId}
      where id = ${dr.id}`;
    await notify(
      dr.requested_by,
      c.id,
      "review",
      "Delete declined",
      `${me?.display_name ?? "Partner"} kept that entry in your shared story.`,
      { force: true },
    );
    return { status: "cancelled" as const };
  });
