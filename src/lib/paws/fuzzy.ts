/** Lightweight fuzzy match for action-library type-ahead. */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(w: string): string {
  if (w.length <= 3) return w;
  return w
    .replace(/ies$/, "y")
    .replace(/(ing|ed|es|s)$/i, "")
    .replace(/e$/, "");
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "what",
  "whats",
  "good",
  "that",
  "this",
  "from",
  "your",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "did",
  "does",
  "doing",
  "little",
  "soft",
]);

function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map(stem)
    .filter((w) => w.length >= 3);
}

/**
 * Score 0–1 how well `query` matches an existing action `name`.
 * High when words share stems (cook/cooked/cooking) or one string contains the other.
 */
export function fuzzyActionScore(query: string, name: string): number {
  const q = normalize(query);
  const t = normalize(name);
  if (!q || !t) return 0;
  if (q === t) return 1;
  if (t.includes(q) || q.includes(t)) return 0.95;

  const qTok = tokens(query);
  const tTok = tokens(name);
  if (qTok.length === 0 || tTok.length === 0) return 0;

  let hits = 0;
  for (const qt of qTok) {
    if (tTok.some((tt) => tt === qt || tt.includes(qt) || qt.includes(tt))) {
      hits += 1;
    }
  }
  if (hits === 0) return 0;
  // One shared content stem (e.g. cook/cooking) is enough to surface a suggestion
  const ratio = hits / qTok.length;
  return Math.max(ratio, 0.45 + 0.1 * (hits - 1));
}

/** Suggest library actions only when similarity is meaningful (not noise). */
export function suggestActions<T extends { name: string }>(
  query: string,
  library: T[],
  limit = 5,
): T[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const scored = library
    .map((a) => ({ a, score: fuzzyActionScore(q, a.name) }))
    .filter((x) => x.score >= 0.4)
    .sort((x, y) => y.score - x.score);
  return scored.slice(0, limit).map((x) => x.a);
}
