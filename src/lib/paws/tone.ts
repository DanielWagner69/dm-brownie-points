import type { ThemeId } from "./types";

/** Cheeky / naughty copy map — only used when theme === "naughty". */
const NAUGHTY: Record<string, string> = {
  "Brownie Points balance": "Brownie Points balance (ready to spend on treats… and trouble)",
  "Soft notes with": "Naughty notes with",
  "not a scoreboard, just a soft mirror.":
    "not a scoreboard — just who’s been extra good (or deliciously bad).",
  "Brownie Points — not a scoreboard, just a soft mirror.":
    "Brownie Points — not a scoreboard, just who’s been extra good (or deliciously bad).",
  "Waiting for your soft review": "Waiting for your naughty review",
  "48h to accept, tweak, or gently decline.": "48h to accept, tweak the heat, or gently decline.",
  "Accepted with love": "Accepted — you little minx",
  "Tweaked gently": "Heat adjusted",
  "Log Brownie Points": "Log Brownie Points (be honest…)",
  "Turn a little moment into Brownie Points": "Turn a little moment into Brownie Points (yes, that counts)",
  "Treats & wishlist": "Treats & wishlist (earn it, baby)",
  "Your story": "Your spicy little story",
  "Searchable shared history": "The shared diary of good & naughty deeds",
  "Nest settings": "Nest settings (set the mood)",
  "Themes, taste, pairing": "Themes, taste, pairing — try Naughty for puns",
  "Hey": "Hey you",
  "Recent Brownie Points": "Recent Brownie Points (the highlight reel)",
  "Nothing logged yet. Go log a little Brownie Point.":
    "Nothing logged yet. Go log something worth blushing about.",
  "Reward claims to approve": "Treat claims to approve (don’t leave them hanging)",
  "Soft badges": "Trophy shelf",
  "Who is this about?": "Who’s been naughty or nice?",
  "What I did": "What I did (own it)",
  "Attention to Detail": "Attention to Detail (the spicy kind)",
  "Log for a past day": "Log a past adventure",
  "Little note": "Little note (keep it cheeky)",
  "Claim treat": "Claim treat (you earned this)",
  "I bought this": "I bought this (points for me, gift for you)",
  "day streak": "day streak (consistency is hot)",
  "Positive": "Good vibes",
  "Negative": "Oopsies",
  "Treats": "Treats",
  "Full story": "Full story",
  "Accept": "Accept",
  "Modify": "Tweak points",
  "Decline": "Decline",
  "Approve": "Approve",
  "Cancel": "Cancel",
};

export function isNaughtyTheme(theme: ThemeId | string | null | undefined): boolean {
  return theme === "naughty";
}

/** Apply naughty tone to a string when the theme is naughty. */
export function tone(text: string, theme: ThemeId | string | null | undefined): string {
  if (!isNaughtyTheme(theme)) return text;
  if (NAUGHTY[text]) return NAUGHTY[text];
  let out = text;
  for (const [plain, naughty] of Object.entries(NAUGHTY)) {
    if (plain.length > 12 && out.includes(plain)) {
      out = out.replace(plain, naughty);
    }
  }
  return out;
}
