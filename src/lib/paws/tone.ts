import type { ThemeId } from "./types";

/**
 * Dirty-funny 18+ copy for Naughty theme only.
 * Sexual jokes + flirty puns — private couples humour.
 */
const NAUGHTY: Record<string, string> = {
  // Shell / nav — short so the bar stays tidy
  Home: "Nest",
  "Log BP": "Confess",
  Story: "Diary",
  Treats: "Treats 🔥",
  Nest: "Nest",
  Pawmise: "Pawmise 💦",

  // Home
  Hey: "Hey you sexy",
  "Soft notes with": "Misbehaving with",
  "Brownie Points balance": "Brownie Points (sex-currency fund)",
  "Brownie Points — not a scoreboard, just a soft mirror.":
    "Brownie Points — not a scoreboard, just who’s been good enough to get rewarded in bed.",
  "not a scoreboard, just a soft mirror.":
    "not a scoreboard — just who’s been sweet… or deliciously filthy.",
  "Waiting for your soft review": "Waiting for your horny little verdict",
  "48h to accept, tweak, or gently decline.":
    "48h to accept, slap a better score on it, or say ‘nice try, you menace’.",
  "Accepted with love": "Accepted — you absolute flirt 😈",
  "Tweaked gently": "Score adjusted… dirty of you",
  "Log Brownie Points": "Log Brownie Points (confess the filth)",
  "Recent Brownie Points": "Recent sins, favours & bedroom politics",
  "Nothing logged yet. Go log a little Brownie Point.":
    "Nothing logged yet. Go write something that would make the neighbours blush.",
  "Reward claims to approve": "Someone wants a treat — approve if they earned the climax",
  "Soft badges": "Trophy shelf (bedroom edition)",
  "day streak": "day streak (daily effort is hot)",
  Positive: "Deserves a reward 😉",
  Negative: "Deserves a spanking",
  "Full story": "Full dirty diary",
  Accept: "Yes they did 😈",
  Modify: "Tweak that score, baby",
  Decline: "Nope, that didn’t happen",
  Approve: "Give it to them",
  Cancel: "Not tonight, babe",
  "What you could claim": "What you could spend those points fucking around with",
  "Your partner tweaked a score": "Your partner wants to renegotiate the filth",
  "Both of you must agree on Brownie Points before it sticks.":
    "Both of you must agree on the points before the deed is sealed (consent is hot).",
  "Agree to tweak": "Agree — make it filthier",
  "Keep original": "Keep my original claim",
  "You both agreed on the points": "You both agreed — sealed with a kiss (or more)",
  "Kept original — back for their review": "Kept original — they can try again, cutie",
  "Reward approved": "Treat unlocked — go get messy",
  "Cancelled & refunded": "Cancelled — pants stay on (points back)",
  "Sent to them for agreement": "Sent — they need to moan yes to the new score",
  "Declined and archived": "Declined and filed under ‘nice try’",
  "Edit profile": "Edit your hot little profile",

  // Log
  "Turn a little moment into Brownie Points":
    "Turn a little (or very big) moment into Brownie Points",
  "Who is this about?": "Who’s been naughty… or completely irresistible?",
  "Be clear — this choice decides whose Brownie Points balance it lands on.":
    "Be clear — this decides whose fun-fund the points hit.",
  "What I did": "What I did (own that shit)",
  "Brownie Points apply to you after partner review":
    "Brownie Points land on you once they approve the filth",
  "Attention to Detail": "Attention to Detail (they noticed every filthy inch)",
  "Log for a past day": "Log a past adventure (yes, that night counts)",
  "Little note": "Little note (keep it filthy)",
  "Optional soft context…": "Optional dirty context… how good, how loud, how long…",
  Gallery: "Gallery of sin",
  Camera: "Snap the evidence",
  "Search actions…": "Search sins, favours, fuck-ups…",
  Logging: "Logging the filth…",
  "Logged — waiting for partner approval":
    "Logged — waiting for them to bless (or deny) the filth",
  "Logged for that day — still needs partner approval":
    "Logged for that day — still needs their horny rubber stamp",
  "Could not log": "Couldn’t log that filth — try again",
  "Could not read that photo": "Couldn’t read that spicy photo",

  // Story
  "Your story": "Your filthy shared diary",
  "Searchable shared history": "Every orgasm, gift, and ‘we need to talk’ moment",
  "Search notes, actions, tags…": "Search confessions, acts, dirty tags…",
  "All kinds": "All the filth",
  Pending: "Still horny for a verdict",
  "Export CSV": "Export the dirty receipts",
  "Request full wipe": "Burn the diary (both must agree)",
  "Edit (24h)": "Edit (24h window of regret)",
  Delete: "Delete this filth",
  "You both agreed": "You both agreed — hot and binding",
  "Kept original score": "Kept original — stubborn and hot",
  "Sent for their agreement": "Sent — they need to consent to the new points",
  Declined: "Declined — not that kind of night",
  Accepted: "Accepted — good fucking job",
  "No entries yet.": "No entries yet. Go make history worth blushing over.",
  "Exported CSV": "Exported — hide this from your mother",
  "History wiped (both agreed)": "History wiped — clean slate, same appetite",
  "Wipe requested — partner must agree": "Wipe requested — they have to say yes too",
  "Deleted (both agreed)": "Deleted — both of you wanted it gone",
  "Delete requested — partner must agree": "Delete requested — waiting on their yes",
  "Updated within 24h window": "Updated while you still could",
  "tweak pending": "tweak pending (mutual consent required)",

  // Treats
  "Treats & wishlist": "Treats & wishlist (earn the orgasm economy)",
  "Gestures you claim · wishes they buy for you":
    "Gestures you claim with points · wishes they buy so you both win",
  "Accepted positive + negative − spent on treats":
    "Accepted good deeds + bad deeds − spent on getting spoiled",
  "Needs a soft yes / no": "Needs a horny yes / no",
  "Your treats": "Your treats (claim when you want it bad)",
  "Your wishlist": "Your wishlist (spoil me rotten)",
  "Their treats": "Their treats (you set the price of pleasure)",
  "Their wishlist": "Their wishlist (buy it, earn points, get thanked thoroughly)",
  "Claim treat": "Claim treat (you earned this, baby)",
  Edit: "Edit",
  Remove: "Remove",
  "I bought this": "I bought this (points for me, gift for them)",
  "paws they spend": "BP they spend to get this",
  "buy BP": "buy BP",
  "No buy Brownie Points set yet": "No buy-points set — tease them first",
  "They earn": "They earn",
  "Brownie Points if you buy this": "BP if you buy this for them",
  "Awaiting BP cost": "Awaiting the price of pleasure",
  "Set buy Brownie Points": "Set buy-points",
  "BP to claim": "BP to claim this favour",
  "BP earned on buy": "BP earned when they buy it",
  "Treat added": "Treat added — go price that pleasure",
  "Wish added": "Wish added — make them want to spoil you",
  "Updated softly": "Updated — still filthy",
  "Removed from your list": "Removed from the menu",
  "Claimed — waiting for partner approval":
    "Claimed — waiting for them to approve the climax",
  "Buy Brownie Points updated": "Buy-points updated",
  "Brownie Points cost set": "Price of pleasure set",
  "Sent for their confirmation — Brownie Points after they say yes":
    "Sent for confirmation — points after they say yes, baby",
  "Cancelled — Brownie Points refunded if needed":
    "Cancelled — pants on, points back if needed",
  Approved: "Approved — go enjoy it",
  "Starter treats appear after pairing — edit or remove any of them. Or add your own.":
    "Starter treats after pairing — edit, remove, or add your own kinks.",
  "Add something lovely you’d love them to buy for you.":
    "Add something sexy/expensive you’d love them to buy for you.",
  "You set the Brownie Points cost (you’re the one giving the treat).":
    "You set the Brownie Points cost (you’re the one delivering the treat).",
  "Mark when you’ve bought an item — they confirm, then you earn the Brownie Points.":
    "Mark when you’ve bought it — they confirm, then you earn the Brownie Points.",
  "Add a treat": "Add a treat (something you want done to/for you)",
  "Add a wish": "Add a wish (something you want bought)",
  Name: "Name of the pleasure",
  Description: "Details (be graphic if you want)",
  "Optional soft details…": "Optional filthy details… how, where, how long…",
  "Buy Brownie Points (they earn when they buy it)":
    "Buy Brownie Points (they earn when they actually buy the thing)",
  "One-time only": "One-time only (special night)",
  Repeatable: "Repeatable (keep coming back 😉)",
  Save: "Save this filth",
  "Cancel edit": "Cancel edit",
  Treats: "Treats 🔥",
  Wishlist: "Wishlist (spoil me)",

  // Nest / settings
  "Nest settings": "Nest settings (set the fucking mood)",
  "Themes, taste, pairing": "Themes, taste, pairing — Naughty = pure dirty jokes",
  Profile: "Who they moan for",
  "Change your display name, nickname, and bio anytime.":
    "Change your name, bedroom nickname, and bio anytime.",
  "Display name": "Display name (what they moan)",
  "Partner nickname": "Partner nickname (what you call them in bed)",
  Bio: "Bio (soft in public, filthy in private)",
  "Save profile": "Save this hot mess",
  "Profile updated": "Profile updated — still fuckable",
  Theme: "Mood lighting",
  "Warm cream by default. Naughty adds flirty puns across the app (still private to you two).":
    "Warm cream by default. Naughty turns on dirty sexual jokes (still private to you two).",
  "Warm cream": "Warm cream",
  "Soft dusk": "Soft dusk",
  Blossom: "Blossom",
  Burgundy: "Burgundy",
  "Flight teal": "Flight teal",
  Naughty: "Naughty (18+ jokes ON)",
  "Gentle pings": "Horny pings",
  "Save ping prefs": "Save ping prefs",
  "Ping prefs saved": "Ping prefs saved",
  "All actions & ratings": "All deeds & how hot they make you (points)",
  "Full default list plus your custom ones (same as Log). Ratings only affect future suggestions when actions apply to you.":
    "Full list + customs (same as Log). Ratings change future scores when acts apply to you.",
  "Save ratings": "Save how much each act is worth",
  "Taste updated": "Taste updated — good girl/boy",
  "Custom action": "Invent a new sin / blessing / sex act",
  "Add something unique to your pair, then archive later if needed.":
    "Add something unique to your pair (yes, that counts).",
  "Action name": "Name of the deed",
  "Add action": "Add to the fun menu",
  "Action added — it shows in Nest and Log": "Action added — ready to log the filth",
  "Removed from nest": "Removed from the nest",
  "Could not delete": "Couldn’t delete that",
  Pairing: "Pairing (locked to one partner — monogamy mode)",
  "Sign out": "Sign out",
  Unpair: "Unpair (export then wipe couple data)",

  // Extra common toasts / bits
  Failed: "Failed — try again, baby",
  Continue: "Continue, baby",
  Back: "Back",
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
