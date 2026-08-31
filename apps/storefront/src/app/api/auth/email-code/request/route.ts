import { NextResponse } from 'next/server';
import { loomPost, LoomError } from '@/lib/loom/client';

// POST { email } -> ask the backend to email a 6-digit sign-in code.
//
// ENUMERATION SAFETY IS THE POINT OF THIS ROUTE, so it must not undo it: the
// backend answers identically for an address that has an account and one that
// does not, and this handler passes that answer through unchanged. It adds no
// existence check of its own, and it does not special-case any status other
// than the rate-limit 429 (which is applied to every caller alike and therefore
// says nothing about whether the mailbox is real).
//
// CLIENT IP: forwarded explicitly. Without it every storefront visitor would
// share ONE bucket (the Next server's own socket address) and the per-IP limit
// would throttle the whole shop at once instead of one abuser.
export async function POST(req: Request) {
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
  }

  const fwd = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  try {
    const data = await loomPost<{ success?: boolean; message?: string }>(
      '/auth/email-code/request',
      { email },
      fwd ? { headers: { 'X-Forwarded-For': fwd } } : undefined,
    );
    return NextResponse.json({ success: data?.success === true, message: data?.message ?? '' });
  } catch (e: unknown) {
    if (e instanceof LoomError) {
      const body = e.body as { message?: string } | undefined;
      return NextResponse.json(
        { success: false, message: body?.message || 'Could not send a code right now.' },
        { status: e.status },
      );
    }
    return NextResponse.json({ success: false, message: 'Could not send a code right now.' }, { status: 502 });
  }
}
