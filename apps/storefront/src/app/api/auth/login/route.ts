import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateEmail } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export async function POST(req: Request) {
  let email = '';
  let password = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? body?.username ?? '').trim().toLowerCase();
    password = String(body?.password ?? '').trim();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
  }

  // The BACKEND authenticates. The storefront never stores or compares a
  // credential — it only relays the answer and parks the JWT in an httpOnly
  // cookie. authenticateEmail() POSTs {username, password} to Loom's
  // /authenticate/email through lib/loom/client (LOOM_BASE_URL), so there is
  // no hardcoded host here.
  const result = await authenticateEmail(email, password);
  if (!result.ok) {
    const status = result.code === 'unavailable' ? 503 : 401;
    return NextResponse.json(
      { success: false, message: result.message, passwordless: result.passwordless === true },
      { status },
    );
  }

  const store = await cookies();
  store.set(LOOM_JWT_COOKIE, result.jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  return NextResponse.json({ success: true });
}
