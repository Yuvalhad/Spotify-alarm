/**
 * Text comparison helpers used by the lyrics/typing challenge.
 */

/** Lowercase, strip punctuation/diacritics, collapse whitespace. */
export function normalizeForComparison(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, '') // punctuation (unicode-aware, keeps Hebrew etc.)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Classic Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  const m = a.length;
  const n = b.length;
  if (m === 0) {
    return n;
  }
  if (n === 0) {
    return m;
  }
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** 0..1 similarity based on Levenshtein distance of normalized strings. */
export function similarity(a: string, b: string): number {
  const na = normalizeForComparison(a);
  const nb = normalizeForComparison(b);
  if (na.length === 0 && nb.length === 0) {
    return 1;
  }
  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
}
