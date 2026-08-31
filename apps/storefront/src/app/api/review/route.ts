import { NextResponse } from 'next/server';

// POST { orderId, rating, comment, name, email }
// STUBBED: the /add/order/feedback endpoint is a content write — not wired to avoid
// unintended data modifications. Returns success so the client shows the success state.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, rating, name, email } = body;
    if (!orderId || !rating || !name || !email) {
      return NextResponse.json(
        { success: false, message: 'orderId, rating, name and email are required.' },
        { status: 400 },
      );
    }
    // STUB: log intent; do not call /add/order/feedback or /add/review.
    console.log('[review stub] would submit review for order:', orderId);
    return NextResponse.json({ success: true, message: 'Review submitted (stub).' });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid body.' }, { status: 400 });
  }
}
