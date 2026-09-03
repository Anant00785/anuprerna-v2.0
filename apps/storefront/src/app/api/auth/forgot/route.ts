import { NextResponse } from 'next/server';
import { loomPost } from '@/lib/loom/client';

/**
 * POST { email } — start a password reset.
 *
 * This used to be a STUB: it logged the address, issued no request, and returned
 * `{ success: true }`. The API endpoint behind it was stubbed too, so the whole
 * chain reported "email sent successfully" while nothing was sent and no token
 * was ever issued. Both halves are real now.
 *
 * The response deliberately does NOT reveal whether the address has an account —
 * the API answers identically either way, and this route must not add a
 * distinction the API was careful to avoid.
 */
export async function POST(req: Request) {
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
  }

  try {
    const result = await loomPost<{ success?: boolean; message?: string }>(
      '/send/password-reset/email',
      { email },
    );
    return NextResponse.json({
      success: result?.success !== false,
      message: result?.message ?? 'If that email is registered, a password reset link is on its way.',
    });
  } catch (err) {
    // A backend failure is reported, not masked as a sent email. Telling the
    // customer to go and check an inbox that will stay empty is worse than
    // telling them to try again.
    console.error('[auth/forgot] /send/password-reset/email failed:', err);
    return NextResponse.json(
      { success: false, message: 'Could not start a password reset right now. Please try again.' },
      { status: 502 },
    );
  }
}
