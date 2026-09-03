import { NextResponse } from 'next/server';
import { loomPost } from '@/lib/loom/client';

/**
 * POST { token, password } — complete a password reset.
 *
 * Previously a STUB that validated the shape and returned `{ success: true }`
 * without changing anything, so the customer was told their password had been
 * updated and then could not sign in with it. The API endpoint was a stub too.
 *
 * The API is the only thing that may decide a token is valid: it holds the
 * hashed token, the expiry, and the single-use flag. This route forwards and
 * reports, it does not judge.
 */
export async function POST(req: Request) {
  let token = '';
  let password = '';
  try {
    const body = await req.json();
    token = String(body?.token ?? '').trim();
    password = String(body?.password ?? '');
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  if (!token || !password) {
    return NextResponse.json(
      { success: false, message: 'Token and new password are required.' },
      { status: 400 },
    );
  }
  // Cheap local check so an obviously-too-short password never costs a round
  // trip. The API enforces the same minimum — this is convenience, not the rule.
  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: 'Password must be at least 6 characters.' },
      { status: 400 },
    );
  }

  try {
    const result = await loomPost<{ success?: boolean; message?: string }>('/reset/password', {
      token,
      password,
    });

    // A rejected token is a 400 for the client, not a 200 with success:false —
    // the reset form needs to be able to tell "bad link" from "worked".
    if (result?.success === false) {
      return NextResponse.json(
        { success: false, message: result?.message ?? 'That reset link is invalid or has expired.' },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      message: result?.message ?? 'Password updated successfully.',
    });
  } catch (err) {
    console.error('[auth/reset-password] /reset/password failed:', err);
    return NextResponse.json(
      { success: false, message: 'Could not reset your password right now. Please try again.' },
      { status: 502 },
    );
  }
}
