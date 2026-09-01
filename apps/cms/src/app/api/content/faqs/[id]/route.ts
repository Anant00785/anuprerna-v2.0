/**
 * GET /api/content/faqs/[id]
 *
 * Read-only proxy — forwards GET /get/faq/{id} to the Loom backend.
 * Auth: session cookie falling back to server-minted SANDBOX_ADMIN_TOKEN.
 * No mutation exports; GET only.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServiceToken } from '@/lib/loom-service-token';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';
const COOKIE = process.env.AUTH_COOKIE_NAME ?? 'weave_token';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid FAQ id' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());

  const res = await fetch(`${BACKEND}/get/faq/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      Origin: 'localhost',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      { error: `Backend ${res.status}`, detail: text.slice(0, 200) },
      { status: res.status },
    );
  }

  const data = (await res.json()) as unknown;
  return NextResponse.json(data);
}
