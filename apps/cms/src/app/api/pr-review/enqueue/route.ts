/**
 * POST /api/pr-review/enqueue { repo, pr_number } — the "Run review" button.
 * Auth-gated (logged-in weave user); forwards to the :8090 wrapper with the
 * admin token injected server-side.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServiceToken } from '@/lib/loom-service-token';
import { getIdentity } from '@/lib/feedback-identity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';

export async function POST(req: NextRequest) {
  const me = await getIdentity();
  if (!me.authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { repo?: string; pr_number?: number };
  try {
    const token = await getServiceToken();
    const res = await fetch(`${BACKEND}/pr-review/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'localhost',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ repo: body.repo, pr_number: body.pr_number }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Backend unreachable' },
      { status: 502 },
    );
  }
}
