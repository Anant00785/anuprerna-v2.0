import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost, LoomError } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// POST { email, code } -> exchanges a 6-digit code for a session.
//
// On success the backend returns Loom's login shape, { jwt } — the SAME token a
// password login produces — so this handler stores it in the SAME httpOnly
// cookie with the SAME options as /api/auth/login. From here on nothing
// downstream can tell the two sign-in methods apart, which is exactly the
// requirement: one session shape, two ways to earn it. The JWT never reaches
// the browser.
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

  const fwd = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  let data: { jwt?: string; success?: boolean; message?: string };
  try {
    data = await loomPost<{ jwt?: string; success?: boolean; message?: string }>(
      '/auth/email-code/verify',
      { email, code },
      fwd ? { headers: { 'X-Forwarded-For': fwd } } : undefined,
    );
  } catch (e: unknown) {
    if (e instanceof LoomError) {
      const body = e.body as { message?: string } | undefined;
      // 429 (rate limit / lockout) is passed through as itself so the UI can say
      // "wait" rather than "wrong code" — two very different things to a buyer
      // who typed the right digits.
      return NextResponse.json(
        { success: false, message: body?.message || 'That code could not be verified.' },
        { status: e.status },
      );
    }
    return NextResponse.json({ success: false, message: 'That code could not be verified.' }, { status: 502 });
  }

  if (!data || typeof data.jwt !== 'string' || data.jwt.length === 0) {
    return NextResponse.json(
      { success: false, message: data?.message || 'That code is not valid or has expired.' },
      { status: 401 },
    );
  }

  const store = await cookies();
  store.set(LOOM_JWT_COOKIE, data.jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days — identical to a password login
  });
  return NextResponse.json({ success: true });
}
