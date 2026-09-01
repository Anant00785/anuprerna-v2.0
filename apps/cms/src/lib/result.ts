/**
 * Discriminated result type for data fetchers.
 *
 * A fetch either succeeds with data or fails with a human-readable error — never
 * a silent empty array. Callers must branch on `ok` so a Loom outage renders an
 * error banner, not a misleading "no results found" empty state.
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
