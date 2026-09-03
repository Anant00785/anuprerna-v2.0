import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// GET -> available discount/voucher codes (read-only, DISPLAY ONLY).
// This NEVER applies a voucher — no apply-voucher WRITE endpoint is touched.
export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ discountList: [], authenticated: false });
  try {
    const data = await loomGet<{ discountList?: unknown[] }>('/get/discount-list', { token });
    return NextResponse.json({ ...data, authenticated: true });
  } catch {
    // `/get/discount-list` is an ADMIN read — a customer bearer gets 403. That
    // is the backend behaving correctly, not a broken session, so the answer is
    // "no vouchers to show", NOT `authenticated: false`. Reporting the latter
    // made a signed-in shopper's checkout look half logged-out.
    return NextResponse.json({ discountList: [], authenticated: true });
  }
}
