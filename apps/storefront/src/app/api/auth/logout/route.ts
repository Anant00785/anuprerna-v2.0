import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { BUYER_MODE_COOKIE, BUYER_MODE_MAX_AGE, DEFAULT_BUYER_MODE } from '@/lib/buyer-mode';

// POST -> clears the auth cookie AND reverts the buyer-mode to guest (a logged-in
// b2c/b2b session must not leave its mode behind for the next guest).
export async function POST() {
  const store = await cookies();
  store.delete(LOOM_JWT_COOKIE);
  const response = NextResponse.json({ success: true });
  response.cookies.set(BUYER_MODE_COOKIE, DEFAULT_BUYER_MODE, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: BUYER_MODE_MAX_AGE,
  });
  return response;
}
