// Client-safe search suggestion helpers (no 'server-only' marker — used by the
// client SearchBox AND the server search page). Pure string utilities: edit
// distance + ranked suggestion/did-you-mean over a catalogue-term list.

// Damerau-light Levenshtein (insert/delete/substitute). Small inputs only.
export function editDistance(a: string, b: string): number {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
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

// Rank terms for an autocomplete dropdown: prefix > substring > fuzzy (edit
// distance within a small threshold). Returns up to `limit` distinct terms.
export function suggestTerms(query: string, terms: string[], limit = 6): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const seen = new Set<string>();
  const scored: { term: string; score: number }[] = [];
  for (const t of terms) {
    const lt = t.toLowerCase();
    if (lt === q || seen.has(lt)) continue;
    let score = -1;
    if (lt.startsWith(q)) score = 0;
    else if (lt.includes(q)) score = 1;
    else {
      // fuzzy: small edit distance to the term OR to any of its words
      const words = lt.split(/\s+/);
      const dWord = Math.min(...words.map((w) => editDistance(q, w)));
      const allow = q.length <= 4 ? 1 : 2;
      if (dWord <= allow) score = 2 + dWord;
    }
    if (score >= 0) {
      seen.add(lt);
      scored.push({ term: t, score });
    }
  }
  scored.sort((a, b) => a.score - b.score || a.term.length - b.term.length);
  return scored.slice(0, limit).map((s) => s.term);
}

// 'Did you mean <X>?' — only when the query does NOT prefix/substring-match any
// catalogue term but a close fuzzy term exists. Returns null when the query is a
// clear match (so we don't nag) or nothing is close.
export function didYouMean(query: string, terms: string[]): string | null {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;
  let best: { term: string; d: number } | null = null;
  for (const t of terms) {
    const lt = t.toLowerCase();
    if (lt.includes(q) || q.includes(lt)) return null; // clear match → no suggestion
    const words = lt.split(/\s+/);
    const d = Math.min(editDistance(q, lt), ...words.map((w) => editDistance(q, w)));
    if (best === null || d < best.d) best = { term: t, d };
  }
  if (!best) return null;
  // suggest only a CLOSE miss (1-2 edits) so it stays trustworthy
  const allow = q.length <= 5 ? 1 : 2;
  return best.d > 0 && best.d <= allow ? best.term : null;
}
