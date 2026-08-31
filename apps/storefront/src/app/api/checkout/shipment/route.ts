import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// GET -> available shipment methods (read-only).
// Loom 5xx / network -> HTTP 502 { error: 'upstream' } (distinct from 'logged out').
//
// GUEST CHECKOUT (2026-08-16): an anonymous caller used to get an EMPTY list,
// because /get/shipment-list is CODE_SUCU and 401s without a token — which made a
// guest checkout unable to price shipping at all. A guest now reads the SAME data
// from /checkout/shipment-list, the wrapper's guest-readable route over the same
// service. Shipment records are public commerce config; no customer data.
export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  const path = token ? '/get/shipment-list' : '/checkout/shipment-list';
  try {
    const data = await loomGet<{ shipmentList?: unknown[]; success?: boolean }>(
      path,
      token ? { token } : undefined,
    );
    return NextResponse.json({ ...data, authenticated: !!token });
  } catch (e: unknown) {
    if (e instanceof LoomError && (e.status === 401 || e.status === 403)) {
      return NextResponse.json({ shipmentList: [], authenticated: false });
    }
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
