import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateEmail } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE, LOOM_BASE_URL } from '@/lib/loom/config';
import { userStore } from '@/lib/auth/user-store';
import { signToken } from '@/lib/auth/token-helper';

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

  // 1. Check special user credentials or local user store
  const localUser = userStore.get(email);
  const isAnant = email === 'anantkr10000@gmail.com' && (password === 'Anant@1234' || password.toLowerCase() === 'anant@1234' || password === 'Anant@123');
  const isLocalMatch = localUser && localUser.password && (localUser.password === password || localUser.password.trim() === password);

  if (isAnant || isLocalMatch) {
    const userName = localUser?.name || 'Anant Kumar';
    const jwtToken = signToken({
      sub: email,
      email,
      name: userName,
      firstName: userName.split(' ')[0] || 'Member',
      contactNumber: localUser?.phone || '+91 9876543210',
      phone: localUser?.phone || '+91 9876543210',
      buyerType: localUser?.buyerType || 'b2c',
      companyName: localUser?.companyName || '',
      gstNumber: localUser?.gstNumber || '',
      roles: localUser?.buyerType === 'b2b' ? ['ROLE_CUSTOMER', 'ROLE_WHOLESALE'] : ['ROLE_CUSTOMER'],
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

  // 2. Try backend API authentication (Render or local)
  const apiUrls = [
    'https://anuprerna-api.onrender.com/authenticate/email',
    'http://127.0.0.1:3000/authenticate/email',
  ];

  for (const apiUrl of apiUrls) {
    try {
      const nestRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'localhost' },
        body: JSON.stringify({ username: email, password, email }),
      });
      if (nestRes.ok) {
        const data = await nestRes.json();
        const jwtToken = (data.jwt as string | undefined) ?? (data.token as string | undefined) ?? '';
        if (jwtToken) {
          if (!userStore.has(email)) {
            const defaultName = email === 'anantkr10000@gmail.com' ? 'Anant Kumar' : email.split('@')[0];
            userStore.set(email, {
              email,
              name: defaultName,
              phone: '',
              password,
              buyerType: 'b2c',
            });
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
      }
    } catch {
      // try next
    }
  }

  // 3. Fallback to remote Loom authentication
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
