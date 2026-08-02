export type DefaultAction = {
  name: string;
  kind: "positive" | "negative";
  base_points: number;
  category: string;
};

export const DEFAULT_ACTIONS: DefaultAction[] = [
  // Positive
  { name: "Gift flowers", kind: "positive", base_points: 3, category: "romance" },
  { name: "Thoughtful card", kind: "positive", base_points: 5, category: "romance" },
  { name: "Pour water", kind: "positive", base_points: 1, category: "chivalry" },
  { name: "Open door", kind: "positive", base_points: 1, category: "chivalry" },
  { name: "Tuck chair", kind: "positive", base_points: 1, category: "chivalry" },
  { name: "Help put jacket on", kind: "positive", base_points: 1, category: "chivalry" },
  { name: "Compliment", kind: "positive", base_points: 1, category: "kindness" },
  {
    name: "Made a plan so the other person didn’t have to think",
    kind: "positive",
    base_points: 3,
    category: "planning",
  },
  { name: "Cooked a meal", kind: "positive", base_points: 2, category: "care" },
  {
    name: "Random thoughtful message or voice note",
    kind: "positive",
    base_points: 1,
    category: "kindness",
  },
  {
    name: "Surprise Chocolate / Snacks",
    kind: "positive",
    base_points: 1,
    category: "care",
  },
  {
    name: "Remembered something small that was only mentioned once",
    kind: "positive",
    base_points: 2,
    category: "detail",
  },
  {
    name: "Brought favourite chocolate (Dark Lindt Raspberry)",
    kind: "positive",
    base_points: 2,
    category: "detail",
  },
  {
    name: "Took care of something practical without being asked",
    kind: "positive",
    base_points: 2,
    category: "care",
  },
  // Negative
  {
    name: "Silly sasiska comment (not from a bad place, just not thought through)",
    kind: "negative",
    base_points: -2,
    category: "words",
  },
  {
    name: "Mean Comment (Intention to hurt partner)",
    kind: "negative",
    base_points: -5,
    category: "words",
  },
  {
    name: "Poor Gentleman (Forgot to tuck chair, pour water, open door, help with jacket, didn't wait etc.)",
    kind: "negative",
    base_points: -1,
    category: "chivalry",
  },
  {
    name: "Was not open with relevant information that could affect the partner",
    kind: "negative",
    base_points: -3,
    category: "trust",
  },
  { name: "Forgot a key event", kind: "negative", base_points: -2, category: "memory" },
  {
    name: "Left on read for an unreasonable amount of time",
    kind: "negative",
    base_points: -2,
    category: "attention",
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

/** Default action names that should be archived on existing nests */
export const REMOVED_DEFAULT_ACTIONS = [
  "Encouraged rest when they were clearly exhausted",
];

/** Old default names → new name (rename in place for existing couples) */
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

/** Soft sample actions for preference rating during onboarding */
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

export const BADGE_DEFS: Record<
  string,
  { title: string; description: string; check: (s: BadgeStats) => boolean }
> = {
  consistent_care: {
    title: "Consistent Care",
    description: "Logged kindness three days in a row.",
    check: (s) => s.streak >= 3,
  },
  passenger_princess_provider: {
    title: "Passenger Princess Provider",
    description: "Approved a ride-related reward.",
    check: (s) => s.passengerPrincessClaims >= 1,
  },
  detail_detective: {
    title: "Detail Detective",
    description: "Five actions with Attention to Detail.",
    check: (s) => s.detailCount >= 5,
  },
  rest_enforcer: {
    title: "Rest Enforcer",
    description: "Logged rest encouragement three times.",
    check: (s) => s.restCount >= 3,
  },
  bulochka_energy: {
    title: "Bulochka Energy",
    description: "Ten accepted positive actions.",
    check: (s) => s.positiveAccepted >= 10,
  },
  soft_accountability: {
    title: "Soft Accountability",
    description: "Reviewed five partner logs with care.",
    check: (s) => s.reviewsDone >= 5,
  },
};

export type BadgeStats = {
  streak: number;
  detailCount: number;
  restCount: number;
  positiveAccepted: number;
  reviewsDone: number;
  passengerPrincessClaims: number;
};
