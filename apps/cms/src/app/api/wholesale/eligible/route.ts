/**
 * GET /api/wholesale/eligible?email=...  OR  ?tenure=&minimumTotalAmount=
 *
 * Native server-side read for the /wholesale 'Eligible Customers' tab.
 * Replaces the old /api/loom/get/loyalty-eligible/customers proxy hop — made
 * native 2026-07-05 (LoyaltyController.loyaltyEligible), sandbox-only, never
 * live Loom. Read-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServiceToken } from '@/lib/loom-service-token';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'weave_token';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const params = new URLSearchParams();
    const email = searchParams.get('email');
    if (email) {
      params.set('email', email);
    } else {
      const tenure = searchParams.get('tenure');
      const minimumTotalAmount = searchParams.get('minimumTotalAmount');
      if (tenure) params.set('tenure', tenure);
      if (minimumTotalAmount) params.set('minimumTotalAmount', minimumTotalAmount);
    }
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());
    const res = await fetch(`${BACKEND}/get/loyalty-eligible/customers?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Backend unreachable' }, { status: 502 });
  }
}
