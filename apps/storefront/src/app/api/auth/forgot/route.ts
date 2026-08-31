import { NextResponse } from 'next/server';

// POST { email }
// STUBBED FOR PUBLIC DEMO: previously proxied to Loom /send/verification/email,
// which sent a REAL password-reset email. Disabled on this public preview — NO
// loomPost is issued. Returns success so the UI shows its confirmation state.
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

  // DEMO STUB: do NOT call loomPost('/send/verification/email', ...).
  console.log('[forgot stub] demo mode — password email disabled for:', email);
  return NextResponse.json({
    success: true,
    demo: true,
    message: 'Demo mode — password emails are disabled on this preview.',
  });
}
