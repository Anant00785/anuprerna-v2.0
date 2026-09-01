/**
 * GET /api/impact/order/[id]
 *
 * Thin proxy to the live Loom /get/impact/order/{id} endpoint.
 *
 * Auth note: SANDBOX_ADMIN_TOKEN is accepted by sandbox-native endpoints (order
 * list, product CRUD) but is rejected by the live Loom /get/impact/* endpoints
 * with "The credentials have been tampered with." Those endpoints are
 * transparently proxied through :8090 to live Loom, so they require a genuine
 * live-Loom JWT minted via LOOM_SERVICE_{USERNAME,PASSWORD}. This is the same
 * pattern used by the order-feedback routes.
 *
 * Read-only — GET only, no mutations.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getLiveLoomToken } from '@/lib/loom-service-token';
import { rewriteBloomscorpUrlsDeep } from '@/lib/media';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;

  const token = await getLiveLoomToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Service token unavailable — check LOOM_SERVICE_* env vars' },
      { status: 503 },
    );
  }

  const url = `${BACKEND}/get/impact/order/${id}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'localhost',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  const data = rewriteBloomscorpUrlsDeep(await res.json());
  return NextResponse.json(data, { status: res.status });
}
