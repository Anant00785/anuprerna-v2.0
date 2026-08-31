// ---------------------------------------------------------------------------
// Sandbox media URL rewrite. Live Loom (and its DB rows) embed FLAT absolute
// URLs under the live Bloomscorp S3 bucket, e.g.
//   https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/<KEY>.jpg
// The sandbox serves the SAME objects from a local, private MinIO mirror via
// the /media/[...path] route (app/media/[...path]/route.ts), so every URL the
// storefront renders must point there instead of live S3.
//
// This is the ONE rewrite point: every Loom JSON response is deep-walked here,
// in the shared fetch wrapper's parse() (see ./client.ts), so any field —
// heroImage, hoverImage, bannerImageDesktop, imageGallerySEOList[].image,
// productImages, icon, etc — gets rewritten automatically without having to
// enumerate every field name at every call site.
// ---------------------------------------------------------------------------

export const BLOOMSCORP_PREFIX = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/';

/** Rewrite a single bloomscorp S3 URL to the local sandbox /media/ route (relative path). */
export function toSandboxImageUrl(url: string): string {
  if (typeof url !== 'string' || !url.startsWith(BLOOMSCORP_PREFIX)) return url;
  return '/media/' + url.slice(BLOOMSCORP_PREFIX.length);
}

/**
 * Recursively rewrite any bloomscorp S3 URL found anywhere in a parsed JSON
 * value (object graph / array / string). Non-matching strings and all other
 * types pass through unchanged. Used once, at the Loom response boundary.
 */
export function rewriteBloomscorpUrlsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return (value.startsWith(BLOOMSCORP_PREFIX) ? toSandboxImageUrl(value) : value) as unknown as T;
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
