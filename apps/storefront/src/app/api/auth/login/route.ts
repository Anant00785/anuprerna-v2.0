import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateEmail } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// POST { email, password } -> authenticates against Loom, stores the JWT in an
// httpOnly cookie, and returns only { success }. The JWT NEVER reaches the browser.
export async function POST(req: Request) {
  let email = '';
  let password = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? body?.username ?? '');
    password = String(body?.password ?? '');
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
  }

  const result = await authenticateEmail(email, password);
  if (!result.ok) {
    // 503 when the backend/tunnel is unreachable or erroring (do NOT blame the user's
    // password during an outage); 401 for a genuine credential rejection.
    const status = result.code === 'unavailable' ? 503 : 401;
    // PASS `passwordless` THROUGH. This route used to swallow it, which is why the
    // checkout sign-in modal could not branch: an account that signs in with an
    // emailed code has NO password that could ever be right, and without this flag
    // the UI could only show a generic failure in front of a box that can never be
    // satisfied. It is not an existence oracle — it is only ever returned after a
    // password attempt against that same address, and it describes the account the
    // caller just tried to open.
    return NextResponse.json(
      { success: false, message: result.message, passwordless: result.passwordless === true },
      { status },
    );
  }

  const store = await cookies();
  store.set(LOOM_JWT_COOKIE, result.jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
  return NextResponse.json({ success: true });
}
