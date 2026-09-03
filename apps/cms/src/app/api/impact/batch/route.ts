/**
 * GET /api/impact/batch
 *
 * Single server-side batch replacement for the old client-side fan-out
 * (order-list + N x /api/impact/summary/[id]). Fetches the order list, then all
 * per-order impact summaries with ONE shared service token via Promise.all, and
 * returns them joined onto each order.
 *
 * Query params:
 *   type    'regular' | 'custom'  (default: 'regular')
 *   status  order status string    (default: 'PROCESSING', regular only)
 *   size    page size, max 50      (default: 20)
 *
 * Response: { orders: Array<ImpactOrderRow & { summary: ImpactSummary | null }> }
 *
 * Each summary fetch is wrapped in unstable_cache keyed by
 * ['impact-summary', type, id] with revalidate 3600 — per-order impact data is
 * effectively immutable, so it is cached for an hour. A failed summary fetch
 * THROWS (so unstable_cache does not persist a null) and is caught per-order,
 * degrading that row to summary: null without poisoning the cache.
 *
 * Read-only — NO writes to Loom (the recompute trigger is deliberately omitted).
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { getBackendCallToken } from "@/lib/backend-call-token";
import { rewriteBloomscorpUrlsDeep } from '@/lib/media';
import type { ImpactOrderRow, ImpactSummary } from '@/lib/impact-api';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'weave_token';

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: 'localhost',
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

async function loomGet(path: string, token?: string): Promise<Record<string, unknown>> {
  const res = await fetch(BACKEND + path, { headers: authHeaders(token), cache: 'no-store' });
  if (!res.ok) throw new Error('Loom ' + res.status + ' at ' + path);
  return rewriteBloomscorpUrlsDeep(await res.json()) as Record<string, unknown>;
}

/** Raw single-order impact fetch. THROWS on failure so nothing bad is cached. */
async function fetchSummaryRaw(
  id: number,
  type: 'regular' | 'custom',
  token?: string,
): Promise<ImpactSummary | null> {
  const path = type === 'custom' ? '/get/impact/custom-order/' + id : '/get/impact/order/' + id;
  const res = await fetch(BACKEND + path, { headers: authHeaders(token), cache: 'no-store' });
  if (!res.ok) throw new Error('Loom ' + res.status + ' at ' + path);
  const raw = rewriteBloomscorpUrlsDeep(await res.json()) as Record<string, unknown>;
  return (raw.impact ?? null) as ImpactSummary | null;
}

/** Cached-per-hour summary keyed by ['impact-summary', type, id]. */
function getCachedSummary(
  id: number,
  type: 'regular' | 'custom',
  token?: string,
): Promise<ImpactSummary | null> {
  const runner = unstable_cache(
    () => fetchSummaryRaw(id, type, token),
    ['impact-summary', type, String(id)],
    { revalidate: 3600 },
  );
  return runner();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);

  const { searchParams } = req.nextUrl;
  const type = (searchParams.get('type') ?? 'regular') === 'custom' ? 'custom' : 'regular';
  const status = searchParams.get('status') ?? 'PROCESSING';
  const size = Math.min(50, Math.max(1, Number(searchParams.get('size') ?? '20')));

  try {
    const listPath =
      type === 'custom'
        ? '/get/super-user/custom-order-list?keyword=&pageNumber=0&pageSize=' + size
        : '/get/super-user/order-list?pageNumber=0&pageSize=' + size + '&status=' + status;

    const raw = await loomGet(listPath, token);
    const rawList = (raw.orderList ?? []) as Record<string, unknown>[];

    const orders: ImpactOrderRow[] = rawList.map((o) => ({
      id: Number(o.id ?? 0),
      name: String(o.name ?? '—'),
      orderStatus: String(o.orderStatus ?? ''),
      createdAt: Number(o.createdAt ?? 0),
      custom: type === 'custom',
    }));

    const withSummaries = await Promise.all(
      orders.map(async (order) => {
        let summary: ImpactSummary | null = null;
        try {
          summary = await getCachedSummary(order.id, type, token);
        } catch {
          summary = null;
        }
        return { ...order, summary };
      }),
    );

    return NextResponse.json({ orders: withSummaries });
  } catch (err) {
    console.error('[api/impact/batch]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Failed to load impact data' }, { status: 502 });
  }
}
