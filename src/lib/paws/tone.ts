import type { ThemeId } from "./types";

/**
 * Dirty-funny 18+ copy for Naughty theme.
 * “Fuck fund” energy + confession humour for sins.
 */
const NAUGHTY: Record<string, string> = {
  // Shell / nav — keep short
  Home: "Nest",
  "Log BP": "Confess",
  Story: "Sins",
  Treats: "Treats 🔥",
  Nest: "Nest",
  Pawmise: "Pawmise 💦",

  // Home
  Hey: "Hey you filthy",
  "Soft notes with": "Sinning with",
  "Brownie Points balance": "Fuck fund balance",
  "Brownie Points — not a scoreboard, just a soft mirror.":
    "Fuck fund — not a scoreboard, just who’s been saintly… or sinful.",
  "not a scoreboard, just a soft mirror.":
    "not a scoreboard — just who’s been good, or deliciously bad.",
  "Waiting for your soft review": "Waiting for confession review",
  "48h to accept, tweak, or gently decline.":
    "48h to absolve, tweak the penance, or say ‘nice try, sinner’.",
  "Accepted with love": "Absolved — go forth and sin again 😈",
  "Tweaked gently": "Penance adjusted… dirty of you",
  "Log Brownie Points": "Confess to the Fuck fund",
  "Recent Brownie Points": "Recent sins & blessings",
  "Nothing logged yet. Go log a little Brownie Point.":
    "Nothing logged yet. Forgive me father, for I have not sinned enough.",
  "Reward claims to approve": "Someone wants a treat — approve if they earned the climax",
  "Soft badges": "Halo / horns shelf",
  "day streak": "day streak (daily devotion is hot)",
  Positive: "Blessings 😇",
  Negative: "Sins 😈",
  "Full story": "Book of sins",
  Accept: "Absolved 😈",
  Modify: "Change the penance",
  Decline: "Denied — that sin didn’t happen",
  Approve: "Bless this treat",
  Cancel: "Not tonight, sinner",
  "What you could claim": "What your Fuck fund could buy",
  "Your partner tweaked a score": "Your partner wants to renegotiate the penance",
  "Both of you must agree on Brownie Points before it sticks.":
    "Both of you must agree on the Fuck fund points before it sticks (consent is holy).",
  "Agree to tweak": "Agree to the new penance",
  "Keep original": "Keep my original sin score",
  "You both agreed on the points": "You both agreed — sealed",
  "Kept original — back for their review": "Kept original — back to confession",
  "Reward approved": "Treat unlocked — go be bad",
  "Cancelled & refunded": "Cancelled — Fuck fund refunded",
  "Sent to them for agreement": "Sent — they must bless the new score",
  "Declined and archived": "Declined and buried with the other sins",
  "Edit profile": "Edit who they sin with",

  // Log
  "Turn a little moment into Brownie Points":
    "Turn a little (or very big) moment into Fuck fund points",
  "Who is this about?": "Who’s been a saint… or a complete sinner?",
  "Be clear — this choice decides whose Brownie Points balance it lands on.":
    "Be clear — this decides whose Fuck fund the points hit.",
  "What I did": "What I did (own the sin)",
  "Brownie Points apply to you after partner review":
    "Fuck fund points land on you once they approve the confession",
  "Attention to Detail": "Attention to Detail (they noticed every filthy inch)",
  "Log for a past day": "Confess a past sin (yes, that night counts)",
  "Little note": "Confession note (keep it filthy)",
  "Optional soft context…": "Optional dirty confession… how bad were you?",
  Gallery: "Evidence of the crime",
  Camera: "Snap the sin",
  "Search actions…": "Search sins, blessings, fuck-ups…",
  Logging: "Confessing…",
  "Logged — waiting for partner approval":
    "Confession logged — waiting for their blessing (or denial)",
  "Logged for that day — still needs partner approval":
    "Confession filed for that day — still needs their rubber stamp",
  "Could not log": "Confession failed — try again, sinner",
  "Could not read that photo": "Couldn’t read that spicy evidence",

  // Story
  "Your story": "Your shared book of sins",
  "Searchable shared history": "Every blessing, orgasm, and ‘forgive me father’ moment",
  "Search notes, actions, tags…": "Search confessions & dirty tags…",
  "All kinds": "Saints & sinners",
  Pending: "Awaiting absolution",
  "Export CSV": "Export the confession log",
  "Request full wipe": "Burn the book of sins (both must agree)",
  "Edit (24h)": "Edit confession (24h)",
  Delete: "Delete this sin",
  "You both agreed": "You both agreed — penance sealed",
  "Kept original score": "Kept original penance",
  "Sent for their agreement": "Sent for their blessing on the new score",
  Declined: "Denied — not that kind of night",
  Accepted: "Absolved — good fucking job",
  "No entries yet.": "No sins yet. Forgive me father, for I have not sinned… yet.",
  "Exported CSV": "Exported — hide this from your mother",
  "History wiped (both agreed)": "Book wiped — clean slate, same appetite",
  "Wipe requested — partner must agree": "Wipe requested — they must agree too",
  "Deleted (both agreed)": "Deleted — both wanted it gone",
  "Delete requested — partner must agree": "Delete requested — waiting on their yes",
  "Updated within 24h window": "Confession updated",
  "tweak pending": "penance pending (both must agree)",

  // Treats
  "Treats & wishlist": "Treats & wishlist (spend the Fuck fund)",
  "Gestures you claim · wishes they buy for you":
    "Favours you claim · wishes they buy so you both win",
  "Accepted positive + negative − spent on treats":
    "Blessings + sins − spent on getting spoiled",
  "Needs a soft yes / no": "Needs a sinful yes / no",
  "Your treats": "Your treats (claim when you want it bad)",
  "Your wishlist": "Your wishlist (spoil me rotten)",
  "Their treats": "Their treats (you set the price of pleasure)",
  "Their wishlist": "Their wishlist (buy it, earn Fuck fund points)",
  "Claim treat": "Claim treat (you earned this, sinner)",
  Edit: "Edit",
  Remove: "Remove",
  "I bought this": "I bought this (points for me, gift for them)",
  "paws they spend": "Fuck fund they spend",
  "buy BP": "buy Fuck fund pts",
  "No buy Brownie Points set yet": "No buy-points set — tease them first",
  "They earn": "They earn",
  "Brownie Points if you buy this": "Fuck fund points if you buy this",
  "Awaiting BP cost": "Awaiting the price of pleasure",
  "Set buy Brownie Points": "Set buy-points",
  "BP to claim": "Fuck fund to claim",
  "BP earned on buy": "Fuck fund earned on buy",
  "Treat added": "Treat added — go price that pleasure",
  "Wish added": "Wish added — make them spoil you",
  "Updated softly": "Updated — still filthy",
  "Removed from your list": "Removed from the menu",
  "Claimed — waiting for partner approval":
    "Claimed — waiting for them to bless the climax",
  "Buy Brownie Points updated": "Buy-points updated",
  "Brownie Points cost set": "Price of pleasure set",
  "Sent for their confirmation — Brownie Points after they say yes":
    "Sent for confirmation — Fuck fund points after they say yes",
  "Cancelled — Brownie Points refunded if needed":
    "Cancelled — pants on, Fuck fund refunded if needed",
  Approved: "Approved — go enjoy it",
  "Starter treats appear after pairing — edit or remove any of them. Or add your own.":
    "Starter treats after pairing — edit, remove, or invent new kinks.",
  "Add something lovely you’d love them to buy for you.":
    "Add something sexy you’d love them to buy for you.",
  "You set the Brownie Points cost (you’re the one giving the treat).":
    "You set the Fuck fund cost (you’re the one delivering the treat).",
  "Mark when you’ve bought an item — they confirm, then you earn the Brownie Points.":
    "Mark when you’ve bought it — they confirm, then you earn Fuck fund points.",
  "Add a treat": "Add a treat (something you want done to/for you)",
  "Add a wish": "Add a wish (something you want bought)",
  Name: "Name of the pleasure",
  Description: "Details (be graphic if you want)",
  "Optional soft details…": "Optional filthy details… how, where, how long…",
  "Buy Brownie Points (they earn when they buy it)":
    "Buy Fuck fund points (they earn when they actually buy it)",
  "One-time only": "One-time only (special night)",
  Repeatable: "Repeatable (keep coming back 😉)",
  Save: "Save this filth",
  "Cancel edit": "Cancel edit",
  Wishlist: "Wishlist (spoil me)",

  // Nest
  "Nest settings": "Nest settings (set the fucking mood)",
  "Themes, taste, pairing": "Themes, taste, pairing — Naughty = Fuck fund mode",
  Profile: "Who they sin with",
  "Change your display name, nickname, and bio anytime.":
    "Change your name, bedroom nickname, and bio anytime.",
  "Display name": "Display name (what they moan)",
  "Partner nickname": "Partner nickname (what you call them in bed)",
  Bio: "Bio (saint in public, sinner in private)",
  "Save profile": "Save this hot mess",
  "Profile updated": "Profile updated — still fuckable",
  Theme: "Mood lighting",
  "Warm cream by default. Naughty adds flirty puns across the app (still private to you two).":
    "Warm cream by default. Naughty turns on Fuck fund / confession jokes (still private to you two).",
  "Warm cream": "Warm cream",
  "Soft dusk": "Soft dusk",
  Blossom: "Blossom",
  Burgundy: "Burgundy",
  "Flight teal": "Flight teal",
  Naughty: "Naughty (Fuck fund ON)",
  "Gentle pings": "Sin pings",
  "Save ping prefs": "Save ping prefs",
  "Ping prefs saved": "Ping prefs saved",
  "All actions & ratings": "All blessings, sins & how hot they are (points)",
  "Full default list plus your custom ones (same as Log). Ratings only affect future suggestions when actions apply to you.":
    "Full list + customs (same as Log). Ratings change future Fuck fund scores for you.",
  "Save ratings": "Save how much each sin/blessing is worth",
  "Taste updated": "Taste updated — good girl/boy",
  "Custom action": "Invent a new sin or blessing",
  "Add something unique to your pair, then archive later if needed.":
    "Add something unique to your pair (yes, that counts as a sin or blessing).",
  "Action name": "Name of the deed",
  "Add action": "Add to the book of sins",
  "Action added — it shows in Nest and Log": "Action added — ready to confess",
  "Removed from nest": "Removed from the nest",
  "Could not delete": "Couldn’t delete that sin",
  Pairing: "Pairing (one partner only — monogamy mode)",
  "Sign out": "Sign out",
  Unpair: "Unpair (export then wipe)",

  Failed: "Failed — try again, sinner",
  Continue: "Continue, sinner",
  Back: "Back",
};

/**
 * Negative actions in Naughty mode — confession / church-of-bad-decisions energy.
 * Weighted so “Forgive me father…” shows up a lot.
 */
const SIN_PREFIXES = [
  "Forgive me father, for I have sinned: ",
  "Forgive me father, for I have sinned: ",
  "Forgive me father, for I have sinned: ",
  "Forgive me father, for I have sinned: ",
  "Confession booth: ",
  "Mea culpa, baby: ",
  "Bless me father, for I fucked up: ",
  "Sin of the day: ",
  "I have sinned and I loved it: ",
  "Oops, hellbound moment: ",
  "Lord have mercy: ",
  "Penance pending: ",
  "Guilty as charged: ",
  "Forgive me darling, for I have sinned: ",
];

const BLESSING_PREFIXES = [
  "Blessing: ",
  "Halo moment: ",
  "Saint behaviour: ",
  "Good fucking deed: ",
  "Heaven points: ",
  "Angel mode: ",
];

/** Resolve theme from profile, with DOM data-theme as fallback (instant after switch). */
export function resolveTheme(
  theme: ThemeId | string | null | undefined,
): string | null | undefined {
  if (theme) return theme;
  if (typeof document !== "undefined") {
    return document.documentElement.getAttribute("data-theme");
  }
  return theme;
}

export function isNaughtyTheme(theme: ThemeId | string | null | undefined): boolean {
  return resolveTheme(theme) === "naughty";
}

/** Apply naughty tone to a string when the theme is naughty. */
export function tone(text: string, theme: ThemeId | string | null | undefined): string {
  if (!isNaughtyTheme(theme)) return text;
  if (NAUGHTY[text]) return NAUGHTY[text];
  let out = text;
  const entries = Object.entries(NAUGHTY).sort((a, b) => b[0].length - a[0].length);
  for (const [plain, naughty] of entries) {
    if (plain.length > 6 && out.includes(plain)) {
      out = out.split(plain).join(naughty);
    }
  }
  if (out.includes("Brownie Points")) {
    out = out.split("Brownie Points").join("Fuck fund");
  }
  if (out.includes("Brownie points")) {
    out = out.split("Brownie points").join("Fuck fund");
  }
  return out;
}

/**
 * Flavour an action name for Naughty mode (sins vs blessings).
 * Stable prefix per id so lists don’t reshuffle labels every render.
 */
export function toneActionName(
  name: string,
  kind: "positive" | "negative" | string,
  theme: ThemeId | string | null | undefined,
  stableKey?: string | number,
): string {
  if (!isNaughtyTheme(theme)) return name;

  // Strip any old flavour if re-applied
  let base = name;
  for (const p of [...SIN_PREFIXES, ...BLESSING_PREFIXES]) {
    if (base.startsWith(p)) {
      base = base.slice(p.length);
      break;
    }
  }

  const seed = String(stableKey ?? base)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);

  if (kind === "negative") {
    return SIN_PREFIXES[seed % SIN_PREFIXES.length] + base;
  }
  if (kind === "positive") {
    return BLESSING_PREFIXES[seed % BLESSING_PREFIXES.length] + base;
  }
  return base;
}
