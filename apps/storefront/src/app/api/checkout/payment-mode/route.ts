import { NextResponse } from 'next/server';
import { loomGet } from '@/lib/loom/client';

// GET /api/checkout/payment-mode?currency=INR
//   -> { provider, charges, success }
//
// WHICH GATEWAY WILL TAKE THIS ORDER, answered by the server that decides it.
// The checkout banner used to default to 'sandbox' and only learn the truth once
// a payment session came back, which meant that with PAYMENT_PROVIDER=live it
// told every buyer "no card is charged" right up to the moment a real gateway
// opened over the page. A statement about money is not a placeholder — so the
// page asks, and until it has an answer it says it does not know.
//
// Read-only, no customer data, no key, no write.
export async function GET(req: Request) {
  const currency = new URL(req.url).searchParams.get('currency') || 'INR';
  try {
    const data = await loomGet<{ provider?: string; charges?: boolean; success?: boolean }>(
      '/checkout/payment-mode?currency=' + encodeURIComponent(currency),
    );
    return NextResponse.json({
      provider: typeof data?.provider === 'string' ? data.provider : '',
      charges: data?.charges === true,
      success: data?.success === true,
    });
  } catch {
    // Unreachable backend must NOT collapse to a cheerful default — an empty
    // provider makes the banner say "we are still checking", which is true.
    return NextResponse.json({ provider: '', charges: false, success: false }, { status: 502 });
  }
}
