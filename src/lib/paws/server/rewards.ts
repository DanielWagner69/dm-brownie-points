import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { Reward, RewardClaim } from "../types";
import { hoursFromNow, id } from "@/lib/utils";
import {
  getProfile,
  getActiveCouple,
  partnerIdOf,
  notify,
  evaluateBadges,
} from "./helpers";

type Ctx = { userId: string };

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
      const rows = await sql<Reward>`select * from rewards where id = ${data.id} and couple_id = ${c.id}`;
      const r = rows[0];
      if (!r) throw new Error("Missing treat or wish");

      if (data.point_cost !== undefined && data.point_cost !== null) {
        if (r.kind === "gesture") {
          if (r.created_by === userId) {
            throw new Error("Your person sets the Brownie Points cost for your treats");
          }
          await sql`
            update rewards set point_cost = ${data.point_cost}, cost_set_by = ${userId}
            where id = ${r.id}`;
        } else if (r.created_by !== userId) {
          throw new Error("Only the wishlist owner sets the buy Brownie Points value");
        } else {
          await sql`
            update rewards set point_cost = ${data.point_cost}, cost_set_by = ${userId}
            where id = ${r.id}`;
        }
      }

      if (r.created_by === userId) {
        await sql`
          update rewards set
            name = ${data.name},
            description = ${data.description ?? r.description},
            kind = ${data.kind ?? r.kind},
            repeatable = ${data.repeatable ?? r.repeatable},
            archived = ${data.archive ?? false}
          where id = ${r.id}`;
      } else if (data.archive) {
        throw new Error("Only the owner can remove this item");
      }
      return { id: r.id };
    }
    const rid = id("rw");
    const kind = data.kind ?? "gesture";
    const cost =
      kind === "gesture" && data.point_cost != null && data.point_cost !== undefined
        ? null
        : kind === "wishlist"
          ? (data.point_cost ?? null)
          : null;
    await sql`
      insert into rewards (id, couple_id, created_by, name, description, repeatable, kind, point_cost, cost_set_by)
      values (
        ${rid}, ${c.id}, ${userId}, ${data.name}, ${data.description ?? ""},
        ${data.repeatable ?? true}, ${kind}, ${cost},
        ${cost != null ? userId : null}
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
    const partner = partnerIdOf(c, userId)!;
    const sql = await getSql();
    const rows = await sql<Reward>`
      select * from rewards where id = ${data.reward_id} and couple_id = ${c.id} and archived = false`;
    const r = rows[0];
    if (!r) throw new Error("Treat missing");
    if (r.kind !== "gesture") throw new Error("Use Buy for wishlist items");
    if (r.created_by !== userId) throw new Error("You claim treats from your own list");
    if (r.point_cost == null) throw new Error("Partner hasn’t set a Brownie Points cost yet");
    const claimId = id("rc");
    await sql`
      insert into reward_claims (id, reward_id, couple_id, claimed_by, status, points_spent)
      values (${claimId}, ${r.id}, ${c.id}, ${userId}, 'pending', ${r.point_cost})`;
    const me = await getProfile(userId);
    await notify(
      partner,
      c.id,
      "reward",
      `${me?.display_name ?? "Someone soft"} claimed a treat`,
      `“${r.name}” for ${r.point_cost} Brownie Points — approve when it feels right.`,
    );
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
    const rows = await sql<
      RewardClaim & { reward_name: string; created_by: string; reward_kind: string; reward_cost: number | null; reward_repeatable: boolean }
    >`
      select rc.*, r.name as reward_name, r.created_by, r.kind as reward_kind,
        r.point_cost as reward_cost, r.repeatable as reward_repeatable
      from reward_claims rc join rewards r on r.id = rc.reward_id
      where rc.id = ${data.id} and rc.couple_id = ${c.id}`;
    const claim = rows[0];
    if (!claim) throw new Error("Claim missing");
    if (claim.status !== "pending" && data.decision === "approve") {
      throw new Error("Already settled");
    }

    if (claim.reward_kind === "wishlist") {
      if (data.decision === "approve") {
        if (claim.created_by !== userId) {
          throw new Error("Wishlist owner confirms the purchase");
        }
        if (claim.status !== "pending") throw new Error("Already settled");
        const pts = claim.reward_cost ?? 0;
        const actionId = id("la");
        const editable = hoursFromNow(24).toISOString();
        const review = hoursFromNow(48).toISOString();
        await sql`
          insert into logged_actions (
            id, couple_id, action_name, kind, logged_by, applies_to, direction,
            points, note, category, status, editable_until, review_until
          ) values (
            ${actionId}, ${c.id}, ${"Wishlist: " + claim.reward_name}, 'positive',
            ${claim.claimed_by}, ${claim.claimed_by}, 'self',
            ${pts}, ${"Bought for partner — soft credit"}, 'wishlist', 'accepted',
            ${editable}::timestamptz, ${review}::timestamptz
          )`;
        await sql`
          update reward_claims set status = 'approved', resolved_at = now(), points_spent = 0
          where id = ${claim.id}`;
        if (!claim.reward_repeatable) {
          await sql`update rewards set archived = true where id = ${claim.reward_id}`;
        }
        await evaluateBadges(claim.claimed_by, c.id);
        await notify(
          claim.claimed_by,
          c.id,
          "reward",
          "Wishlist confirmed",
          `“${claim.reward_name}” is confirmed — you earned ${pts} Brownie Points.`,
        );
      } else {
        if (claim.status === "cancelled") return { ok: true };
        if (claim.claimed_by !== userId && claim.created_by !== userId) {
          throw new Error("Not your claim to cancel");
        }
        await sql`
          update reward_claims set status = 'cancelled', resolved_at = now(), points_spent = 0
          where id = ${claim.id}`;
        const other = claim.claimed_by === userId ? claim.created_by : claim.claimed_by;
        await notify(
          other,
          c.id,
          "reward",
          "Wishlist buy cancelled",
          `“${claim.reward_name}” purchase was cancelled.`,
        );
      }
      return { ok: true };
    }

    if (data.decision === "approve") {
      if (claim.claimed_by === userId) throw new Error("Partner approves treat claims");
      if (claim.status !== "pending") throw new Error("Already settled");
      await sql`
        update reward_claims set status = 'approved', resolved_at = now()
        where id = ${claim.id}`;
      await evaluateBadges(userId, c.id);
      await notify(
        claim.claimed_by,
        c.id,
        "reward",
        "Treat paw-approved",
        `“${claim.reward_name}” is yours. Go soft and enjoy.`,
      );
    } else {
      if (claim.status === "cancelled") return { ok: true };
      const partner = partnerIdOf(c, claim.claimed_by);
      if (claim.claimed_by !== userId && partner !== userId) {
        throw new Error("Not your claim to cancel");
      }
      await sql`
        update reward_claims set status = 'cancelled', resolved_at = now(), points_spent = 0
        where id = ${claim.id}`;
      const other =
        claim.claimed_by === userId ? partnerIdOf(c, userId)! : claim.claimed_by;
      await notify(
        other,
        c.id,
        "reward",
        "Treat cancelled",
        `“${claim.reward_name}” was cancelled and Brownie Points returned.`,
      );
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
    const rows = await sql<Reward>`
      select * from rewards where id = ${data.reward_id} and couple_id = ${c.id}
        and kind = 'wishlist' and archived = false`;
    const r = rows[0];
    if (!r) throw new Error("Wishlist item missing");
    if (r.created_by === userId) throw new Error("Your person buys this and earns the Brownie Points");
    if (r.point_cost == null) throw new Error("Wishlist needs a point value first");
    const claimId = id("rc");
    await sql`
      insert into reward_claims (id, reward_id, couple_id, claimed_by, status, points_spent)
      values (${claimId}, ${r.id}, ${c.id}, ${userId}, 'pending', 0)`;
    const me = await getProfile(userId);
    await notify(
      r.created_by,
      c.id,
      "reward",
      "Wishlist purchase pending",
      `${me?.display_name ?? "Partner"} says they bought “${r.name}” — confirm to gift them ${r.point_cost} Brownie Points.`,
    );
    return { id: claimId };
  });
