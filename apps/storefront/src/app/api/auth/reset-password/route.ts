import { NextResponse } from 'next/server';

// POST { token, password }
// STUBBED FOR PUBLIC DEMO: previously proxied to Loom /confirm/verification/email
// to set a new password. Because forgot/register are stubbed, no valid reset link
// can be issued on this preview, so this flow can never legitimately fire. Disabled
// regardless — NO loomPost is issued. Validation + success shape preserved.
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
  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: 'Password must be at least 6 characters.' },
      { status: 400 },
    );
  }

  // DEMO STUB: do NOT call loomPost('/confirm/verification/email', ...).
  console.log('[reset-password stub] demo mode — password change disabled.');
  return NextResponse.json({
    success: true,
    demo: true,
    message: 'Demo mode — password emails are disabled on this preview.',
  });
}
