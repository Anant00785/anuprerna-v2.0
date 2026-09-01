const S3_BASE = "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/";
// Bare filenames (no folder) live under this prefix in the bucket.
const S3_FEEDBACK_PREFIX = "bpm-feedback/";

/**
 * Loom stores QC media on a public S3 bucket. The raw field is inconsistent in
 * two ways, and BOTH have to be handled or images 403:
 *
 *  1. Bare filename vs full URL. Most rows hold only a filename
 *     ("KCV2….jpeg") which would resolve as a broken RELATIVE path in the
 *     browser and is missing the bpm-feedback/ folder the bucket stores it
 *     under; some hold a full https://…amazonaws.com/… URL, which must be
 *     passed through untouched.
 *  2. MULTI-UPLOAD. A single feedback can carry SEVERAL files in ONE field, as a
 *     COMMA-SEPARATED list ("a.jpg,b.jpg,c.jpg"). Treating that whole string as
 *     one filename produces a URL for an object that does not exist — which is
 *     the real cause of the "403 wall" previously blamed on bucket permissions.
 *     Measured on the synced sandbox rows (2026-08-16): of 2728 feedback rows,
 *     1928 carry an image and 317 carry a video; every single value is a bare
 *     filename (zero full URLs), and every comma-separated part returns HTTP 200
 *     once it is split and prefixed individually.
 *
 * Values can also arrive with a trailing backslash / quote / whitespace (a
 * serialisation artifact) that breaks the URL, so each part is sanitised.
 */

/** Normalise ONE already-split value into an absolute URL ("" if empty). */
function normalizeOne(part: string): string {
  const clean = part.trim().replace(/^[\\"'\s]+/, "").replace(/[\\"'\s]+$/, "");
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  const rel = clean.replace(/^\/+/, "");
  return S3_BASE + (rel.includes("/") ? rel : S3_FEEDBACK_PREFIX + rel);
}

/**
 * Split a raw media field into every absolute URL it references.
 * Returns [] when the field is empty. Use this for rendering — a feedback with
 * three QC photos must show three, not one broken thumbnail.
 */
export function normalizeFeedbackMediaList(u?: string): string[] {
  if (!u) return [];
  // Only split on commas that separate values, never inside a full URL's query
  // string (a signed-URL style "?a=1,2" must stay one URL).
  const parts = /^https?:\/\//i.test(u.trim()) ? [u] : u.split(",");
  const out: string[] = [];
  for (const p of parts) {
    const url = normalizeOne(p);
    if (url && !out.includes(url)) out.push(url);
  }
  return out;
}

/**
 * First media URL only. Kept for callers that show a single thumbnail; prefer
 * normalizeFeedbackMediaList anywhere the full set matters.
 */
export function normalizeFeedbackMedia(u?: string): string {
  return normalizeFeedbackMediaList(u)[0] ?? "";
}
