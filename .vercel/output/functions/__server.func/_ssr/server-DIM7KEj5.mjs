import { i as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-Ddovz0a8.mjs";
import { a as id, i as hoursFromNow, o as inviteCode } from "./utils-BjfSGPtc.mjs";
import { a as getSql } from "./db-rIvx0piq.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-DIM7KEj5.js
var DEFAULT_ACTIONS = [
	{
		name: "Gift flowers",
		kind: "positive",
		base_points: 3,
		category: "romance"
	},
	{
		name: "Thoughtful card",
		kind: "positive",
		base_points: 5,
		category: "romance"
	},
	{
		name: "Pour water",
		kind: "positive",
		base_points: 1,
		category: "chivalry"
	},
	{
		name: "Open door",
		kind: "positive",
		base_points: 1,
		category: "chivalry"
	},
	{
		name: "Tuck chair",
		kind: "positive",
		base_points: 1,
		category: "chivalry"
	},
	{
		name: "Help put jacket on",
		kind: "positive",
		base_points: 1,
		category: "chivalry"
	},
	{
		name: "Compliment",
		kind: "positive",
		base_points: 1,
		category: "kindness"
	},
	{
		name: "Made a plan so the other person didn’t have to think",
		kind: "positive",
		base_points: 3,
		category: "planning"
	},
	{
		name: "Cooked a meal",
		kind: "positive",
		base_points: 2,
		category: "care"
	},
	{
		name: "Spontaneous thoughtful message / voice note",
		kind: "positive",
		base_points: 1,
		category: "kindness"
	},
	{
		name: "Encouraged rest when they were clearly exhausted",
		kind: "positive",
		base_points: 2,
		category: "rest"
	},
	{
		name: "Remembered something small that was only mentioned once",
		kind: "positive",
		base_points: 2,
		category: "detail"
	},
	{
		name: "Brought favourite chocolate (Dark Lindt Raspberry)",
		kind: "positive",
		base_points: 2,
		category: "detail"
	},
	{
		name: "Took care of something practical without being asked",
		kind: "positive",
		base_points: 2,
		category: "care"
	},
	{
		name: "Silly sasiska comment (not from a bad place, just not thought through)",
		kind: "negative",
		base_points: -2,
		category: "words"
	},
	{
		name: "Negative comment (coming from a bad place)",
		kind: "negative",
		base_points: -5,
		category: "words"
	},
	{
		name: "Was not open with relevant information that could affect the partner",
		kind: "negative",
		base_points: -3,
		category: "trust"
	},
	{
		name: "Forgot a key event",
		kind: "negative",
		base_points: -2,
		category: "memory"
	},
	{
		name: "Left on read for an unreasonable amount of time",
		kind: "negative",
		base_points: -2,
		category: "attention"
	},
	{
		name: "Repeated behaviour after being told it bothered them",
		kind: "negative",
		base_points: -2,
		category: "respect"
	},
	{
		name: "Brought up unrelated past issues during an argument",
		kind: "negative",
		base_points: -2,
		category: "conflict"
	}
];
var STARTER_REWARDS = [
	{
		name: "Breakfast in bed",
		description: "Warm tray, soft pillows, zero rush."
	},
	{
		name: "Back rub / shoulder massage",
		description: "Ten gentle minutes of melting tension."
	},
	{
		name: "Full movie night (no phones)",
		description: "Blankets, snacks, undivided attention."
	},
	{
		name: "Passenger princess for a whole day",
		description: "You drive. They vibe. Absolute royalty mode."
	},
	{
		name: "Cooked meal with proper fresh bread",
		description: "Home-cooked, bread still warm if possible."
	},
	{
		name: "You don’t have to decide anything today evening",
		description: "One person holds the mental load for the night."
	},
	{
		name: "Highland cow / animal-related outing planning",
		description: "Plan a soft adventure with creatures involved."
	}
];
/** Soft sample actions for preference rating during onboarding */
var PREFERENCE_SAMPLES = [
	"Gift flowers",
	"Thoughtful card",
	"Made a plan so the other person didn’t have to think",
	"Encouraged rest when they were clearly exhausted",
	"Remembered something small that was only mentioned once",
	"Took care of something practical without being asked",
	"Silly sasiska comment (not from a bad place, just not thought through)",
	"Left on read for an unreasonable amount of time",
	"Brought up unrelated past issues during an argument"
];
var BADGE_DEFS = {
	consistent_care: {
		title: "Consistent Care",
		description: "Logged kindness three days in a row.",
		check: (s) => s.streak >= 3
	},
	passenger_princess_provider: {
		title: "Passenger Princess Provider",
		description: "Approved a ride-related reward.",
		check: (s) => s.passengerPrincessClaims >= 1
	},
	detail_detective: {
		title: "Detail Detective",
		description: "Five actions with Attention to Detail.",
		check: (s) => s.detailCount >= 5
	},
	rest_enforcer: {
		title: "Rest Enforcer",
		description: "Logged rest encouragement three times.",
		check: (s) => s.restCount >= 3
	},
	bulochka_energy: {
		title: "Bulochka Energy",
		description: "Ten accepted positive actions.",
		check: (s) => s.positiveAccepted >= 10
	},
	soft_accountability: {
		title: "Soft Accountability",
		description: "Reviewed five partner logs with care.",
		check: (s) => s.reviewsDone >= 5
	}
};
async function getProfile(userId) {
	const rows = await (await getSql())`
    select user_id, display_name, bio, avatar_url, theme, partner_nickname,
           notification_prefs, onboarding_step
    from profiles where user_id = ${userId}`;
	if (!rows[0]) return null;
	const p = rows[0];
	if (typeof p.notification_prefs === "string") p.notification_prefs = JSON.parse(p.notification_prefs);
	return p;
}
async function ensureProfile(userId, fallbackName) {
	const existing = await getProfile(userId);
	if (existing) return existing;
	await (await getSql())`
    insert into profiles (user_id, display_name)
    values (${userId}, ${fallbackName || "Little one"})
    on conflict (user_id) do nothing`;
	return await getProfile(userId);
}
async function getActiveCouple(userId) {
	return (await (await getSql())`
    select id, invite_code, user_a, user_b from couples
    where unpaired_at is null and (user_a = ${userId} or user_b = ${userId})
    limit 1`)[0] ?? null;
}
function partnerIdOf(c, userId) {
	if (c.user_a === userId) return c.user_b;
	if (c.user_b === userId) return c.user_a;
	return null;
}
async function seedDefaults(coupleId, userId) {
	const sql = await getSql();
	if (((await sql`
    select count(*)::int as n from action_types where couple_id = ${coupleId}`)[0]?.n ?? 0) > 0) return;
	for (const a of DEFAULT_ACTIONS) await sql`
      insert into action_types (couple_id, name, kind, base_points, category, is_default, created_by)
      values (${coupleId}, ${a.name}, ${a.kind}, ${a.base_points}, ${a.category}, true, ${userId})`;
	for (const r of STARTER_REWARDS) await sql`
      insert into rewards (id, couple_id, created_by, name, description, repeatable, kind)
      values (${id("rw")}, ${coupleId}, ${userId}, ${r.name}, ${r.description}, true, 'gesture')`;
}
async function notify(userId, coupleId, kind, title, body) {
	const sql = await getSql();
	const prefs = (await getProfile(userId))?.notification_prefs;
	if (prefs) {
		if (kind === "action" && !prefs.actions) return;
		if (kind === "reward" && !prefs.rewards) return;
		if (kind === "review" && !prefs.reviews) return;
		if (kind === "summary" && !prefs.summaries) return;
	}
	await sql`
    insert into notifications (id, user_id, couple_id, kind, title, body)
    values (${id("nt")}, ${userId}, ${coupleId}, ${kind}, ${title}, ${body})`;
}
async function computeBalanceLive(userId, coupleId) {
	const sql = await getSql();
	const accepted = await sql`
    select points, kind, status from logged_actions
    where couple_id = ${coupleId}
      and applies_to = ${userId}
      and status in ('pending', 'accepted', 'modified')
      and archived = false`;
	let lifetime_positive = 0;
	let lifetime_negative = 0;
	for (const row of accepted) if (row.kind === "positive") lifetime_positive += Math.max(0, row.points);
	else lifetime_negative += Math.min(0, row.points);
	const points_spent = (await sql`
    select coalesce(sum(points_spent), 0)::int as s from reward_claims
    where couple_id = ${coupleId}
      and claimed_by = ${userId}
      and status in ('approved', 'completed')`)[0]?.s ?? 0;
	return {
		current: accepted.reduce((s, r) => s + r.points, 0) - points_spent,
		lifetime_positive,
		lifetime_negative,
		points_spent
	};
}
async function updateStreak(userId, coupleId) {
	const sql = await getSql();
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const rows = await sql`select current_streak, longest_streak, last_action_date::text as last_action_date
     from streaks where couple_id = ${coupleId} and user_id = ${userId}`;
	if (!rows[0]) {
		await sql`
      insert into streaks (couple_id, user_id, current_streak, longest_streak, last_action_date)
      values (${coupleId}, ${userId}, 1, 1, ${today}::date)`;
		return 1;
	}
	const last = rows[0].last_action_date?.slice(0, 10) ?? null;
	if (last === today) return rows[0].current_streak;
	const next = last === (/* @__PURE__ */ new Date(Date.now() - 864e5)).toISOString().slice(0, 10) ? rows[0].current_streak + 1 : 1;
	await sql`
    update streaks set current_streak = ${next}, longest_streak = ${Math.max(rows[0].longest_streak, next)},
      last_action_date = ${today}::date
    where couple_id = ${coupleId} and user_id = ${userId}`;
	return next;
}
async function evaluateBadges(userId, coupleId) {
	const sql = await getSql();
	const streakRows = await sql`
    select current_streak from streaks where couple_id = ${coupleId} and user_id = ${userId}`;
	const detail = await sql`
    select count(*)::int as n from logged_actions
    where couple_id = ${coupleId} and logged_by = ${userId}
      and attention_to_detail = true and status in ('accepted','modified')`;
	const rest = await sql`
    select count(*)::int as n from logged_actions
    where couple_id = ${coupleId} and logged_by = ${userId}
      and action_name ilike '%rest%' and status in ('accepted','modified')`;
	const pos = await sql`
    select count(*)::int as n from logged_actions
    where couple_id = ${coupleId} and applies_to = ${userId}
      and kind = 'positive' and status in ('accepted','modified')`;
	const reviews = await sql`
    select count(*)::int as n from logged_actions
    where couple_id = ${coupleId} and reviewed_by = ${userId}`;
	const princess = await sql`
    select count(*)::int as n from reward_claims rc
    join rewards r on r.id = rc.reward_id
    where rc.couple_id = ${coupleId} and rc.status in ('approved','completed')
      and r.name ilike '%passenger%'`;
	const stats = {
		streak: streakRows[0]?.current_streak ?? 0,
		detailCount: detail[0]?.n ?? 0,
		restCount: rest[0]?.n ?? 0,
		positiveAccepted: pos[0]?.n ?? 0,
		reviewsDone: reviews[0]?.n ?? 0,
		passengerPrincessClaims: princess[0]?.n ?? 0
	};
	for (const [key, def] of Object.entries(BADGE_DEFS)) {
		if (!def.check(stats)) continue;
		await sql`
      insert into badges (user_id, couple_id, badge_key)
      values (${userId}, ${coupleId}, ${key})
      on conflict do nothing`;
	}
}
function weeklySummaryText(name, partner, balance, streak, recentPos) {
	return [
		`${name}, this little week of paws was gentle and real.`,
		`You and ${partner} stacked ${recentPos} soft positives together.`,
		`Your care balance sits at ${balance.current} paw-points (lifetime warmth ${balance.lifetime_positive}, little oopsies ${balance.lifetime_negative}).`,
		streak > 0 ? `Your kindness streak is ${streak} day${streak === 1 ? "" : "s"} — bulochka energy is strong.` : `A fresh week is waiting for your next tiny pawmise.`
	].join(" ");
}
function csv(s) {
	return `"${String(s ?? "").replace(/"/g, "\"\"")}"`;
}
async function buildExportCsv(coupleId) {
	const rows = await (await getSql())`
    select * from logged_actions where couple_id = ${coupleId} order by created_at`;
	const lines = [[
		"id",
		"action_name",
		"kind",
		"points",
		"status",
		"logged_by",
		"applies_to",
		"note",
		"category",
		"created_at"
	].join(",")];
	for (const r of rows) lines.push([
		r.id,
		csv(r.action_name),
		r.kind,
		r.points,
		r.status,
		r.logged_by,
		r.applies_to,
		csv(r.note),
		csv(r.category),
		r.created_at
	].join(","));
	return lines.join("\n");
}
var getMe_createServerFn_handler = createServerRpc({
	id: "1c773d0b3469149f9aeb188fb89afb0d5394e28e05c24a331eacd6709da216e1",
	name: "getMe",
	filename: "src/lib/paws/server.ts"
}, (opts) => getMe.__executeServer(opts));
var getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMe_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	const sql = await getSql();
	const users = await sql`
      select name, image from "user" where id = ${userId}`;
	const profile = await ensureProfile(userId, users[0]?.name ?? "Little one");
	if (!profile.avatar_url && users[0]?.image) {
		await sql`update profiles set avatar_url = ${users[0].image} where user_id = ${userId}`;
		profile.avatar_url = users[0].image;
	}
	return {
		profile,
		couple: await getActiveCouple(userId),
		authName: users[0]?.name ?? null
	};
});
var updateProfile_createServerFn_handler = createServerRpc({
	id: "1e05cae8df4813afdf7f8a46a1102f0fa051c8c3cf1c16294bafed0d22175fdf",
	name: "updateProfile",
	filename: "src/lib/paws/server.ts"
}, (opts) => updateProfile.__executeServer(opts));
var updateProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(updateProfile_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	await ensureProfile(userId, data.display_name ?? "Little one");
	const sql = await getSql();
	const cur = await getProfile(userId);
	if (!cur) throw new Error("Profile missing");
	const display_name = data.display_name?.trim() || cur.display_name;
	const bio = data.bio ?? cur.bio;
	const avatar_url = data.avatar_url !== void 0 ? data.avatar_url : cur.avatar_url;
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
var createInvite_createServerFn_handler = createServerRpc({
	id: "c3dd1cfce340227a234cc008aeff27afbaa073281b7fd3025f071ccd94d5098a",
	name: "createInvite",
	filename: "src/lib/paws/server.ts"
}, (opts) => createInvite.__executeServer(opts));
var createInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createInvite_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
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
	return {
		id: coupleId,
		invite_code: code,
		user_a: userId,
		user_b: null
	};
});
var joinWithCode_createServerFn_handler = createServerRpc({
	id: "c509154c64a9328da7218430403d82fcbd041ea90d9cf2c3ed2e38bf046db0ad",
	name: "joinWithCode",
	filename: "src/lib/paws/server.ts"
}, (opts) => joinWithCode.__executeServer(opts));
var joinWithCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((code) => code.trim().toUpperCase()).handler(joinWithCode_createServerFn_handler, async ({ context, data: code }) => {
	const { userId } = context;
	if (await getActiveCouple(userId)) throw new Error("You’re already in a little pair");
	const sql = await getSql();
	const c = (await sql`
      select id, invite_code, user_a, user_b from couples
      where invite_code = ${code} and unpaired_at is null`)[0];
	if (!c) throw new Error("That paw-code doesn’t match any little world");
	if (c.user_a === userId) throw new Error("That’s your own invite, softie");
	if (c.user_b) throw new Error("This pair already has two hearts");
	await sql`update couples set user_b = ${userId} where id = ${c.id} and user_b is null`;
	for (const r of STARTER_REWARDS) await sql`
        insert into rewards (id, couple_id, created_by, name, description, repeatable, kind)
        values (${id("rw")}, ${c.id}, ${userId}, ${r.name}, ${r.description}, true, 'gesture')`;
	const aName = (await getProfile(c.user_a))?.display_name ?? "Your partner";
	const bName = (await getProfile(userId))?.display_name ?? "Your partner";
	await notify(c.user_a, c.id, "action", "Paws linked", `${bName} joined your little world.`);
	await notify(userId, c.id, "action", "Paws linked", `You’re paired with ${aName}. Soft mode: on.`);
	await sql`update profiles set onboarding_step = 'done' where user_id = ${userId}`;
	await sql`update profiles set onboarding_step = 'done' where user_id = ${c.user_a}`;
	return {
		ok: true,
		couple_id: c.id
	};
});
var unpair_createServerFn_handler = createServerRpc({
	id: "996ca74147b1116cf1a29f7ea0a9aa272e6ebc0bd5af0300ee3802ec1fd8a5af",
	name: "unpair",
	filename: "src/lib/paws/server.ts"
}, (opts) => unpair.__executeServer(opts));
var unpair = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(unpair_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c) throw new Error("Not paired");
	const sql = await getSql();
	let exportCsv = null;
	if (data.exportFirst) exportCsv = await buildExportCsv(c.id);
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
	if (c.user_b) await sql`update profiles set onboarding_step = 'pairing' where user_id = ${c.user_b}`;
	return {
		ok: true,
		exportCsv
	};
});
var savePreferences_createServerFn_handler = createServerRpc({
	id: "ff49534305a973200ad2ef663177d30e7c9dc68d25c79c30e298c5d8110e70e8",
	name: "savePreferences",
	filename: "src/lib/paws/server.ts"
}, (opts) => savePreferences.__executeServer(opts));
var savePreferences = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((prefs) => prefs).handler(savePreferences_createServerFn_handler, async ({ context, data: prefs }) => {
	const { userId } = context;
	const sql = await getSql();
	for (const p of prefs) await sql`
        insert into action_preferences (user_id, action_type_id, preferred_points)
        values (${userId}, ${p.action_type_id}, ${p.preferred_points})
        on conflict (user_id, action_type_id)
        do update set preferred_points = excluded.preferred_points`;
	return { ok: true };
});
var listActionTypes_createServerFn_handler = createServerRpc({
	id: "e525b9d47934db21b6cdba190c89e6d660e3d97888a35c7140fd5bb27e0b62b7",
	name: "listActionTypes",
	filename: "src/lib/paws/server.ts"
}, (opts) => listActionTypes.__executeServer(opts));
var listActionTypes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listActionTypes_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c || !c.user_b) return [];
	return (await getSql())`
      select at.id, at.couple_id, at.name, at.kind, at.base_points, at.category,
             at.is_default, at.archived,
             ap.preferred_points
      from action_types at
      left join action_preferences ap
        on ap.action_type_id = at.id and ap.user_id = ${partnerIdOf(c, userId)}
      where at.couple_id = ${c.id} and at.archived = false
      order by at.kind desc, at.base_points desc, at.name`;
});
var listMyPreferenceTargets_createServerFn_handler = createServerRpc({
	id: "7bc54821e2f231a578308a97c9dc2f2b18ce99eb878169d900d834411dc894b1",
	name: "listMyPreferenceTargets",
	filename: "src/lib/paws/server.ts"
}, (opts) => listMyPreferenceTargets.__executeServer(opts));
var listMyPreferenceTargets = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyPreferenceTargets_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c) return [];
	const rows = await (await getSql())`
      select at.id, at.couple_id, at.name, at.kind, at.base_points, at.category,
             at.is_default, at.archived, at.base_points as preferred_points,
             ap.preferred_points as my_points
      from action_types at
      left join action_preferences ap
        on ap.action_type_id = at.id and ap.user_id = ${userId}
      where at.couple_id = ${c.id} and at.archived = false
      order by at.kind desc, at.name`;
	const set = new Set(PREFERENCE_SAMPLES);
	return rows.filter((r) => set.has(r.name));
});
var upsertActionType_createServerFn_handler = createServerRpc({
	id: "dcb4bc31d77a19e6e1f4f296a5bc5f30a282ed52a807b4f37a541e298c4501ed",
	name: "upsertActionType",
	filename: "src/lib/paws/server.ts"
}, (opts) => upsertActionType.__executeServer(opts));
var upsertActionType = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(upsertActionType_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
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
	return { id: (await sql`
      insert into action_types (couple_id, name, kind, base_points, category, created_by)
      values (${c.id}, ${data.name}, ${data.kind}, ${data.base_points}, ${data.category ?? "general"}, ${userId})
      returning id`)[0].id };
});
var logAction_createServerFn_handler = createServerRpc({
	id: "8e081f67e1a3ac7163d372ebb3ae6400764e3f7d4c4f3abb2f23903058ffb378",
	name: "logAction",
	filename: "src/lib/paws/server.ts"
}, (opts) => logAction.__executeServer(opts));
var logAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(logAction_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c?.user_b) throw new Error("You need a partner paw first");
	const partner = partnerIdOf(c, userId);
	const applies_to = data.direction === "self" ? userId : partner;
	const sql = await getSql();
	const at = (await sql`select id, name, kind, base_points, category from action_types
       where id = ${data.action_type_id} and couple_id = ${c.id} and archived = false`)[0];
	if (!at) throw new Error("Action not found");
	const pref = await sql`
      select preferred_points from action_preferences
      where user_id = ${applies_to} and action_type_id = ${at.id}`;
	let points = data.points_override ?? pref[0]?.preferred_points ?? at.base_points;
	const detail = Boolean(data.attention_to_detail) && at.kind === "positive";
	if (detail) points += 2;
	if (at.kind === "negative" && points > 0) points = -Math.abs(points);
	if (at.kind === "positive" && points < 0) points = Math.abs(points);
	const photo = data.photo_data && data.photo_data.length < 4e5 ? data.photo_data : null;
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
	const logger = await getProfile(userId);
	await notify(partner, c.id, "action", `${logger?.display_name ?? "Your little prince"} logged something`, `${at.name} · ${points > 0 ? "+" : ""}${points} paws — review when you’re ready.`);
	await updateStreak(userId, c.id);
	await evaluateBadges(userId, c.id);
	return { id: actionId };
});
var reviewAction_createServerFn_handler = createServerRpc({
	id: "1cc68e0b373144ec0b474769010fcf837b4400ca873d6b650a7bac30bc8bd9c0",
	name: "reviewAction",
	filename: "src/lib/paws/server.ts"
}, (opts) => reviewAction.__executeServer(opts));
var reviewAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(reviewAction_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c?.user_b) throw new Error("Not paired");
	const sql = await getSql();
	const a = (await sql`
      select * from logged_actions where id = ${data.id} and couple_id = ${c.id}`)[0];
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
	} else if (data.decision === "modify") await sql`
        update logged_actions set
          status = 'modified',
          points = ${data.points ?? a.points},
          category = ${data.category ?? a.category},
          note = ${data.note ?? a.note},
          reviewed_at = now(), reviewed_by = ${userId}, updated_at = now()
        where id = ${a.id}`;
	else await sql`
        update logged_actions set
          status = 'accepted',
          reviewed_at = now(), reviewed_by = ${userId}, updated_at = now()
        where id = ${a.id}`;
	const reviewer = await getProfile(userId);
	await notify(a.logged_by, c.id, "review", "A soft review landed", `${reviewer?.display_name ?? "Partner"} ${data.decision === "decline" ? "gently declined" : data.decision === "modify" ? "tweaked" : "accepted"} “${a.action_name}”.`);
	await evaluateBadges(userId, c.id);
	return { ok: true };
});
var editLoggedAction_createServerFn_handler = createServerRpc({
	id: "49ae19a486b3a184fac3cb8f48788b14ffcb5fb60a30ab61501c46fc317fbff4",
	name: "editLoggedAction",
	filename: "src/lib/paws/server.ts"
}, (opts) => editLoggedAction.__executeServer(opts));
var editLoggedAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(editLoggedAction_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c) throw new Error("Not paired");
	const sql = await getSql();
	const a = (await sql`
      select * from logged_actions where id = ${data.id} and couple_id = ${c.id}`)[0];
	if (!a) throw new Error("Not found");
	if (a.logged_by !== userId) throw new Error("Only the logger can edit");
	if (new Date(a.editable_until).getTime() < Date.now()) throw new Error("Edit window closed (24h pawmise)");
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
var listHistory_createServerFn_handler = createServerRpc({
	id: "059a3407ff2ccb383c1b40e5181f6666e70648eeb11e37301ec3c68214d46cf0",
	name: "listHistory",
	filename: "src/lib/paws/server.ts"
}, (opts) => listHistory.__executeServer(opts));
var listHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((q) => q ?? {}).handler(listHistory_createServerFn_handler, async ({ context, data: q }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c) return [];
	let rows = await (await getSql())`
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
		rows = rows.filter((r) => r.action_name.toLowerCase().includes(s) || r.note.toLowerCase().includes(s) || r.category.toLowerCase().includes(s));
	}
	if (q.kind) rows = rows.filter((r) => r.kind === q.kind);
	if (q.status) rows = rows.filter((r) => r.status === q.status);
	return rows;
});
var exportHistory_createServerFn_handler = createServerRpc({
	id: "9b1df436ed6223eebcf1682aef0b6de4d85274852e2ce71051fba4bfe5afe60d",
	name: "exportHistory",
	filename: "src/lib/paws/server.ts"
}, (opts) => exportHistory.__executeServer(opts));
var exportHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(exportHistory_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c) return { csv: "" };
	return { csv: await buildExportCsv(c.id) };
});
var requestDeleteAction_createServerFn_handler = createServerRpc({
	id: "12b265f94764636f8ced42d605e048ae2aa586ffa6d7eca01e57ca4d86cc61ab",
	name: "requestDeleteAction",
	filename: "src/lib/paws/server.ts"
}, (opts) => requestDeleteAction.__executeServer(opts));
var requestDeleteAction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(requestDeleteAction_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c?.user_b) throw new Error("Not paired");
	const partner = partnerIdOf(c, userId);
	const sql = await getSql();
	const existing = await sql`
      select id, requested_by from deletion_requests
      where couple_id = ${c.id} and entry_type = ${data.entry_type}
        and status = 'pending'
        and (entry_id is not distinct from ${data.entry_id ?? null})`;
	if (existing[0] && existing[0].requested_by !== userId) {
		await sql`update deletion_requests set status = 'approved', approved_by = ${userId} where id = ${existing[0].id}`;
		if (data.entry_type === "history_wipe") await sql`delete from logged_actions where couple_id = ${c.id}`;
		else if (data.entry_id) await sql`delete from logged_actions where id = ${data.entry_id} and couple_id = ${c.id}`;
		return { status: "approved" };
	}
	if (existing[0]?.requested_by === userId) return { status: "pending" };
	await sql`
      insert into deletion_requests (id, couple_id, entry_type, entry_id, requested_by)
      values (${id("dr")}, ${c.id}, ${data.entry_type}, ${data.entry_id ?? null}, ${userId})`;
	const me = await getProfile(userId);
	await notify(partner, c.id, "review", "Delete pawmise needs a second yes", `${me?.display_name ?? "Partner"} asked to ${data.entry_type === "history_wipe" ? "wipe history" : "delete an entry"}. Open settings to agree.`);
	return { status: "pending" };
});
var listRewards_createServerFn_handler = createServerRpc({
	id: "62f91e5a82b171b97450eb9e508629fa13aef6271927fc25fd54ca2c38fa277b",
	name: "listRewards",
	filename: "src/lib/paws/server.ts"
}, (opts) => listRewards.__executeServer(opts));
var listRewards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listRewards_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c) return [];
	return (await getSql())`
      select r.*, p.display_name as created_by_name
      from rewards r
      left join profiles p on p.user_id = r.created_by
      where r.couple_id = ${c.id} and r.archived = false
      order by r.kind, r.name`;
});
var upsertReward_createServerFn_handler = createServerRpc({
	id: "c29955c003d5e773d81812a67cca2f2b62b01bbb5d915a503216c60911b70d84",
	name: "upsertReward",
	filename: "src/lib/paws/server.ts"
}, (opts) => upsertReward.__executeServer(opts));
var upsertReward = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(upsertReward_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c?.user_b) throw new Error("Pair first");
	const sql = await getSql();
	if (data.id) {
		const r = (await sql`select * from rewards where id = ${data.id} and couple_id = ${c.id}`)[0];
		if (!r) throw new Error("Missing reward");
		if (data.point_cost !== void 0 && data.point_cost !== null) {
			if (r.created_by === userId) throw new Error("Partner sets the paw-cost for your wishlist");
			await sql`
          update rewards set point_cost = ${data.point_cost}, cost_set_by = ${userId}
          where id = ${r.id}`;
		}
		if (r.created_by === userId) await sql`
          update rewards set
            name = ${data.name},
            description = ${data.description ?? r.description},
            kind = ${data.kind ?? r.kind},
            repeatable = ${data.repeatable ?? r.repeatable},
            archived = ${data.archive ?? false}
          where id = ${r.id}`;
		return { id: r.id };
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
var claimReward_createServerFn_handler = createServerRpc({
	id: "f61f7fc76838e223cb1680c28832e614cc478c5a073cdbc2c93e3031f4123aca",
	name: "claimReward",
	filename: "src/lib/paws/server.ts"
}, (opts) => claimReward.__executeServer(opts));
var claimReward = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(claimReward_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c?.user_b) throw new Error("Not paired");
	const partner = partnerIdOf(c, userId);
	const sql = await getSql();
	const r = (await sql`
      select * from rewards where id = ${data.reward_id} and couple_id = ${c.id} and archived = false`)[0];
	if (!r) throw new Error("Reward missing");
	if (r.created_by !== userId) throw new Error("You claim rewards from your own list");
	if (r.point_cost == null) throw new Error("Partner hasn’t set a paw-cost yet");
	const claimId = id("rc");
	await sql`
      insert into reward_claims (id, reward_id, couple_id, claimed_by, status, points_spent)
      values (${claimId}, ${r.id}, ${c.id}, ${userId}, 'pending', ${r.point_cost})`;
	const me = await getProfile(userId);
	await notify(partner, c.id, "reward", `${me?.display_name ?? "Someone soft"} claimed a reward`, `“${r.name}” for ${r.point_cost} paws — approve when it feels right.`);
	return { id: claimId };
});
var resolveClaim_createServerFn_handler = createServerRpc({
	id: "82ec0a7d0d5a008b332cd815677f0d215f94f398ddcdd7a75f3c6ef4b235db5e",
	name: "resolveClaim",
	filename: "src/lib/paws/server.ts"
}, (opts) => resolveClaim.__executeServer(opts));
var resolveClaim = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(resolveClaim_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c?.user_b) throw new Error("Not paired");
	const sql = await getSql();
	const claim = (await sql`
      select rc.*, r.name as reward_name, r.created_by
      from reward_claims rc join rewards r on r.id = rc.reward_id
      where rc.id = ${data.id} and rc.couple_id = ${c.id}`)[0];
	if (!claim) throw new Error("Claim missing");
	if (data.decision === "approve") {
		if (claim.claimed_by === userId) throw new Error("Partner approves claims");
		if (claim.status !== "pending") throw new Error("Already settled");
		await sql`
        update reward_claims set status = 'approved', resolved_at = now()
        where id = ${claim.id}`;
		await evaluateBadges(userId, c.id);
		await notify(claim.claimed_by, c.id, "reward", "Reward paw-approved", `“${claim.reward_name}” is yours. Go soft and enjoy.`);
	} else {
		if (claim.status === "cancelled") return { ok: true };
		await sql`
        update reward_claims set status = 'cancelled', resolved_at = now(), points_spent = 0
        where id = ${claim.id}`;
		await notify(claim.claimed_by === userId ? partnerIdOf(c, userId) : claim.claimed_by, c.id, "reward", "Reward cancelled", `“${claim.reward_name}” was cancelled and paws returned.`);
	}
	return { ok: true };
});
var buyWishlistItem_createServerFn_handler = createServerRpc({
	id: "e92058b2b0461677eca2281128f51b27956296e8e1462afcd674d85b71af7324",
	name: "buyWishlistItem",
	filename: "src/lib/paws/server.ts"
}, (opts) => buyWishlistItem.__executeServer(opts));
var buyWishlistItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(buyWishlistItem_createServerFn_handler, async ({ context, data }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c?.user_b) throw new Error("Not paired");
	const sql = await getSql();
	const r = (await sql`
      select * from rewards where id = ${data.reward_id} and couple_id = ${c.id}
        and kind = 'wishlist' and archived = false`)[0];
	if (!r) throw new Error("Wishlist item missing");
	if (r.created_by === userId) throw new Error("Partner buys your wishlist item");
	if (r.point_cost == null) throw new Error("Set a point value first");
	const actionId = id("la");
	const editable = hoursFromNow(24).toISOString();
	const review = hoursFromNow(48).toISOString();
	await sql`
      insert into logged_actions (
        id, couple_id, action_name, kind, logged_by, applies_to, direction,
        points, note, category, status, editable_until, review_until
      ) values (
        ${actionId}, ${c.id}, ${"Wishlist: " + r.name}, 'positive', ${userId}, ${userId}, 'self',
        ${r.point_cost}, ${"Bought for partner — soft credit"}, 'wishlist', 'accepted',
        ${editable}::timestamptz, ${review}::timestamptz
      )`;
	if (!r.repeatable) await sql`update rewards set archived = true where id = ${r.id}`;
	const me = await getProfile(userId);
	await notify(r.created_by, c.id, "reward", "Wishlist magic", `${me?.display_name ?? "Partner"} bought “${r.name}” and earned ${r.point_cost} paws.`);
	return { id: actionId };
});
var getDashboard_createServerFn_handler = createServerRpc({
	id: "7f5866b7484194273b46013b8ec35aeaab8572a97445b495054cbe8964edbacb",
	name: "getDashboard",
	filename: "src/lib/paws/server.ts"
}, (opts) => getDashboard.__executeServer(opts));
var getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getDashboard_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	const sql = await getSql();
	const profile = await ensureProfile(userId, (await sql`
      select name, image from "user" where id = ${userId}`)[0]?.name ?? "Little one");
	const coupleRow = await getActiveCouple(userId);
	let couple = null;
	let partner = null;
	let balance = {
		current: 0,
		lifetime_positive: 0,
		lifetime_negative: 0,
		points_spent: 0
	};
	let partnerBalance = null;
	let streak = 0;
	let badges = [];
	let pendingReviews = [];
	let pendingClaims = [];
	let recent = [];
	let weeklySummary = "Pair up to open your shared little notebook of paws.";
	let notifications = [];
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
			is_complete: Boolean(coupleRow.user_b)
		};
		if (coupleRow.user_b) {
			balance = await computeBalanceLive(userId, coupleRow.id);
			if (pid) partnerBalance = await computeBalanceLive(pid, coupleRow.id);
			streak = (await sql`
          select current_streak from streaks where couple_id = ${coupleRow.id} and user_id = ${userId}`)[0]?.current_streak ?? 0;
			badges = (await sql`
          select badge_key, earned_at from badges
          where couple_id = ${coupleRow.id} and user_id = ${userId}`).map((b) => ({
				badge_key: b.badge_key,
				title: BADGE_DEFS[b.badge_key]?.title ?? b.badge_key,
				description: BADGE_DEFS[b.badge_key]?.description ?? "",
				earned_at: b.earned_at
			}));
			pendingReviews = await sql`
          select * from logged_actions
          where couple_id = ${coupleRow.id}
            and logged_by != ${userId}
            and status = 'pending'
            and archived = false
          order by created_at desc`;
			pendingClaims = await sql`
          select rc.*, r.name as reward_name, p.display_name as claimer_name
          from reward_claims rc
          join rewards r on r.id = rc.reward_id
          left join profiles p on p.user_id = rc.claimed_by
          where rc.couple_id = ${coupleRow.id}
            and rc.status = 'pending'
            and rc.claimed_by != ${userId}
          order by rc.created_at desc`;
			recent = await sql`
          select la.*, pl.display_name as logger_name
          from logged_actions la
          left join profiles pl on pl.user_id = la.logged_by
          where la.couple_id = ${coupleRow.id}
          order by la.created_at desc limit 12`;
			const weekPos = await sql`
          select count(*)::int as n from logged_actions
          where couple_id = ${coupleRow.id} and kind = 'positive'
            and created_at > now() - interval '7 days'
            and status in ('pending','accepted','modified')`;
			const partnerLabel = partner?.display_name ?? (profile.partner_nickname || "your person");
			weeklySummary = weeklySummaryText(profile.display_name, partnerLabel, balance, streak, weekPos[0]?.n ?? 0);
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
		pendingClaims,
		recent,
		weeklySummary,
		notifications
	};
});
var markNotificationsRead_createServerFn_handler = createServerRpc({
	id: "8948e7a8bfde3ed5c0f783397133bc6530022e3196ac94444499b05d3d6b045d",
	name: "markNotificationsRead",
	filename: "src/lib/paws/server.ts"
}, (opts) => markNotificationsRead.__executeServer(opts));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(markNotificationsRead_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	await (await getSql())`update notifications set read = true where user_id = ${userId}`;
	return { ok: true };
});
var settleExpired_createServerFn_handler = createServerRpc({
	id: "376197e0886179f2f0580faa726cb9f3aecaa63ac85f5e40033a9950d477de01",
	name: "settleExpired",
	filename: "src/lib/paws/server.ts"
}, (opts) => settleExpired.__executeServer(opts));
var settleExpired = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(settleExpired_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	const c = await getActiveCouple(userId);
	if (!c) return { ok: true };
	await (await getSql())`
      update logged_actions set status = 'accepted', reviewed_at = now()
      where couple_id = ${c.id} and status = 'pending' and review_until < now()`;
	return { ok: true };
});
//#endregion
export { buyWishlistItem_createServerFn_handler, claimReward_createServerFn_handler, createInvite_createServerFn_handler, editLoggedAction_createServerFn_handler, exportHistory_createServerFn_handler, getDashboard_createServerFn_handler, getMe_createServerFn_handler, joinWithCode_createServerFn_handler, listActionTypes_createServerFn_handler, listHistory_createServerFn_handler, listMyPreferenceTargets_createServerFn_handler, listRewards_createServerFn_handler, logAction_createServerFn_handler, markNotificationsRead_createServerFn_handler, requestDeleteAction_createServerFn_handler, resolveClaim_createServerFn_handler, reviewAction_createServerFn_handler, savePreferences_createServerFn_handler, settleExpired_createServerFn_handler, unpair_createServerFn_handler, updateProfile_createServerFn_handler, upsertActionType_createServerFn_handler, upsertReward_createServerFn_handler };
