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
  ACTION_CATEGORIES,
  type BadgeStats,
} from "./defaults";

import type {
  ActionCategory,
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
import { clampBasePoints, clampLoggedPoints, hoursFromNow, id, inviteCode } from "@/lib/utils";

type Ctx = { userId: string };

async function getProfile(userId: string): Promise<Profile | null> {
  const sql = await getSql();
  const rows = await sql<Profile>`
    select user_id, display_name, bio, avatar_url, theme, partner_nickname,
           notification_prefs, onboarding_step,
           coalesce(edit_mode, false) as edit_mode
    from profiles where user_id = ${userId}`;
  if (!rows[0]) return null;
  const p = rows[0];
  if (typeof p.notification_prefs === "string") {
    p.notification_prefs = JSON.parse(p.notification_prefs as unknown as string);
  }
  p.edit_mode = Boolean(p.edit_mode);
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
  await syncCategories(coupleId);
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

async function syncCategories(coupleId: string) {
  const sql = await getSql();
  const existing = await sql<{ name: string }>`
    select name from action_categories
    where couple_id = ${coupleId} and archived = false`;
  const have = new Set(existing.map((r) => r.name.trim().toLowerCase()));

  for (const name of ACTION_CATEGORIES) {
    if (have.has(name.toLowerCase())) continue;
    try {
      await sql`
        insert into action_categories (couple_id, name)
        values (${coupleId}, ${name})`;
      have.add(name.toLowerCase());
    } catch {
      /* unique race */
    }
  }

  const used = await sql<{ category: string }>`
    select distinct category from action_types
    where couple_id = ${coupleId} and archived = false`;
  for (const row of used) {
    const n = (row.category || "general").trim();
    if (!n || have.has(n.toLowerCase())) continue;
    try {
      await sql`
        insert into action_categories (couple_id, name)
        values (${coupleId}, ${n})`;
      have.add(n.toLowerCase());
    } catch {
      /* unique race */
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
  void import("./push.server")
    .then((m) => m.sendPushToUser(userId, title, body))
    .catch(() => {
      /* push is best-effort */
    });
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
      edit_mode?: boolean;
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
    const edit_mode = data.edit_mode !== undefined ? Boolean(data.edit_mode) : cur.edit_mode;
    await sql`
      update profiles set
        display_name = ${display_name},
        bio = ${bio},
        avatar_url = ${avatar_url},
        theme = ${theme},
        partner_nickname = ${partner_nickname},
        notification_prefs = ${JSON.stringify(prefs)}::jsonb,
        onboarding_step = ${step},
        edit_mode = ${edit_mode},
        updated_at = now()
      where user_id = ${userId}`;
    return getProfile(userId);
  });
