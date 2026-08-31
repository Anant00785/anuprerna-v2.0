// ---------------------------------------------------------------------------
// Ordinal long-form date formatter — mirrors the live Angular FormatDatePipe:
//   "27th May, 2026"
//
// IMPORTANT (hydration safety): we read the UTC parts of the timestamp, NOT the
// local-timezone parts. `new Date(ts).getDate()` / `toLocaleDateString` depend on
// the runtime timezone, so the server (UTC on the VPS / Vercel) and the client
// (the visitor's browser timezone) can disagree and produce DIFFERENT text for
// the same timestamp — exactly the kind of SSR/CSR mismatch that throws React
// #418. Using the UTC accessors makes the output identical on both sides.
// ---------------------------------------------------------------------------

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function ordinalSuffix(day: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  if ([11, 12, 13].includes(day)) return suffixes[0];
  const lastDigit = day % 10;
  return suffixes[lastDigit] ?? suffixes[0];
}

/** Format a unix-ms timestamp as e.g. "27th May, 2026" (deterministic, UTC). */
export function formatOrdinalDate(ts: number): string {
  if (!ts || Number.isNaN(ts)) return '';
  const date = new Date(ts);
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return day + ordinalSuffix(day) + ' ' + month + ', ' + year;
}
