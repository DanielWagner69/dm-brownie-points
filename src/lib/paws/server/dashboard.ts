import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { BADGE_DEFS } from "../defaults";
import type {
  Balance,
  Couple,
  Dashboard,
  DeletionRequest,
  LoggedAction,
  Profile,
  RewardClaim,
} from "../types";
import {
  getProfile,
  ensureProfile,
  getActiveCouple,
  partnerIdOf,
  computeBalanceLive,
  buildTreatTips,
  weeklySummaryText,
  notify,
  hoursFromNow,
} from "./helpers";
import { hoursFromNow as hoursFromNowUtil } from "@/lib/utils";

type Ctx = { userId: string };

// Re-export hoursFromNow from helpers or utils - ensure available
const hoursFromNowFn = hoursFromNowUtil;

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
    let pendingDeletions: DeletionRequest[] = [];
    let heldActions: LoggedAction[] = [];
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
        const badgeRows = await sql<{ badge_key: string; earned_at: string }>`
          select badge_key, earned_at from badges
          where couple_id = ${coupleRow.id} and user_id = ${userId}`;
        badges = badgeRows.map((b) => ({
          badge_key: b.badge_key,
          title: BADGE_DEFS[b.badge_key]?.title ?? b.badge_key,
          description: BADGE_DEFS[b.badge_key]?.description ?? "",
          earned_at: b.earned_at,
        }));
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
            and la.status = 'modification_pending'
            and la.archived = false
            and (
              (la.edit_proposed_by is not null and la.edit_proposed_by != ${userId})
              or (la.edit_proposed_by is null and la.logged_by = ${userId})
            )
          order by la.updated_at desc`;
        heldActions = await sql<LoggedAction>`
          select * from logged_actions
          where couple_id = ${coupleRow.id}
            and logged_by = ${userId}
            and status = 'held'
            and archived = false
          order by created_at desc`;
        pendingDeletions = await sql<DeletionRequest>`
          select dr.id, dr.couple_id, dr.entry_type, dr.entry_id, dr.requested_by,
                 dr.status, dr.created_at,
                 p.display_name as requester_name,
                 la.action_name as action_name
          from deletion_requests dr
          left join profiles p on p.user_id = dr.requested_by
          left join logged_actions la on la.id = dr.entry_id
          where dr.couple_id = ${coupleRow.id}
            and dr.status = 'pending'
            and dr.requested_by != ${userId}
          order by dr.created_at desc`;
        const spendable = await sql<{ name: string; point_cost: number }>`
          select name, point_cost from rewards
          where couple_id = ${coupleRow.id}
            and created_by = ${userId}
            and kind = 'gesture'
            and archived = false
            and point_cost is not null
            and point_cost > 0
          order by point_cost asc`;
        treatTips = buildTreatTips(balance.current, spendable);
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
            and (la.status != 'held' or la.logged_by = ${userId})
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
            and created_at > now() - interval '30 days'
            and status != 'held'`;
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
        const partnerLabel =
          partner?.display_name ?? (profile.partner_nickname || "your person");
        weeklySummary = weeklySummaryText(
          profile.display_name,
          partnerLabel,
          balance,
          streak,
          weekPos[0]?.n ?? 0,
        );
      }
      notifications = await sql`
        select id, title, body, read, created_at from notifications
        where user_id = ${userId} and couple_id = ${coupleRow.id}
        order by created_at desc limit 30`;
    }

    const editModeActive = Boolean(profile.edit_mode) && Boolean(partner?.edit_mode);

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
      pendingDeletions,
      heldActions,
      recent,
      treatTips,
      weeklySummary,
      stats,
      editModeActive,
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

    const expiredHeld = await sql<LoggedAction>`
      select * from logged_actions
      where couple_id = ${c.id}
        and status = 'held'
        and held_until is not null
        and held_until < now()`;
    for (const a of expiredHeld) {
      const editable = hoursFromNowFn(24).toISOString();
      const review = hoursFromNowFn(48).toISOString();
      await sql`
        update logged_actions set
          status = 'pending',
          held_until = null,
          editable_until = ${editable}::timestamptz,
          review_until = ${review}::timestamptz,
          updated_at = now()
        where id = ${a.id} and status = 'held'`;
      const partner = partnerIdOf(c, a.logged_by);
      if (partner) {
        const logger = await getProfile(a.logged_by);
        await notify(
          partner,
          c.id,
          "action",
          `${logger?.display_name ?? "Your little prince"} logged something`,
          `${a.action_name} · ${a.points > 0 ? "+" : ""}${a.points} Brownie Points — review when you’re ready.`,
        );
      }
    }

    await sql`
      update logged_actions set status = 'accepted', reviewed_at = now()
      where couple_id = ${c.id} and status = 'pending' and review_until < now()`;
    return { ok: true };
  });
