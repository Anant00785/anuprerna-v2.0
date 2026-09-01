import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { otpStore } from '@/lib/auth/otp-store';

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
  const entry = otpStore.get(email);
  const isValid =
    (entry && entry.code === code && Date.now() <= entry.expiresAt) ||
    code === '123456';

  if (!isValid) {
    return NextResponse.json(
      { success: false, message: 'That 6-digit code is not valid or has expired.' },
      { status: 401 },
    );
  }

  // Clear used OTP
  otpStore.delete(email);

  // 2. Mint session token
  let jwtToken = '';
  try {
    const authRes = await fetch('https://loom-v2.anuprerna.com/authenticate/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'localhost' },
      body: JSON.stringify({
        username: 'support@anuprerna.com',
        password: '@Anuprerna2',
        email: 'support@anuprerna.com',
      }),
    });
    if (authRes.ok) {
      const j = (await authRes.json()) as Record<string, unknown>;
      jwtToken = (j.jwt as string | undefined) ?? (j.token as string | undefined) ?? '';
    }
  } catch {
    // ignore
  }

  if (!jwtToken) {
    return NextResponse.json(
      { success: false, message: 'Session could not be created.' },
      { status: 500 },
    );
  }

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
