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
    code = String(body?.code ?? '').replace(/\s+/g, '').trim();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (!email || !code) {
    return NextResponse.json({ success: false, message: 'Email and code are required.' }, { status: 400 });
  }

  // 1. Verify OTP code
  const entry = otpStore.get(email);
  const isValid = Boolean(entry && entry.code.replace(/\s+/g, '') === code && Date.now() <= entry.expiresAt);

  if (!isValid) {
    return NextResponse.json(
      { success: false, message: 'That 6-digit code is not valid or has expired.' },
      { status: 401 },
    );
  }

  // Clear used OTP
  otpStore.delete(email);

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
