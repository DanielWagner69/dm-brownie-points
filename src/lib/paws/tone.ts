import type { ThemeId } from "./types";

/**
 * Dirty-funny 18+ copy for Naughty theme only.
 * Playful sexual humour — cheeky, not mean.
 */
const NAUGHTY: Record<string, string> = {
  // Shell / nav — keep short so the bar stays tidy
  Home: "Home",
  "Log BP": "Log it",
  Story: "Diary",
  Treats: "Treats",
  Nest: "Nest",
  Pawmise: "Pawmise 😈",

  // Home
  Hey: "Hey you",
  "Soft notes with": "Getting up to no good with",
  "Brownie Points balance": "Brownie Points (the fun fund)",
  "Brownie Points — not a scoreboard, just a soft mirror.":
    "Brownie Points — not a scoreboard, just who’s been extra good (or deliciously bad).",
  "not a scoreboard, just a soft mirror.":
    "not a scoreboard — just who’s been good… or trouble in the best way.",
  "Waiting for your soft review": "Waiting for your naughty review",
  "48h to accept, tweak, or gently decline.":
    "48h to accept, tweak the heat, or say ‘nice try, babe’.",
  "Accepted with love": "Accepted — you little menace 😈",
  "Tweaked gently": "Score adjusted… cheeky of you",
  "Log Brownie Points": "Log Brownie Points (confess)",
  "Recent Brownie Points": "Recent highlights (and lowlights)",
  "Nothing logged yet. Go log a little Brownie Point.":
    "Nothing logged yet. Go write something that would make the group chat gasp.",
  "Reward claims to approve": "Someone wants a treat — approve if they earned it",
  "Soft badges": "Trophy shelf",
  "day streak": "day streak (consistency is hot)",
  Positive: "Good energy",
  Negative: "Oops energy",
  "Full story": "Full diary",
  Accept: "Yes they did 😈",
  Modify: "Tweak the score",
  Decline: "Nope, not buying it",
  Approve: "Give it to them",
  Cancel: "Not tonight",
  "What you could claim": "What you could spend those points on",
  "Your partner tweaked a score": "Your partner wants to renegotiate",
  "Both of you must agree on Brownie Points before it sticks.":
    "Both of you must agree on the points before it counts (consent is sexy).",
  "Agree to tweak": "Agree to the tweak",
  "Keep original": "Keep my original claim",
  "You both agreed on the points": "You both agreed — sealed",
  "Kept original — back for their review": "Kept original — they can try again",
  "Reward approved": "Treat unlocked — go enjoy",
  "Cancelled & refunded": "Cancelled — points back",
  "Sent to them for agreement": "Sent — they need to say yes to the new score",
  "Declined and archived": "Declined and filed under ‘nice try’",

  // Log
  "Turn a little moment into Brownie Points":
    "Turn a little (or very big) moment into Brownie Points",
  "Who is this about?": "Who’s been naughty or nice?",
  "Be clear — this choice decides whose Brownie Points balance it lands on.":
    "Be clear — this decides whose Brownie Points pot it hits.",
  "What I did": "What I did (own it)",
  "Brownie Points apply to you after partner review":
    "Brownie Points land on you once they approve",
  "Attention to Detail": "Attention to Detail (they noticed everything)",
  "Log for a past day": "Log a past adventure (yes, that night counts)",
  "Little note": "Little note (keep it cheeky)",
  "Optional soft context…": "Optional dirty context…",
  Gallery: "Gallery",
  Camera: "Camera",
  "Search actions…": "Search deeds & disasters…",
  "Logged — waiting for partner approval": "Logged — waiting for their stamp of approval",
  "Logged for that day — still needs partner approval":
    "Logged for that day — still needs their yes",

  // Story
  "Your story": "Your shared diary",
  "Searchable shared history": "Every gift, favour, and ‘we need to talk’ moment",
  "Search notes, actions, tags…": "Search confessions & tags…",
  Pending: "Still needs a verdict",
  "Export CSV": "Export the receipts",
  "Request full wipe": "Burn the diary (both must agree)",
  "Edit (24h)": "Edit (24h)",
  "You both agreed": "You both agreed",
  "Kept original score": "Kept original score",
  "Sent for their agreement": "Sent for their agreement",
  "No entries yet.": "No entries yet. Go make some history.",

  // Treats
  "Treats & wishlist": "Treats & wishlist (earn the fun)",
  "Gestures you claim · wishes they buy for you":
    "Gestures you claim · wishes they buy for you",
  "Accepted positive + negative − spent on treats":
    "Accepted good + bad − spent on treats",
  "Needs a soft yes / no": "Needs a yes / no",
  "Your treats": "Your treats",
  "Your wishlist": "Your wishlist (spoil me)",
  "Their treats": "Their treats (you set the price)",
  "Their wishlist": "Their wishlist (buy it, earn points)",
  "Claim treat": "Claim treat",
  "I bought this": "I bought this",
  "Claimed — waiting for partner approval": "Claimed — waiting for their yes",
  "Buy Brownie Points updated": "Buy-points updated",
  "Brownie Points cost set": "Cost set",
  "Sent for their confirmation — Brownie Points after they say yes":
    "Sent for confirmation — points after they say yes",
  "Cancelled — Brownie Points refunded if needed": "Cancelled — points refunded if needed",
  Approved: "Approved — go enjoy",
  "Treat added": "Treat added",
  "Wish added": "Wish added",
  "Updated softly": "Updated",
  "Removed from your list": "Removed from your list",
  "Awaiting BP cost": "Awaiting cost",
  "Set buy Brownie Points": "Set buy-points",
  "BP to claim": "BP to claim",
  "BP earned on buy": "BP earned on buy",
  "buy BP": "buy BP",
  "paws they spend": "BP they spend",
  "No buy Brownie Points set yet": "No buy-points set yet",
  "They earn": "They earn",
  "Brownie Points if you buy this": "BP if you buy this",

  // Nest
  "Nest settings": "Nest settings",
  "Themes, taste, pairing": "Themes, taste, pairing — Naughty = dirty jokes on",
  Profile: "Profile",
  "Change your display name, nickname, and bio anytime.":
    "Change your display name, nickname, and bio anytime.",
  "Display name": "Display name",
  "Partner nickname": "Partner nickname (what you call them)",
  Bio: "Bio",
  "Save profile": "Save profile",
  "Profile updated": "Profile updated",
  Theme: "Theme",
  "Warm cream by default. Naughty adds flirty puns across the app (still private to you two).":
    "Warm cream by default. Naughty adds dirty-funny jokes (still private to you two).",
  Naughty: "Naughty (dirty & funny)",
  "All actions & ratings": "All actions & ratings",
  "Save ratings": "Save ratings",
  "Taste updated": "Taste updated",
  "Custom action": "Custom action",
  "Add action": "Add action",
  "Action added — it shows in Nest and Log": "Action added — shows in Nest and Log",
  "Removed from nest": "Removed from nest",
  "Edit profile": "Edit profile",
};

export function isNaughtyTheme(theme: ThemeId | string | null | undefined): boolean {
  return theme === "naughty";
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
  return out;
}
