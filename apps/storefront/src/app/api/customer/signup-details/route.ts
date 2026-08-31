import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

// POST /api/customer/signup-details   { name?, choice?, sourcing? }
//
// EVERYTHING THE SIGNUP SCREEN CAN COLLECT, IN ONE WRITE — and every field is
// optional. The screen asks for a name (only when we do not already have one),
// offers an "I buy for my business" opt-in, and, only if that opt-in is taken,
// one sourcing hint. A buyer may complete it having typed nothing at all; that
// is a valid outcome and records only that we asked.
//
// WHY ONE ROUTE. It is one screen and one tap. Three routes would be three round
// trips, three partial-failure states on a single submit, and three places for
// the "we asked" stamp to be forgotten. Nothing is smuggled: the buyer-type
// write still goes through the wrapper's own declareBuyerType, so there is
// exactly one provenance rule for every surface that can set it.
//
// THE CLIENT NEVER NAMES THE PROVENANCE. It sends the buyer's words; the wrapper
// decides whether this is a first declaration or a later self-change. A client
// that could name its own provenance could forge a staff decision.
//
// NOT SENDING `choice` IS MEANINGFUL. It leaves the account undeclared — the
// default, retail experience, no tier pricing — rather than recording a retail
// choice nobody made.
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

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const name = String(body?.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const choice = String(body?.choice ?? '').trim().toLowerCase();
  const sourcing = String(body?.sourcing ?? '').trim().toLowerCase();

  const payload: Record<string, string> = {};
  if (name) payload.name = name;
  // Only the buyer's own words travel. Anything unrecognised is dropped rather
  // than forwarded, so a malformed client can never widen what this writes.
  if (choice === 'myself' || choice === 'business' || choice === 'skip') payload.choice = choice;
  if (sourcing === 'fabric' || sourcing === 'finished' || sourcing === 'both') payload.sourcing = sourcing;

  try {
    const result = await loomPost('/customer/signup-details', payload, { token });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Could not save that right now.' },
      { status: 200 },
    );
  }
}
