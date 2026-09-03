import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { otpStore } from '@/lib/auth/otp-store';
import { signToken } from '@/lib/auth/token-helper';

export async function POST(req: Request) {
  let email = '';
  let code = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
    code = String(body?.code ?? '').trim();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (!email || !code) {
    return NextResponse.json({ success: false, message: 'Email and code are required.' }, { status: 400 });
  }

  // 1. Verify OTP code
  // No universal-code backdoor: only the OTP this server actually issued, and
  // only before it expires. The check now runs against Postgres rather than a
  // per-instance Map — see lib/auth/otp-store.ts for why a valid code used to be
  // rejected as expired seconds after it was issued. verify() also consumes the
  // code on success and caps wrong guesses, so the delete here is gone.
  let isValid = false;
  try {
    isValid = await otpStore.verify(email, code);
  } catch (err) {
    // A store outage is not a bad code. Saying "invalid or expired" here would
    // send the user round the request/verify loop forever against a dead store.
    console.error('[Storefront Email OTP] verification store unavailable:', err);
    return NextResponse.json(
      { success: false, message: 'Could not verify the code right now. Please try again.' },
      { status: 503 },
    );
  }

  if (!isValid) {
    return NextResponse.json(
      { success: false, message: 'That 6-digit code is not valid or has expired.' },
      { status: 401 },
    );
  }

  // Identity comes from the verified email alone — no user records are read
  // from or written to disk.
  const local = email.split('@')[0].replace(/[._-]/g, ' ');
  const name = local.charAt(0).toUpperCase() + local.slice(1);

  // 3. Mint JWT token for this user
  const jwtToken = signToken({
    sub: email,
    email,
    name,
    firstName: name.split(' ')[0] || 'Member',
    contactNumber: '',
    phone: '',
    buyerType: 'b2c',
    roles: ['ROLE_CUSTOMER'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
  });

  const store = await cookies();
  store.set(LOOM_JWT_COOKIE, jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });

  return NextResponse.json({ success: true });
}
