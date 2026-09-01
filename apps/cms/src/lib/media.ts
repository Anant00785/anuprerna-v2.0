// ---------------------------------------------------------------------------
// Sandbox media URL rewrite — Weave CMS.
//
// Ported from the storefront's lib/loom/media.ts. Live Loom (and its DB rows)
// embed ABSOLUTE URLs under the live Bloomscorp S3 bucket, e.g.
//   https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/<KEY>.jpg
//   https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/catalog-app/<KEY>.jpg
// The sandbox serves the SAME objects from a local, private MinIO mirror via
// the shared backend's GET /media/* route (:8090, backend/src/media/*), which
// this app's own app/media/[...path]/route.ts thin-proxies to (mirrors the
// storefront's app/media/[...path]/route.ts exactly). Every Weave response
// field that carries a bloomscorp URL must point at /media/... instead of
// live S3, so Weave never depends on live Bloomscorp being reachable to render
// a page.
//
// Weave has NO single shared Loom-fetch client (unlike the storefront's
// lib/loom/client.ts) — each data module (api.ts, admin-api.ts,
// artisanflow-api.ts, artisans-api.ts, catalog-api.ts, content-api.ts,
// custom-products-api.ts, profiles-api.ts, whatsapp-api.ts,
// order-feedback-api.ts, order-fulfillment-api.ts, plus several app/api/*
// route handlers and app/**/data.ts server fetchers) rolls its own
// fetch + res.json(). This util is imported at EACH of those boundaries and
// applied to the parsed JSON before it is returned, so the rewrite still
// happens exactly once per response, right at the point raw Loom/backend JSON
// enters the app — same principle as the storefront's single choke point,
// just with multiple call sites instead of one.
//
// Uses a global regex replace (not a strict single-URL startsWith check) so a
// bloomscorp URL embedded ANYWHERE in a string is rewritten — including
// Weave's CSV-joined multi-image fields (e.g. custom-products-api.ts's
// `additionalImages`/`additionalDocs`, which store several full URLs
// comma-separated in one string field, not as separate array elements).
// ---------------------------------------------------------------------------

export const BLOOMSCORP_PREFIX = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/';

const BLOOMSCORP_RE = /https:\/\/anuprerna-bloomscorp\.s3\.ap-south-1\.amazonaws\.com\//g;

/** Rewrite every bloomscorp S3 URL occurrence in a string to the local /media/ route. */
export function toSandboxImageUrl(url: string): string {
  if (typeof url !== 'string') return url;
  return url.replace(BLOOMSCORP_RE, '/media/');
}

/**
 * Recursively rewrite any bloomscorp S3 URL found anywhere in a parsed JSON
 * value (object graph / array / string, including CSV-joined multi-url
 * strings). Non-matching strings and all other types pass through unchanged.
 * Call this on the parsed JSON at every Loom/backend fetch boundary.
 */
export function rewriteBloomscorpUrlsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return (value.includes(BLOOMSCORP_PREFIX) ? toSandboxImageUrl(value) : value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => rewriteBloomscorpUrlsDeep(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = rewriteBloomscorpUrlsDeep(v);
    }
    return out as T;
  }
  return value;
}
