import { LOOM_BASE_URL } from '@/lib/loom/config';

// ---------------------------------------------------------------------------
// GET /media/[...path] — THIN PROXY to the sandbox backend's /media/* route.
//
// Every Loom response has its live Bloomscorp S3 image URLs rewritten to a
// relative /media/<key> path at the fetch boundary (lib/loom/media.ts). This
// route forwards that request to the NestJS wrapper, which is the ONE place
// that reads the PRIVATE, localhost-only MinIO mirror (bucket
// anuprerna-media-backup) and streams the object back — or 302-redirects to the
// live Bloomscorp original on a genuine miss.
//
// It reuses LOOM_BASE_URL — the SAME env var the app already uses to reach the
// backend for data — so ONE code path works on BOTH surfaces:
//   * VPS sandbox  : LOOM_BASE_URL = http://127.0.0.1:8090  (backend, localhost)
//   * Vercel demo  : LOOM_BASE_URL = the backend cloudflared tunnel URL
// Vercel can therefore serve sandbox media WITHOUT ever reaching MinIO directly
// (which is impossible from Vercel — MinIO binds 127.0.0.1 only). The storefront
// no longer needs any MinIO credentials.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

// Redirect status codes the backend uses for its live-original fallback.
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const segments = (path ?? []).filter(Boolean);
  if (segments.length === 0) return new Response('Not found', { status: 404 });

  const rawPath = segments.join('/');
  const encoded = segments.map((s) => encodeURIComponent(s)).join('/');
  const upstreamUrl = LOOM_BASE_URL + '/media/' + encoded;
  const s3FallbackUrl = `https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/${rawPath}`;

  let upstream: Response | null = null;
  try {
    upstream = await fetch(upstreamUrl, { redirect: 'manual' });
  } catch {
    return Response.redirect(s3FallbackUrl, 302);
  }

  // Pass the fallback redirect (302 -> live Bloomscorp) through untouched.
  if (upstream && REDIRECT_STATUSES.has(upstream.status)) {
    const location = upstream.headers.get('location');
    return new Response(null, {
      status: upstream.status,
      headers: location ? { Location: location } : { Location: s3FallbackUrl },
    });
  }

  if (!upstream || upstream.status !== 200 || !upstream.body) {
    return Response.redirect(s3FallbackUrl, 302);
  }

  // Stream the backend response straight through, preserving Content-Type and
  // the long-lived immutable cache header the backend set.
  const headers: Record<string, string> = {
    'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
    'Cache-Control':
      upstream.headers.get('cache-control') || 'public, max-age=31536000, immutable',
  };
  const len = upstream.headers.get('content-length');
  if (len) headers['Content-Length'] = len;

  return new Response(upstream.body, { status: 200, headers });
}
