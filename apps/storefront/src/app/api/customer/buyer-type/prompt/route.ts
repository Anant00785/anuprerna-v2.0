import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet, loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

// /api/customer/buyer-type/prompt
//
// GET  -> should the order dashboard OFFER this retail buyer a business account?
//         The wrapper answers from the buyer's OWN order history against one
//         named threshold, and the answer is advisory only: nothing about this
//         request can change the account.
// POST -> record what happened to the offer: { action: 'shown' | 'dismissed' }.
//         'dismissed' has to STICK across reloads, sessions and devices, which is
//         why it is recorded here rather than kept in the browser.
//
// ACCEPTING is deliberately NOT handled here — it goes through
// /api/customer/buyer-type like every other answer, so a tap on the offer and a
// change in account settings are the same write with the same provenance.

async function authToken(): Promise<string | null> {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token || !isWrapperToken(token)) return null;
  return token;
}

export async function GET() {
  const token = await authToken();
  // Signed-out is not an error here — the order dashboard asks on every load and
  // a stale tab must get a quiet 'no offer', never a thrown request.
  if (!token) return NextResponse.json({ success: false, shouldPrompt: false });
  try {
    const result = await loomGet('/customer/buyer-type/prompt', { token });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, shouldPrompt: false });
  }
}

export async function POST(request: Request) {
  const token = await authToken();
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  let action = '';
  try {
    const body = await request.json();
    action = String((body as { action?: unknown })?.action ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (action !== 'shown' && action !== 'dismissed') {
    return NextResponse.json({ success: false, message: 'Unknown action.' }, { status: 400 });
  }
  try {
    const result = await loomPost('/customer/buyer-type/prompt', { action }, { token });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { success: false, message: e?.message || 'Could not record that right now.' },
      { status: e?.status || 500 },
    );
  }
}
