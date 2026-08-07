import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  DEFAULT_ACTIONS,
  STARTER_REWARDS,
  BADGE_DEFS,
  PREFERENCE_SAMPLES,
  REMOVED_DEFAULT_ACTIONS,
  RENAMED_DEFAULT_ACTIONS,
  type BadgeStats,
} from "./defaults";

import type {
  ActionType,
  Balance,
  Couple,
  Dashboard,
  LoggedAction,
  Profile,
  Reward,
  RewardClaim,
  ThemeId,
} from "./types";
import { hoursFromNow, id, inviteCode } from "@/lib/utils";

type Ctx = { userId: string };

async function getProfile(userId: string): Promise<Profile | null> {
  const sql = await getSql();
  const rows = await sql<Profile>`
    select user_id, display_name, bio, avatar_url, theme, partner_nickname,
           notification_prefs, onboarding_step
    from profiles where user_id = ${userId}`;
  if (!rows[0]) return null;
  const p = rows[0];
  if (typeof p.notification_prefs === "string") {
    p.notification_prefs = JSON.parse(p.notification_prefs as unknown as string);
  }
  return p;
}

async function ensureProfile(userId: string, fallbackName: string): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const sql = await getSql();
  await sql`
    insert into profiles (user_id, display_name)
    values (${userId}, ${fallbackName || "Little one"})
    on conflict (user_id) do nothing`;
  return (await getProfile(userId))!;
}

async function getActiveCouple(userId: string): Promise<{
  id: string;
  invite_code: string;
  user_a: string;
  user_b: string | null;
} | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    invite_code: string;
    user_a: string;
    user_b: string | null;
  }>`
    select id, invite_code, user_a, user_b from couples
    where unpaired_at is null and (user_a = ${userId} or user_b = ${userId})
    limit 1`;
  return rows[0] ?? null;
}

function partnerIdOf(
  c: { user_a: string; user_b: string | null },
  userId: string,
): string | null {
  if (c.user_a === userId) return c.user_b;
  if (c.user_b === userId) return c.user_a;
  return null;
}

async function computeBalanceLive(userId: string, coupleId: string): Promise<Balance> {
  const sql = await getSql();
  const accepted = await sql<{ points: number; kind: string; status: string }>`
    select points, kind, status from logged_actions
    where couple_id = ${coupleId}
      and applies_to = ${userId}
      and status in ('accepted', 'modified')
      and archived = false`;
  let lifetime_positive = 0;
  let lifetime_negative = 0;
  for (const row of accepted) {
    if (row.kind === "positive") lifetime_positive += Math.max(0, row.points);
    else lifetime_negative += Math.min(0, row.points);
  }
  const spentRows = await sql<{ s: number }>`
    select coalesce(sum(points_spent), 0)::int as s from reward_claims
    where couple_id = ${coupleId}
      and claimed_by = ${userId}
      and status in ('approved', 'completed')`;
  const points_spent = spentRows[0]?.s ?? 0;
  const current = accepted.reduce((s, r) => s + r.points, 0) - points_spent;
  return { current, lifetime_positive, lifetime_negative, points_spent };
}

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const sql = await getSql();
    const users = await sql<{ name: string; image: string | null }>`
      select name, image from "user" where id = ${userId}`;
    const profile = await ensureProfile(userId, users[0]?.name ?? "Little one");
    if (!profile.avatar_url && users[0]?.image) {
      await sql`update profiles set avatar_url = ${users[0].image} where user_id = ${userId}`;
      profile.avatar_url = users[0].image;
    }
    const coupleRow = await getActiveCouple(userId);
    return { profile, couple: coupleRow, authName: users[0]?.name ?? null };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      display_name?: string;
      bio?: string;
      avatar_url?: string | null;
      theme?: ThemeId;
      partner_nickname?: string;
      notification_prefs?: Profile["notification_prefs"];
      onboarding_step?: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    await ensureProfile(userId, data.display_name ?? "Little one");
    const sql = await getSql();
    const cur = await getProfile(userId);
    if (!cur) throw new Error("Profile missing");
    const display_name = data.display_name?.trim() || cur.display_name;
    const bio = data.bio ?? cur.bio;
    const avatar_url = data.avatar_url !== undefined ? data.avatar_url : cur.avatar_url;
    const theme = data.theme ?? cur.theme;
    const partner_nickname = data.partner_nickname ?? cur.partner_nickname;
    const prefs = data.notification_prefs ?? cur.notification_prefs;
    const step = data.onboarding_step ?? cur.onboarding_step;
    await sql`
      update profiles set
        display_name = ${display_name},
        bio = ${bio},
        avatar_url = ${avatar_url},
        theme = ${theme},
        partner_nickname = ${partner_nickname},
        notification_prefs = ${JSON.stringify(prefs)}::jsonb,
        onboarding_step = ${step},
        updated_at = now()
      where user_id = ${userId}`;
    return getProfile(userId);
  });

export const createInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const existing = await getActiveCouple(userId);
    if (existing) {
      if (existing.user_b) throw new Error("You’re already paired, little one");
      return existing;
    }
    const sql = await getSql();
    const code = inviteCode();
    const coupleId = id("cp");
    await sql`
      insert into couples (id, invite_code, user_a)
      values (${coupleId}, ${code}, ${userId})`;
    return { id: coupleId, invite_code: code, user_a: userId, user_b: null as string | null };
  });

export const joinWithCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code.trim().toUpperCase())
  .handler(async ({ context, data: code }) => {
    const { userId } = context as Ctx;
    if (await getActiveCouple(userId)) {
      throw new Error("You’re already in a little pair");
    }
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      invite_code: string;
      user_a: string;
      user_b: string | null;
    }>`
      select id, invite_code, user_a, user_b from couples
      where invite_code = ${code} and unpaired_at is null`;
    const c = rows[0];
    if (!c) throw new Error("That invite code doesn’t match any little world");
    if (c.user_a === userId) throw new Error("That’s your own invite, softie");
    if (c.user_b) throw new Error("This pair already has two hearts");
    await sql`update couples set user_b = ${userId} where id = ${c.id} and user_b is null`;
    await sql`update profiles set onboarding_step = 'done' where user_id = ${userId}`;
    await sql`update profiles set onboarding_step = 'done' where user_id = ${c.user_a}`;
    return { ok: true, couple_id: c.id };
  });

export const unpair = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { exportFirst: boolean }) => d)
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) throw new Error("Not paired");
    const sql = await getSql();
    await sql`delete from couples where id = ${c.id}`;
    return { ok: true, exportCsv: null };
  });

export const savePreferences = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((prefs: { action_type_id: number; preferred_points: number }[]) => prefs)
  .handler(async ({ context, data: prefs }) => {
    const { userId } = context as Ctx;
    const sql = await getSql();
    for (const p of prefs) {
      await sql`
        insert into action_preferences (user_id, action_type_id, preferred_points)
        values (${userId}, ${p.action_type_id}, ${p.preferred_points})
        on conflict (user_id, action_type_id)
        do update set preferred_points = excluded.preferred_points`;
    }
    return { ok: true };
  });

export const listActionTypes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c || !c.user_b) return [] as ActionType[];
    const sql = await getSql();
    const partner = partnerIdOf(c, userId);
    return sql<ActionType>`
      select at.id, at.couple_id, at.name, at.kind, at.base_points, at.category,
             at.is_default, at.archived,
             ap.preferred_points
      from action_types at
      left join action_preferences ap
        on ap.action_type_id = at.id and ap.user_id = ${partner}
      where at.couple_id = ${c.id} and at.archived = false
      order by at.kind desc, at.base_points desc, at.name`;
  });

export const listMyPreferenceTargets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) return [] as (ActionType & { my_points: number | null })[];
    const sql = await getSql();
    return sql<ActionType & { my_points: number | null }>`
      select at.id, at.couple_id, at.name, at.kind, at.base_points, at.category,
             at.is_default, at.archived, at.base_points as preferred_points,
             ap.preferred_points as my_points
      from action_types at
      left join action_preferences ap
        on ap.action_type_id = at.id and ap.user_id = ${userId}
      where at.couple_id = ${c.id} and at.archived = false
      order by at.kind desc, at.base_points desc, at.name`;
  });

export const upsertActionType = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id?: number;
      name: string;
      kind: "positive" | "negative";
      base_points: number;
      category?: string;
      archive?: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Pair first");
    const sql = await getSql();
    if (data.id) {
      await sql`
        update action_types set
          name = ${data.name},
          kind = ${data.kind},
          base_points = ${data.base_points},
          category = ${data.category ?? "general"},
          archived = ${data.archive ?? false}
        where id = ${data.id} and couple_id = ${c.id}`;
      return { id: data.id };
    }
    const rows = await sql<{ id: number }>`
      insert into action_types (couple_id, name, kind, base_points, category, created_by)
      values (${c.id}, ${data.name}, ${data.kind}, ${data.base_points}, ${data.category ?? "general"}, ${userId})
      returning id`;
    return { id: rows[0].id };
  });

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
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("You need a partner first");
    const partner = partnerIdOf(c, userId)!;
    // Performer gets the points; recipient's preference sets the value.
    // "self" = I did it (for them) → I get points, valued by partner's rating
    // "partner" = they did it (for me) → they get points, valued by my rating
    const performer = data.direction === "self" ? userId : partner;
    const recipient = data.direction === "self" ? partner : userId;
    const applies_to = performer;
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
      where user_id = ${recipient} and action_type_id = ${at.id}`;
    let points = data.points_override ?? pref[0]?.preferred_points ?? at.base_points;
    const detail = Boolean(data.attention_to_detail) && at.kind === "positive";
    if (detail) points += 2;
    if (at.kind === "negative" && points > 0) points = -Math.abs(points);
    if (at.kind === "positive" && points < 0) points = Math.abs(points);

    const photo =
      data.photo_data && data.photo_data.length < 700_000 ? data.photo_data : null;
    const actionId = id("la");
    const editable = hoursFromNow(24).toISOString();
    const review = hoursFromNow(48).toISOString();

    await sql`
      insert into logged_actions (
        id, couple_id, action_type_id, action_name, kind, logged_by, applies_to,
        direction, points, attention_to_detail, note, photo_data, category,
        status, editable_until, review_until
      ) values (
        ${actionId}, ${c.id}, ${at.id}, ${at.name}, ${at.kind}, ${userId}, ${applies_to},
        ${data.direction}, ${points}, ${detail}, ${data.note ?? ""}, ${photo}, ${at.category},
        'pending', ${editable}::timestamptz, ${review}::timestamptz
      )`;

    return { id: actionId };
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
      const proposed = data.points ?? a.points;
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
    if (a.logged_by !== userId) throw new Error("Only the person who logged it can confirm the tweak");
    if (a.status !== "modification_pending") throw new Error("No tweak waiting");
    if (data.decision === "accept") {
      const pts = a.proposed_points ?? a.points;
      await sql`
        update logged_actions set
          status = 'modified',
          points = ${pts},
          proposed_points = null,
          updated_at = now()
        where id = ${a.id}`;
    } else {
      await sql`
        update logged_actions set
          status = 'pending',
          proposed_points = null,
          reviewed_at = null,
          reviewed_by = null,
          updated_at = now()
        where id = ${a.id}`;
    }
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
    if (new Date(a.editable_until).getTime() < Date.now()) {
      throw new Error("Edit window closed (24h)");
    }
    if (a.status === "declined") throw new Error("Already declined");
    const points = data.points ?? a.points;
    const detail = data.attention_to_detail ?? a.attention_to_detail;
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
  .handler(async () => {
    return { csv: "" };
  });

export const requestDeleteAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { entry_type: "action" | "history_wipe"; entry_id?: string }) => d)
  .handler(async () => {
    return { status: "pending" as const };
  });

export const listRewards = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) return [] as Reward[];
    const sql = await getSql();
    return sql<Reward>`
      select r.*, p.display_name as created_by_name
      from rewards r
      left join profiles p on p.user_id = r.created_by
      where r.couple_id = ${c.id} and r.archived = false
      order by r.kind, r.name`;
  });

export const upsertReward = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id?: string;
      name: string;
      description?: string;
      kind?: "gesture" | "wishlist";
      repeatable?: boolean;
      point_cost?: number | null;
      archive?: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Pair first");
    const sql = await getSql();
    if (data.id) {
      await sql`
        update rewards set
          name = ${data.name},
          description = ${data.description ?? ""},
          kind = ${data.kind ?? "gesture"},
          repeatable = ${data.repeatable ?? true},
          archived = ${data.archive ?? false},
          point_cost = ${data.point_cost ?? null}
        where id = ${data.id} and couple_id = ${c.id}`;
      return { id: data.id };
    }
    const rid = id("rw");
    await sql`
      insert into rewards (id, couple_id, created_by, name, description, repeatable, kind, point_cost)
      values (
        ${rid}, ${c.id}, ${userId}, ${data.name}, ${data.description ?? ""},
        ${data.repeatable ?? true}, ${data.kind ?? "gesture"}, ${data.point_cost ?? null}
      )`;
    return { id: rid };
  });

export const claimReward = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { reward_id: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const sql = await getSql();
    const rows = await sql<Reward>`
      select * from rewards where id = ${data.reward_id} and couple_id = ${c.id} and archived = false`;
    const r = rows[0];
    if (!r) throw new Error("Treat missing");
    if (r.point_cost == null) throw new Error("Partner hasn’t set a Brownie Points cost yet");
    const claimId = id("rc");
    await sql`
      insert into reward_claims (id, reward_id, couple_id, claimed_by, status, points_spent)
      values (${claimId}, ${r.id}, ${c.id}, ${userId}, 'pending', ${r.point_cost})`;
    return { id: claimId };
  });

export const resolveClaim = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: string; decision: "approve" | "cancel" }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const sql = await getSql();
    if (data.decision === "approve") {
      await sql`
        update reward_claims set status = 'approved', resolved_at = now()
        where id = ${data.id} and couple_id = ${c.id}`;
    } else {
      await sql`
        update reward_claims set status = 'cancelled', resolved_at = now(), points_spent = 0
        where id = ${data.id} and couple_id = ${c.id}`;
    }
    return { ok: true };
  });

export const buyWishlistItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { reward_id: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c?.user_b) throw new Error("Not paired");
    const sql = await getSql();
    const claimId = id("rc");
    await sql`
      insert into reward_claims (id, reward_id, couple_id, claimed_by, status, points_spent)
      values (${claimId}, ${data.reward_id}, ${c.id}, ${userId}, 'pending', 0)`;
    return { id: claimId };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Dashboard> => {
    const { userId } = context as Ctx;
    const sql = await getSql();
    const users = await sql<{ name: string; image: string | null }>`
      select name, image from "user" where id = ${userId}`;
    const profile = await ensureProfile(userId, users[0]?.name ?? "Little one");
    const coupleRow = await getActiveCouple(userId);
    let couple: Couple | null = null;
    let partner: Profile | null = null;
    let balance: Balance = {
      current: 0,
      lifetime_positive: 0,
      lifetime_negative: 0,
      points_spent: 0,
    };
    let partnerBalance: Balance | null = null;
    let streak = 0;
    let badges: Dashboard["badges"] = [];
    let pendingReviews: LoggedAction[] = [];
    let pendingModifications: LoggedAction[] = [];
    let pendingClaims: RewardClaim[] = [];
    let recent: LoggedAction[] = [];
    let treatTips: Dashboard["treatTips"] = [];
    let weeklySummary = "";
    let notifications: Dashboard["notifications"] = [];
    let stats: Dashboard["stats"] = {
      week_positive: 0,
      week_negative: 0,
      week_accepted: 0,
      week_pending: 0,
      month_logged: 0,
      pending_reviews: 0,
      pending_claims: 0,
      pending_modifications: 0,
    };

    if (coupleRow) {
      const pid = partnerIdOf(coupleRow, userId);
      if (pid) partner = await getProfile(pid);
      couple = {
        id: coupleRow.id,
        invite_code: coupleRow.invite_code,
        user_a: coupleRow.user_a,
        user_b: coupleRow.user_b,
        partner_id: pid,
        partner_name: partner?.display_name ?? (pid ? "Partner" : null),
        partner_avatar: partner?.avatar_url ?? null,
        is_complete: Boolean(coupleRow.user_b),
      };
      if (coupleRow.user_b) {
        balance = await computeBalanceLive(userId, coupleRow.id);
        if (pid) partnerBalance = await computeBalanceLive(pid, coupleRow.id);
        const st = await sql<{ current_streak: number }>`
          select current_streak from streaks where couple_id = ${coupleRow.id} and user_id = ${userId}`;
        streak = st[0]?.current_streak ?? 0;
        pendingReviews = await sql<LoggedAction>`
          select * from logged_actions
          where couple_id = ${coupleRow.id}
            and logged_by != ${userId}
            and status = 'pending'
            and archived = false
          order by created_at desc`;
        pendingModifications = await sql<LoggedAction>`
          select la.*, pl.display_name as logger_name
          from logged_actions la
          left join profiles pl on pl.user_id = la.logged_by
          where la.couple_id = ${coupleRow.id}
            and la.logged_by = ${userId}
            and la.status = 'modification_pending'
            and la.archived = false
          order by la.updated_at desc`;
        pendingClaims = await sql<RewardClaim>`
          select rc.*, r.name as reward_name, p.display_name as claimer_name
          from reward_claims rc
          join rewards r on r.id = rc.reward_id
          left join profiles p on p.user_id = rc.claimed_by
          where rc.couple_id = ${coupleRow.id}
            and rc.status = 'pending'
            and rc.claimed_by != ${userId}
          order by rc.created_at desc`;
        recent = await sql<LoggedAction>`
          select la.*, pl.display_name as logger_name
          from logged_actions la
          left join profiles pl on pl.user_id = la.logged_by
          where la.couple_id = ${coupleRow.id}
          order by la.created_at desc limit 12`;
        const weekPos = await sql<{ n: number }>`
          select count(*)::int as n from logged_actions
          where couple_id = ${coupleRow.id} and kind = 'positive'
            and created_at > now() - interval '7 days'
            and status in ('pending','accepted','modified')`;
        const weekNeg = await sql<{ n: number }>`
          select count(*)::int as n from logged_actions
          where couple_id = ${coupleRow.id} and kind = 'negative'
            and created_at > now() - interval '7 days'
            and status in ('pending','accepted','modified')`;
        const weekAcc = await sql<{ n: number }>`
          select count(*)::int as n from logged_actions
          where couple_id = ${coupleRow.id}
            and created_at > now() - interval '7 days'
            and status in ('accepted','modified')`;
        const weekPend = await sql<{ n: number }>`
          select count(*)::int as n from logged_actions
          where couple_id = ${coupleRow.id}
            and created_at > now() - interval '7 days'
            and status = 'pending'`;
        const monthLog = await sql<{ n: number }>`
          select count(*)::int as n from logged_actions
          where couple_id = ${coupleRow.id}
            and created_at > now() - interval '30 days'`;
        stats = {
          week_positive: weekPos[0]?.n ?? 0,
          week_negative: weekNeg[0]?.n ?? 0,
          week_accepted: weekAcc[0]?.n ?? 0,
          week_pending: weekPend[0]?.n ?? 0,
          month_logged: monthLog[0]?.n ?? 0,
          pending_reviews: pendingReviews.length,
          pending_claims: pendingClaims.length,
          pending_modifications: pendingModifications.length,
        };
        weeklySummary = `${profile.display_name}, this little week of Brownie Points was gentle and real.`;
      }
      notifications = await sql`
        select id, title, body, read, created_at from notifications
        where user_id = ${userId} and couple_id = ${coupleRow.id}
        order by created_at desc limit 30`;
    }

    return {
      profile,
      couple,
      partner,
      balance,
      partnerBalance,
      streak,
      badges,
      pendingReviews,
      pendingModifications,
      pendingClaims,
      recent,
      treatTips,
      weeklySummary,
      stats,
      notifications,
    };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const sql = await getSql();
    await sql`update notifications set read = true where user_id = ${userId}`;
    return { ok: true };
  });

export const settleExpired = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) return { ok: true };
    const sql = await getSql();
    await sql`
      update logged_actions set status = 'accepted', reviewed_at = now()
      where couple_id = ${c.id} and status = 'pending' and review_until < now()`;
    return { ok: true };
  });
