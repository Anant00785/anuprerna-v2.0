import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// GET -> the logged-in customer's saved addresses (read-only). Empty when anonymous.
// Loom 5xx / network -> HTTP 502 { error: 'upstream' } (distinct from 'logged out').
export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ addressList: [], authenticated: false });
  try {
    const data = await loomGet<{ addressList?: unknown[]; success?: boolean }>(
      '/get/address-list',
      { token },
    );
    return NextResponse.json({ ...data, authenticated: true });
  } catch (e: unknown) {
    if (e instanceof LoomError && (e.status === 401 || e.status === 403)) {
      return NextResponse.json({ addressList: [], authenticated: false });
    }
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
