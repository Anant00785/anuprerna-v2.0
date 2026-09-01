/**
 * GET /api/pr-review/list — same-origin proxy for the client Refresh button.
 * Re-pulls open PRs from GitHub through the :8090 wrapper, injecting the admin
 * token server-side (getServiceToken) so it never reaches the browser.
 */
import { NextResponse } from 'next/server';
import { getServiceToken } from '@/lib/loom-service-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';

export async function GET() {
  try {
    const token = await getServiceToken();
    const res = await fetch(`${BACKEND}/pr-review/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'localhost',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Backend unreachable' },
      { status: 502 },
    );
  }
}
