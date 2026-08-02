import type { ThemeId } from "./types";

/**
 * Dirtier / flirty copy for Naughty theme.
 * Private couple app — playful adult humour, not clinical.
 */
const NAUGHTY: Record<string, string> = {
  // Shell / nav
  Home: "Nest",
  "Log BP": "Log it",
  Story: "The dirty diary",
  Treats: "Treats 🔥",
  Nest: "Nest",
  Pawmise: "Pawmise 💦",

  // Home
  Hey: "Hey you dirty little",
  "Soft notes with": "Getting filthy with",
  "Brownie Points balance": "Brownie Points (your fuck-around fund)",
  "Brownie Points — not a scoreboard, just a soft mirror.":
    "Brownie Points — not a scoreboard, just who’s been bad enough to deserve dessert.",
  "not a scoreboard, just a soft mirror.":
    "not a scoreboard — just who’s been extra good (or deliciously bad).",
  "Waiting for your soft review": "Waiting for your dirty little verdict",
  "48h to accept, tweak, or gently decline.":
    "48h to accept, spank the score, or politely refuse the accusation.",
  "Accepted with love": "Accepted — you little minx 😈",
  "Tweaked gently": "Score adjusted… naughty of you",
  "Log Brownie Points": "Log Brownie Points (confess, baby)",
  "Recent Brownie Points": "Recent sins & blessings",
  "Nothing logged yet. Go log a little Brownie Point.":
    "Nothing logged yet. Go write something that would make grandma blush.",
  "Reward claims to approve": "Someone wants a treat — approve if they earned the climax",
  "Soft badges": "Trophy shelf (bedroom edition)",
  "day streak": "day streak (consistency is sexy)",
  Positive: "Good girl/boy energy",
  Negative: "Bad behaviour",
  "Full story": "Full dirty diary",
  Accept: "Yes, they did that 😈",
  Modify: "Spank the score",
  Decline: "Nope, didn’t happen",
  Approve: "Give it to them",
  Cancel: "Not tonight",
  "What you could claim": "What you could spend that body on",
  "Your partner tweaked a score": "Your partner wants to renegotiate the filth",
  "Both of you must agree on Brownie Points before it sticks.":
    "Both of you must agree on the points before the deed is sealed.",
  "Agree to tweak": "Agree — make it dirtier",
  "Keep original": "Keep my original claim",

  // Log
  "Turn a little moment into Brownie Points":
    "Turn a little (or very big) moment into Brownie Points",
  "Who is this about?": "Who’s been naughty or nice?",
  "What I did": "What I did (own that shit)",
  "What they did": "What they did to me",
  "Attention to Detail": "Attention to Detail (the filthy kind)",
  "Log for a past day": "Log a past adventure (yes, that night counts)",
  "Little note": "Little note (keep it filthy)",
  "Optional soft context…": "Optional filthy context…",
  Photo: "Evidence 📸",
  Gallery: "From gallery",
  Camera: "Take photo",
  "Suggested actions": "Menu of good & bad deeds",
  Search: "Search sins…",

  // Story
  "Your story": "Your spicy little story",
  "Searchable shared history": "The shared diary of good & filthy deeds",
  "Search notes, actions, tags…": "Search confessions, acts, tags…",

  // Treats
  "Treats & wishlist": "Treats & wishlist (earn the orgasm economy)",
  "Spendable balance": "Spendable Brownie Points (buy the fun)",
  "Your wishlist": "Your wishlist (spoil me rotten)",
  "Their treats": "Their treats (price them, you pay later… in fun)",
  "Their wishlist": "Their wishlist (buy it, earn Brownie Points, brag later)",
  "Claim treat": "Claim treat (you fucking earned this)",
  "I bought this": "I bought this (points for me, gift for you)",
  "Set cost": "Set the price of pleasure",

  // Nest / settings
  "Nest settings": "Nest settings (set the fucking mood)",
  "Themes, taste, pairing": "Themes, taste, pairing — Naughty = pure filth mode",
  Profile: "Your soft little identity",
  "Display name": "What they moan (display name)",
  "Partner nickname": "What you call them in bed",
  Bio: "Bio (flirt in public, filth in private)",
  "Save profile": "Save this hot mess",
  Theme: "Mood lighting",
  Naughty: "Naughty (dirtier jokes ON)",
  "All actions & ratings": "All deeds & how wet they make you (points)",
  "Custom action": "Invent a new sin / blessing",
  "Add action": "Add to the menu",
  "Save ratings": "Save how much each act is worth",
  "Edit profile": "Edit profile",
  "Delete action": "Remove from nest",
};

export function isNaughtyTheme(theme: ThemeId | string | null | undefined): boolean {
  return theme === "naughty";
}

/** Apply naughty tone to a string when the theme is naughty. */
export function tone(text: string, theme: ThemeId | string | null | undefined): string {
  if (!isNaughtyTheme(theme)) return text;
  if (NAUGHTY[text]) return NAUGHTY[text];
  let out = text;
  // Longer keys first
  const entries = Object.entries(NAUGHTY).sort((a, b) => b[0].length - a[0].length);
  for (const [plain, naughty] of entries) {
    if (plain.length > 8 && out.includes(plain)) {
      out = out.replace(plain, naughty);
    }
  }
  return out;
}
