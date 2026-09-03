/**
 * GET /api/logistics/discounts
 *
 * Native server-side read for the /logistics 'Discounts' tab (Discount codes).
 * Replaces the old /api/loom/get/discount-list proxy hop — get/discount-list is
 * sandbox-NATIVE (CommerceConfigController), never live Loom. Read-only.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendCallToken } from "@/lib/backend-call-token";

export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'weave_token';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);
    const res = await fetch(`${BACKEND}/get/discount-list`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Backend unreachable' }, { status: 502 });
  }
}
