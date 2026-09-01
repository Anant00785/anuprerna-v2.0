/**
 * GET /api/loom/[...path]
 *
 * The single, allowlisted, GET-ONLY proxy to the Loom backend (:8090 read-only
 * wrapper). Replaces the per-feature logistics/* and wholesale/* proxy routes.
 *
 * SECURITY / READ-ONLY INVARIANT:
 *   - This file exports ONLY `GET`. No POST/PUT/PATCH/DELETE handler exists, so
 *     no mutation can ever be reached through this route.
 *   - Only path prefixes in ALLOWED_PREFIXES are forwarded; anything else is
 *     rejected 403 and logged. This prevents the catch-all from becoming an
 *     open proxy to arbitrary (including mutating) Loom endpoints.
 *
 * Auth: cookie (AUTH_COOKIE_NAME, default 'weave_token') falling back to the
 * server-minted service token. Forwards the query string; sets Content-Type,
 * Origin and Bearer; `cache: 'no-store'`; passes the upstream status through.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServiceToken, getLiveLoomToken } from '@/lib/loom-service-token';
import { rewriteBloomscorpUrlsDeep } from '@/lib/media';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';
const COOKIE = process.env.AUTH_COOKIE_NAME ?? 'weave_token';

// Explicit GET-only allowlist of Loom path prefixes reachable through this proxy.
// (get/discount-list and get/forex-list are included so all three Logistics tabs
//  keep working — the code-review list named only shipment-list but the feature
//  ships three GET lists; all remain strictly read-only.)
const ALLOWED_PREFIXES = [
  'get/table-explorer/data/whatsapp-notification-history',
  'get/super-user/order-list',
  'get/super-user/custom-order-list',
  'get/impact/order/',
  'get/impact/custom-order/',
  'get/shipment-list',
  'get/discount-list',
  'get/forex-list',
  'get/loyalty-program/customers/metrics',
  'get/loyalty-eligible/customers',
  // Order Feedback (read-only). NOTE: live Loom rejects the sandbox session
  // token on these, and the un-paginated list exceeds the wrapper's timeout,
  // so the runtime path is a server-side live-token fetch (order-feedback-api.ts).
  // These entries keep the GET-only proxy contract complete for the seam where
  // sessions carry a live CODE_SU role.
  'get/order/feedback-list',
  'get/super-user/order/feedback/',
];

function isAllowed(path: string): boolean {
  return ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  const joined = (path ?? []).join('/');

  if (!isAllowed(joined)) {
    console.warn('[api/loom] rejected disallowed path:', joined);
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;

  const query = req.nextUrl.searchParams.toString();
  const url = `${BACKEND}/${joined}${query ? `?${query}` : ''}`;

  try {
    // Caller session first -- but ONLY when the cookie is a real JWT (3-part
    // dot-separated). The sandbox admin token (SANDBOX_ADMIN_TOKEN) is opaque
    // 64-char hex: Next.js middleware whitelists it as a session, but proxied
    // endpoints split into TWO auth families after the 2026-07-03 cutover:
    //   - sandbox-NATIVE admin endpoints (e.g. get/shipment-list,
    //     get/discount-list) accept ONLY the sandbox admin token and reject a
    //     live JWT with 401 "Admin authentication required";
    //   - LIVE-proxied endpoints (e.g. get/impact/*, get/order/feedback-list)
    //     accept ONLY a genuine live-Loom JWT and reject the sandbox token
    //     with 401 "credentials tampered".
    // For opaque sessions, try the sandbox admin token first (native, no mint
    // round-trip), then retry EXACTLY once with a minted live JWT on 401.
    // GET-only either way -- the allowlist above is the mutation gate.
    const doGet = (token?: string) =>
      fetch(url, {
        headers: {
          "Content-Type": "application/json", Origin: "localhost",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

    const isJwt = !!cookieToken && cookieToken.includes(".");
    let res: Response;
    if (isJwt) {
      res = await doGet(cookieToken);
    } else {
      // Opaque sandbox session: sandbox admin token, then live-JWT fallback.
      res = await doGet(await getServiceToken());
      if (res.status === 401) {
        res = await doGet(await getLiveLoomToken());
      }
    }
    const data = rewriteBloomscorpUrlsDeep(await res.json());
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }
}
