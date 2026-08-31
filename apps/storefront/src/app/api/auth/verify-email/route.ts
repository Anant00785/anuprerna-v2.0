import { NextResponse } from 'next/server';

// GET /api/auth/verify-email?token=<token>
// STUBBED FOR PUBLIC DEMO: previously proxied to Loom /confirm/verification/email.
// Because register/forgot are stubbed, no verification link can be issued on this
// preview, so this flow can never legitimately fire. Disabled regardless — NO
// loomPost is issued.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token')?.trim() ?? '';

  if (!token) {
    return NextResponse.json({ success: false, message: 'Verification token is missing.' }, { status: 400 });
  }

  // DEMO STUB: do NOT call loomPost('/confirm/verification/email', ...).
  console.log('[verify-email stub] demo mode — email verification disabled.');
  return NextResponse.json({
    success: true,
    demo: true,
    message: 'Demo mode — email verification is disabled on this preview.',
  });
}
