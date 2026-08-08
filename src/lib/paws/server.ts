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
  DeletionRequest,
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


function buildTreatTips(
  balance: number,
  items: { name: string; point_cost: number }[],
): { summary: string; items: { name: string; cost: number }[]; total: number }[] {
  if (balance <= 0 || items.length === 0) return [];
  const affordable = items.filter((i) => i.point_cost <= balance);
  if (affordable.length === 0) {
    const cheapest = [...items].sort((a, b) => a.point_cost - b.point_cost)[0];
    if (!cheapest) return [];
    return [
      {
        summary: `You're ${cheapest.point_cost - balance} BP short of “${cheapest.name}”`,
        items: [{ name: cheapest.name, cost: cheapest.point_cost }],
        total: cheapest.point_cost,
      },
    ];
  }
  const tips: { summary: string; items: { name: string; cost: number }[]; total: number }[] = [];
  // Single-item tips (up to 3)
  for (const it of affordable.slice(0, 3)) {
    tips.push({
      summary: `You can claim “${it.name}” (${it.point_cost} BP)`,
      items: [{ name: it.name, cost: it.point_cost }],
      total: it.point_cost,
    });
  }
  // Greedy combination of cheapest affordable items
  let rem = balance;
  const combo: { name: string; cost: number }[] = [];
  for (const it of affordable) {
    if (it.point_cost <= rem) {
      combo.push({ name: it.name, cost: it.point_cost });
      rem -= it.point_cost;
      if (combo.length >= 3) break;
    }
  }
  if (combo.length >= 2) {
    const total = combo.reduce((s, x) => s + x.cost, 0);
    tips.push({
      summary: `Or stack ${combo.map((c) => c.name).join(" + ")} (${total} BP total)`,
      items: combo,
      total,
    });
  }
  // Deduplicate by summary
  const seen = new Set<string>();
  return tips.filter((t) => {
    if (seen.has(t.summary)) return false;
    seen.add(t.summary);
    return true;
  }).slice(0, 4);
}

async function seedDefaults(coupleId: string, userId: string) {
  const sql = await getSql();
  const existing = await sql<{ n: number }>`
    select count(*)::int as n from action_types where couple_id = ${coupleId}`;
  if ((existing[0]?.n ?? 0) === 0) {
    for (const a of DEFAULT_ACTIONS) {
      await sql`
        insert into action_types (couple_id, name, kind, base_points, category, is_default, created_by)
        values (${coupleId}, ${a.name}, ${a.kind}, ${a.base_points}, ${a.category}, true, ${userId})`;
    }
  } else {
    await syncDefaultActions(coupleId, userId);
  }

  const rewardCount = await sql<{ n: number }>`
    select count(*)::int as n from rewards where couple_id = ${coupleId}`;
  if ((rewardCount[0]?.n ?? 0) === 0) {
    for (const r of STARTER_REWARDS) {
      await sql`
        insert into rewards (id, couple_id, created_by, name, description, repeatable, kind)
        values (${id("rw")}, ${coupleId}, ${userId}, ${r.name}, ${r.description}, true, 'gesture')`;
    }
  }
}

/** Keep existing nests in sync with the current default action catalog. */
async function syncDefaultActions(coupleId: string, userId: string) {
  const sql = await getSql();

  for (const [from, to] of Object.entries(RENAMED_DEFAULT_ACTIONS)) {
    await sql`
      update action_types set name = ${to}
      where couple_id = ${coupleId} and name = ${from} and archived = false`;
  }

  for (const name of REMOVED_DEFAULT_ACTIONS) {
    await sql`
      update action_types set archived = true
      where couple_id = ${coupleId} and name = ${name}`;
  }

  const rows = await sql<{ name: string; archived: boolean }>`
    select name, archived from action_types where couple_id = ${coupleId}`;
  const haveActive = new Set(rows.filter((r) => !r.archived).map((r) => r.name));
  const haveAny = new Set(rows.map((r) => r.name));

  for (const a of DEFAULT_ACTIONS) {
    if (haveActive.has(a.name)) {
      // Keep points in line for known defaults (safe for catalog items)
      await sql`
        update action_types
        set base_points = ${a.base_points}, kind = ${a.kind}, category = ${a.category}
        where couple_id = ${coupleId} and name = ${a.name} and is_default = true and archived = false`;
    } else if (haveAny.has(a.name)) {
      // Intentionally archived (or renamed leftover) — do not re-insert
      continue;
    } else {
      await sql`
        insert into action_types (couple_id, name, kind, base_points, category, is_default, created_by)
        values (${coupleId}, ${a.name}, ${a.kind}, ${a.base_points}, ${a.category}, true, ${userId})`;
    }
  }
}

async function notify(
  userId: string,
  coupleId: string,
  kind: string,
  title: string,
  body: string,
  opts?: { force?: boolean },
) {
  const sql = await getSql();
  if (!opts?.force) {
    const pref = await getProfile(userId);
    const prefs = pref?.notification_prefs;
    if (prefs) {
      if (kind === "action" && !prefs.actions) return;
      if (kind === "reward" && !prefs.rewards) return;
      if (kind === "review" && !prefs.reviews) return;
      if (kind === "summary" && !prefs.summaries) return;
    }
  }
  await sql`
    insert into notifications (id, user_id, couple_id, kind, title, body)
    values (${id("nt")}, ${userId}, ${coupleId}, ${kind}, ${title}, ${body})`;
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

async function updateStreak(userId: string, coupleId: string) {
  const sql = await getSql();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sql<{
    current_streak: number;
    longest_streak: number;
    last_action_date: string | null;
  }>`select current_streak, longest_streak, last_action_date::text as last_action_date
     from streaks where couple_id = ${coupleId} and user_id = ${userId}`;
  if (!rows[0]) {
    await sql`
      insert into streaks (couple_id, user_id, current_streak, longest_streak, last_action_date)
      values (${coupleId}, ${userId}, 1, 1, ${today}::date)`;
    return 1;
  }
  const last = rows[0].last_action_date?.slice(0, 10) ?? null;
  if (last === today) return rows[0].current_streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = last === yesterday ? rows[0].current_streak + 1 : 1;
  const longest = Math.max(rows[0].longest_streak, next);
  await sql`
    update streaks set current_streak = ${next}, longest_streak = ${longest},
      last_action_date = ${today}::date
    where couple_id = ${coupleId} and user_id = ${userId}`;
  return next;
}

async function evaluateBadges(userId: string, coupleId: string) {
  const sql = await getSql();
  const streakRows = await sql<{ current_streak: number }>`
    select current_streak from streaks where couple_id = ${coupleId} and user_id = ${userId}`;
  const detail = await sql<{ n: number }>`
    select count(*)::int as n from logged_actions
    where couple_id = ${coupleId} and logged_by = ${userId}
      and attention_to_detail = true and status in ('accepted','modified')`;
  const rest = await sql<{ n: number }>`
    select count(*)::int as n from logged_actions
    where couple_id = ${coupleId} and logged_by = ${userId}
      and action_name ilike '%rest%' and status in ('accepted','modified')`;
  const pos = await sql<{ n: number }>`
    select count(*)::int as n from logged_actions
    where couple_id = ${coupleId} and applies_to = ${userId}
      and kind = 'positive' and status in ('accepted','modified')`;
  const reviews = await sql<{ n: number }>`
    select count(*)::int as n from logged_actions
    where couple_id = ${coupleId} and reviewed_by = ${userId}`;
  const princess = await sql<{ n: number }>`
    select count(*)::int as n from reward_claims rc
    join rewards r on r.id = rc.reward_id
    where rc.couple_id = ${coupleId} and rc.status in ('approved','completed')
      and r.name ilike '%passenger%'`;
  const stats: BadgeStats = {
    streak: streakRows[0]?.current_streak ?? 0,
    detailCount: detail[0]?.n ?? 0,
    restCount: rest[0]?.n ?? 0,
    positiveAccepted: pos[0]?.n ?? 0,
    reviewsDone: reviews[0]?.n ?? 0,
    passengerPrincessClaims: princess[0]?.n ?? 0,
  };
  for (const [key, def] of Object.entries(BADGE_DEFS)) {
    if (!def.check(stats)) continue;
    await sql`
      insert into badges (user_id, couple_id, badge_key)
      values (${userId}, ${coupleId}, ${key})
      on conflict do nothing`;
  }
}

function weeklySummaryText(
  name: string,
  partner: string,
  balance: Balance,
  streak: number,
  recentPos: number,
): string {
  return [
    `${name}, this little week of Brownie Points was gentle and real.`,
    `You and ${partner} stacked ${recentPos} soft positives together.`,
    `Your Brownie Points balance sits at ${balance.current} (lifetime positive ${balance.lifetime_positive}, little oopsies ${balance.lifetime_negative}).`,
    streak > 0
      ? `Your kindness streak is ${streak} day${streak === 1 ? "" : "s"} — bulochka energy is strong.`
      : `A fresh week is waiting for your next tiny pawmise.`,
  ].join(" ");
}

function csv(s: string) {
  return `"${String(s ?? "").replace(/"/g, '""')}"`;
}

async function buildExportCsv(coupleId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql<LoggedAction>`
    select * from logged_actions where couple_id = ${coupleId} order by created_at`;
  const header = [
    "id",
    "action_name",
    "kind",
    "points",
    "status",
    "logged_by",
    "applies_to",
    "note",
    "category",
    "created_at",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        csv(r.action_name),
        r.kind,
        r.points,
        r.status,
        r.logged_by,
        r.applies_to,
        csv(r.note),
        csv(r.category),
        r.created_at,
      ].join(","),
    );
  }
  return lines.join("\n");
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
    await seedDefaults(coupleId, userId);
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
    for (const r of STARTER_REWARDS) {
      await sql`
        insert into rewards (id, couple_id, created_by, name, description, repeatable, kind)
        values (${id("rw")}, ${c.id}, ${userId}, ${r.name}, ${r.description}, true, 'gesture')`;
    }
    const aName = (await getProfile(c.user_a))?.display_name ?? "Your partner";
    const bName = (await getProfile(userId))?.display_name ?? "Your partner";
    await notify(c.user_a, c.id, "action", "You're paired", `${bName} joined your little world.`);
    await notify(userId, c.id, "action", "You're paired", `You’re paired with ${aName}. Soft mode: on.`);
    await sql`update profiles set onboarding_step = 'done' where user_id = ${userId}`;
    await sql`update profiles set onboarding_step = 'done' where user_id = ${c.user_a}`;
    return { ok: true, couple_id: c.id };
  });

export const unpair = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { exportFirst: boolean }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const c = await getActiveCouple(userId);
    if (!c) throw new Error("Not paired");
    const sql = await getSql();
    let exportCsv: string | null = null;
    if (data.exportFirst) {
      exportCsv = await buildExportCsv(c.id);
    }
    await sql`delete from notifications where couple_id = ${c.id}`;
    await sql`delete from deletion_requests where couple_id = ${c.id}`;
    await sql`delete from badges where couple_id = ${c.id}`;
    await sql`delete from streaks where couple_id = ${c.id}`;
    await sql`delete from reward_claims where couple_id = ${c.id}`;
    await sql`delete from rewards where couple_id = ${c.id}`;
    await sql`delete from logged_actions where couple_id = ${c.id}`;
    await sql`delete from action_preferences where action_type_id in (select id from action_types where couple_id = ${c.id})`;
    await sql`delete from action_types where couple_id = ${c.id}`;
    await sql`delete from couples where id = ${c.id}`;
    await sql`update profiles set onboarding_step = 'pairing' where user_id = ${c.user_a}`;
    if (c.user_b) {
      await sql`update profiles set onboarding_step = 'pairing' where user_id = ${c.user_b}`;
    }
    return { ok: true, exportCsv };
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
    await syncDefaultActions(c.id, userId);
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
    await syncDefaultActions(c.id, userId);
    const sql = await getSql();
    // Full catalog: all defaults + custom actions for this nest (matches Log list)
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
      /** YYYY-MM-DD for retrospective logs (optional). Still needs partner approval. */
      occurred_on?: string | null;
      /** Skip the 30s grace — notify partner immediately */
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
    let points = data.points_override ?? pref[0]?.preferred_points ?? at.base_points;
    const detail = Boolean(data.attention_to_detail) && at.kind === "positive";
    if (detail) points += 2;
    if (at.kind === "negative" && points > 0) points = -Math.abs(points);
    if (at.kind === "positive" && points < 0) points = Math.abs(points);

    const photo =
      data.photo_data && data.photo_data.length < 700_000 ? data.photo_data : null;
    const actionId = id("la");
    // Review window always starts from *now* so partner still has time to approve.
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
      if (Number.isNaN(candidate.getTime())) {
        throw new Error("That date doesn’t look right");
      }
      if (candidate.getTime() > tomorrow.getTime()) {
        throw new Error("Can’t log something in the future, softie");
      }
      // Not older than 2 years — keeps the nest from accidental 1900s
      const min = new Date();
      min.setFullYear(min.getFullYear() - 2);
      if (candidate.getTime() < min.getTime()) {
        throw new Error("That’s a bit too far back (max 2 years)");
      }
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

/** Release a held log (after 30s or user skipped wait) → partner is notified. */
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

/** Cancel a held log before partner sees it. */
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
      const proposed = data.points ?? a.points;
      // Partner proposes a new score — original logger must agree
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
    if (a.logged_by !== userId) throw new Error("Only the person who logged it can confirm the tweak");
    if (a.status !== "modification_pending") throw new Error("No tweak waiting");
    const partner = partnerIdOf(c, userId)!;
    if (data.decision === "accept") {
      const pts = a.proposed_points ?? a.points;
      await sql`
        update logged_actions set
          status = 'modified',
          points = ${pts},
          proposed_points = null,
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
      // Reject modification → back to pending for partner to re-review original
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
      // Always editable while held (not yet sent)
    } else if (new Date(a.editable_until).getTime() < Date.now()) {
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

/** Partner responds to a pending deletion request from the home card. */
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

      // Treats: partner sets spend cost. Wishlist: owner sets buy-earn points.
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
    const initialCost =
      kind === "wishlist" && data.point_cost != null ? data.point_cost : data.point_cost ?? null;
    // Gestures start without cost (partner fills in). Wishlist can include earn points on create.
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

    // Wishlist purchase: list owner confirms; buyer (claimed_by) earns points.
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
        // Buyer or owner can cancel a pending purchase confirmation
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

    // Treats (gesture): partner approves spend claim; cancel refunds points_spent
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
      // Claimer or their partner can cancel → refund (points_spent zeroed)
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
    // Pending confirmation by wishlist owner, then buyer earns points.
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
            and la.logged_by = ${userId}
            and la.status = 'modification_pending'
            and la.archived = false
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
        // Treat spend tips from partner's gesture list (you claim their priced treats? 
        // Spec: tips for what YOU can purchase = YOUR treat list with costs set)
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
        // Partner never sees held logs; logger sees their own
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

    // Auto-release held logs past the 30s grace window + notify partner
    const expiredHeld = await sql<LoggedAction>`
      select * from logged_actions
      where couple_id = ${c.id}
        and status = 'held'
        and held_until is not null
        and held_until < now()`;
    for (const a of expiredHeld) {
      const editable = hoursFromNow(24).toISOString();
      const review = hoursFromNow(48).toISOString();
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
