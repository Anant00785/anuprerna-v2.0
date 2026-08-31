import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

// POST /api/customer/buyer-type   { choice: 'myself' | 'business' | 'skip' }
//
// THE ANSWER to "Who do you buy for?". One field, three values, nothing else —
// no company name, no tax id, no business details. This route is used by all
// three places the question can be answered (the declaration step at first
// sign-in, account settings, and the order-dashboard offer) so there is exactly
// one write path and exactly one provenance rule, both server-side.
//
// The client never names the provenance: the wrapper decides it from the account
// state (first answer => declared at registration; later => self-changed). A
// client that could name it could forge a staff decision.
export async function POST(request: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  if (!isWrapperToken(token)) {
    return NextResponse.json(
      { success: false, reauth: true, message: 'Your session has expired — please sign in again.' },
      { status: 401 },
    );
  }

  let choice = '';
  try {
    const body = await request.json();
    choice = String((body as { choice?: unknown })?.choice ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (choice !== 'myself' && choice !== 'business' && choice !== 'skip') {
    return NextResponse.json({ success: false, message: 'Tell us who you buy for.' }, { status: 400 });
  }

  try {
    const result = await loomPost('/customer/buyer-type', { choice }, { token });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { success: false, message: e?.message || 'Could not save that right now.' },
      { status: e?.status || 500 },
    );
  }
}
