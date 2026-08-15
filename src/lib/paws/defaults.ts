export type DefaultAction = {
  name: string;
  kind: "positive" | "negative";
  base_points: number;
  category: string;
};

export const DEFAULT_ACTIONS: DefaultAction[] = [
  { name: "Gift flowers", kind: "positive", base_points: 3, category: "receiving gifts" },
  { name: "Thoughtful card", kind: "positive", base_points: 5, category: "receiving gifts" },
  { name: "Pour water", kind: "positive", base_points: 1, category: "acts of service" },
  { name: "Open door", kind: "positive", base_points: 1, category: "acts of service" },
  { name: "Tuck chair", kind: "positive", base_points: 1, category: "acts of service" },
  { name: "Help put jacket on", kind: "positive", base_points: 1, category: "acts of service" },
  { name: "Compliment", kind: "positive", base_points: 1, category: "words of affirmation" },
  {
    name: "Made a plan so the other person didn’t have to think",
    kind: "positive",
    base_points: 3,
    category: "acts of service",
  },
  { name: "Cooked a meal", kind: "positive", base_points: 2, category: "acts of service" },
  {
    name: "Random thoughtful message or voice note",
    kind: "positive",
    base_points: 1,
    category: "words of affirmation",
  },
  {
    name: "Surprise Chocolate / Snacks",
    kind: "positive",
    base_points: 1,
    category: "receiving gifts",
  },
  {
    name: "Remembered something small that was only mentioned once",
    kind: "positive",
    base_points: 2,
    category: "quality time",
  },
  {
    name: "Brought favourite chocolate (Dark Lindt Raspberry)",
    kind: "positive",
    base_points: 2,
    category: "receiving gifts",
  },
  {
    name: "Took care of something practical without being asked",
    kind: "positive",
    base_points: 2,
    category: "acts of service",
  },
  {
    name: "Silly sasiska comment (not from a bad place, just not thought through)",
    kind: "negative",
    base_points: -2,
    category: "words of affirmation",
  },
  {
    name: "Mean Comment (Intention to hurt partner)",
    kind: "negative",
    base_points: -5,
    category: "words of affirmation",
  },
  {
    name: "Poor Gentleman (Forgot to tuck chair, pour water, open door, help with jacket, didn't wait etc.)",
    kind: "negative",
    base_points: -1,
    category: "acts of service",
  },
  {
    name: "Was not open with relevant information that could affect the partner",
    kind: "negative",
    base_points: -3,
    category: "trust",
  },
  { name: "Forgot a key event", kind: "negative", base_points: -2, category: "quality time" },
  {
    name: "Left on read for an unreasonable amount of time",
    kind: "negative",
    base_points: -2,
    category: "quality time",
  },
  {
    name: "Repeated behaviour after being told it bothered them",
    kind: "negative",
    base_points: -3,
    category: "respect",
  },
  {
    name: "Brought up unrelated past issues during an argument",
    kind: "negative",
    base_points: -2,
    category: "conflict",
  },
];

export const REMOVED_DEFAULT_ACTIONS = [
  "Encouraged rest when they were clearly exhausted",
];

export const RENAMED_DEFAULT_ACTIONS: Record<string, string> = {
  "Spontaneous thoughtful message / voice note": "Random thoughtful message or voice note",
  "Negative comment (coming from a bad place)": "Mean Comment (Intention to hurt partner)",
};

export const STARTER_REWARDS = [
  { name: "Breakfast in bed", description: "Warm tray, soft pillows, zero rush." },
  { name: "Back rub / shoulder massage", description: "Ten gentle minutes of melting tension." },
  { name: "Full movie night (no phones)", description: "Blankets, snacks, undivided attention." },
  {
    name: "Passenger princess for a whole day",
    description: "You drive. They vibe. Absolute royalty mode.",
  },
  {
    name: "Cooked meal with proper fresh bread",
    description: "Home-cooked, bread still warm if possible.",
  },
  {
    name: "You don’t have to decide anything today evening",
    description: "One person holds the mental load for the night.",
  },
  {
    name: "Highland cow / animal-related outing planning",
    description: "Plan a soft adventure with creatures involved.",
  },
];

export const PREFERENCE_SAMPLES = [
  "Gift flowers",
  "Thoughtful card",
  "Made a plan so the other person didn’t have to think",
  "Random thoughtful message or voice note",
  "Surprise Chocolate / Snacks",
  "Remembered something small that was only mentioned once",
  "Took care of something practical without being asked",
  "Silly sasiska comment (not from a bad place, just not thought through)",
  "Mean Comment (Intention to hurt partner)",
  "Poor Gentleman (Forgot to tuck chair, pour water, open door, help with jacket, didn't wait etc.)",
  "Left on read for an unreasonable amount of time",
  "Brought up unrelated past issues during an argument",
];

export const ACTION_CATEGORIES = [
  "words of affirmation",
  "quality time",
  "acts of service",
  "receiving gifts",
  "physical touch",
  "kindness",
  "care",
  "trust",
  "respect",
  "conflict",
  "general",
] as const;

/** Groups that cannot be renamed or archived (love languages + general). */
export const LOCKED_CATEGORIES = [
  "words of affirmation",
  "quality time",
  "acts of service",
  "receiving gifts",
  "physical touch",
  "general",
] as const;

export function isLockedCategory(name: string | undefined | null): boolean {
  if (!name) return false;
  return (LOCKED_CATEGORIES as readonly string[]).includes(name.trim().toLowerCase());
}

export type BadgeStats = {
  streak: number;
  detailCount: number;
  restCount: number;
  positiveAccepted: number;
  negativeAccepted: number;
  reviewsDone: number;
  passengerPrincessClaims: number;
  lifetimePositivePoints: number;
  lifetimeNegativePoints: number;
  loveLangCounts: Record<string, number>;
};

export type BadgeDef = {
  title: string;
  description: string;
  how: string;
  check: (s: BadgeStats) => boolean;
};

const LOVE_LANG_KEYS = [
  "words of affirmation",
  "quality time",
  "acts of service",
  "receiving gifts",
  "physical touch",
] as const;

type LoveLangKey = (typeof LOVE_LANG_KEYS)[number];

const LL_TIERS: { key: string; label: string; n: number }[] = [
  { key: "novice", label: "Novice", n: 2 },
  { key: "beginner", label: "Beginner", n: 5 },
  { key: "intermediate", label: "Intermediate", n: 10 },
  { key: "adept", label: "Adept", n: 20 },
  { key: "expert", label: "Expert", n: 40 },
  { key: "master", label: "Master", n: 75 },
];

const LL_META: Record<LoveLangKey, { punPrefix: (tier: string) => string }> = {
  "words of affirmation": {
    punPrefix: (tier) =>
      ({
        Novice: "Word Warm-Up",
        Beginner: "Sweet Talker",
        Intermediate: "Compliment Composer",
        Adept: "Affirmation Ace",
        Expert: "Poetry in Motion",
        Master: "Silver-Tongued Legend",
      })[tier] ?? `Words ${tier}`,
  },
  "quality time": {
    punPrefix: (tier) =>
      ({
        Novice: "Presence Pupil",
        Beginner: "Together Tyro",
        Intermediate: "Undivided Attention",
        Adept: "Quality Timer",
        Expert: "Hourglass Hero",
        Master: "Time Lord of Love",
      })[tier] ?? `Time ${tier}`,
  },
  "acts of service": {
    punPrefix: (tier) =>
      ({
        Novice: "Helpful Hatchling",
        Beginner: "Service Scout",
        Intermediate: "Chore Whisperer",
        Adept: "Doer of Deeds",
        Expert: "Service Superstar",
        Master: "Acts of Legend",
      })[tier] ?? `Service ${tier}`,
  },
  "receiving gifts": {
    punPrefix: (tier) =>
      ({
        Novice: "Thoughtful Token",
        Beginner: "Present Pup",
        Intermediate: "Gift Wrangler",
        Adept: "Surprise Specialist",
        Expert: "Parcel Pro",
        Master: "Gifted Genius",
      })[tier] ?? `Gifts ${tier}`,
  },
  "physical touch": {
    punPrefix: (tier) =>
      ({
        Novice: "Soft Touch",
        Beginner: "Hands-On Beginner",
        Intermediate: "Warm Embrace",
        Adept: "Touché",
        Expert: "Contact Specialist",
        Master: "Touch Maestro",
      })[tier] ?? `Touch ${tier}`,
  },
};

function buildLoveLangBadges(): Record<string, BadgeDef> {
  const out: Record<string, BadgeDef> = {};
  for (const lang of LOVE_LANG_KEYS) {
    const meta = LL_META[lang];
    for (const tier of LL_TIERS) {
      const key = `ll_${lang.replace(/\s+/g, "_")}_${tier.key}`;
      const title = meta.punPrefix(tier.label);
      out[key] = {
        title,
        description: `${tier.label} in ${lang}: ${tier.n}+ accepted positive actions in this love language logged against you.`,
        how: `Have ${tier.n} or more accepted positive actions tagged “${lang}” raised for you.`,
        check: (s) => (s.loveLangCounts[lang] ?? 0) >= tier.n,
      };
    }
  }
  return out;
}

export const BADGE_DEFS: Record<string, BadgeDef> = {
  streak_3: {
    title: "Consistent Care",
    description: "Three days in a row of logged kindness.",
    how: "Log at least one action on three consecutive days.",
    check: (s) => s.streak >= 3,
  },
  streak_7: {
    title: "Week of Warmth",
    description: "A full week streak of raised Brownie Points.",
    how: "Keep a 7-day logging streak.",
    check: (s) => s.streak >= 7,
  },
  streak_14: {
    title: "Fortnight Flame",
    description: "Fourteen days of continuous care.",
    how: "Keep a 14-day logging streak.",
    check: (s) => s.streak >= 14,
  },
  streak_30: {
    title: "Monthly Momentum",
    description: "A whole month of showing up.",
    how: "Keep a 30-day logging streak.",
    check: (s) => s.streak >= 30,
  },
  pos_10: {
    title: "Bulochka Energy",
    description: "Ten accepted positive actions in your favour.",
    how: "Receive 10 accepted positive actions.",
    check: (s) => s.positiveAccepted >= 10,
  },
  pos_25: {
    title: "Pawsitive Pro",
    description: "Twenty-five accepted positives.",
    how: "Receive 25 accepted positive actions.",
    check: (s) => s.positiveAccepted >= 25,
  },
  pos_50: {
    title: "Half-Century of Care",
    description: "Fifty accepted positives stacked.",
    how: "Receive 50 accepted positive actions.",
    check: (s) => s.positiveAccepted >= 50,
  },
  pos_100: {
    title: "Century of Softness",
    description: "One hundred accepted positives — legendary.",
    how: "Receive 100 accepted positive actions.",
    check: (s) => s.positiveAccepted >= 100,
  },
  pts_25: {
    title: "Point Collector",
    description: "25+ lifetime positive Brownie Points earned.",
    how: "Accumulate 25 lifetime positive points from accepted actions.",
    check: (s) => s.lifetimePositivePoints >= 25,
  },
  pts_75: {
    title: "Score Keeper",
    description: "75+ lifetime positive Brownie Points.",
    how: "Accumulate 75 lifetime positive points.",
    check: (s) => s.lifetimePositivePoints >= 75,
  },
  pts_150: {
    title: "High-Score Heart",
    description: "150+ lifetime positive Brownie Points.",
    how: "Accumulate 150 lifetime positive points.",
    check: (s) => s.lifetimePositivePoints >= 150,
  },
  pts_300: {
    title: "Brownie Baron",
    description: "300+ lifetime positive Brownie Points.",
    how: "Accumulate 300 lifetime positive points.",
    check: (s) => s.lifetimePositivePoints >= 300,
  },
  neg_3: {
    title: "Oopsie Owler",
    description: "Three accepted negative logs — honesty counts.",
    how: "Have 3 accepted negative actions logged against you.",
    check: (s) => s.negativeAccepted >= 3,
  },
  neg_10: {
    title: "Soft Accountability",
    description: "Ten accepted negatives — still showing up with truth.",
    how: "Have 10 accepted negative actions logged against you.",
    check: (s) => s.negativeAccepted >= 10,
  },
  neg_pts_20: {
    title: "Lesson Ledger",
    description: "20+ points of accepted negatives (absolute).",
    how: "Accumulate 20 points worth of accepted negative actions.",
    check: (s) => s.lifetimeNegativePoints >= 20,
  },
  detail_detective: {
    title: "Detail Detective",
    description: "Five actions logged with Attention to Detail.",
    how: "Log 5 actions with the Attention to Detail bonus checked.",
    check: (s) => s.detailCount >= 5,
  },
  detail_devotee: {
    title: "Detail Devotee",
    description: "Fifteen Attention-to-Detail logs.",
    how: "Log 15 actions with Attention to Detail.",
    check: (s) => s.detailCount >= 15,
  },
  soft_reviewer: {
    title: "Gentle Critic",
    description: "Reviewed five partner logs with care.",
    how: "Complete 5 reviews of your partner’s logged actions.",
    check: (s) => s.reviewsDone >= 5,
  },
  soft_reviewer_25: {
    title: "Review Ritual",
    description: "Twenty-five partner reviews completed.",
    how: "Complete 25 reviews of partner logs.",
    check: (s) => s.reviewsDone >= 25,
  },
  rest_enforcer: {
    title: "Rest Enforcer",
    description: "Logged rest encouragement three times.",
    how: "Log 3 actions whose name mentions rest.",
    check: (s) => s.restCount >= 3,
  },
  passenger_princess_provider: {
    title: "Passenger Princess Provider",
    description: "Approved a ride-related reward.",
    how: "Approve a reward claim whose name mentions passenger.",
    check: (s) => s.passengerPrincessClaims >= 1,
  },
  ...buildLoveLangBadges(),
  consistent_care: {
    title: "Consistent Care",
    description: "Logged kindness three days in a row.",
    how: "Log at least one action on three consecutive days.",
    check: (s) => s.streak >= 3,
  },
  bulochka_energy: {
    title: "Bulochka Energy",
    description: "Ten accepted positive actions.",
    how: "Receive 10 accepted positive actions.",
    check: (s) => s.positiveAccepted >= 10,
  },
  soft_accountability: {
    title: "Gentle Critic",
    description: "Reviewed five partner logs with care.",
    how: "Complete 5 reviews of your partner’s logged actions.",
    check: (s) => s.reviewsDone >= 5,
  },
};

export const BADGE_CATALOG: { key: string; def: BadgeDef }[] = Object.entries(BADGE_DEFS).map(
  ([key, def]) => ({ key, def }),
);
