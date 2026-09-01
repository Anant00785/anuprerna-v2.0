import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCustomerProfile } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';
import { BUYER_MODE_COOKIE, BUYER_MODE_MAX_AGE, DEFAULT_BUYER_MODE } from '@/lib/buyer-mode';

// GET -> reports login state to the client AuthProvider. Reads the httpOnly
// cookie server-side; if present, fetches the Loom customer profile.
//
// LOGIN -> BUYER-MODE: a real login drives the storefront buyer-mode. When the
// profile resolves, we set the (non-httpOnly) ap_buyer_mode cookie from
// profile.buyerType ('b2c' | 'b2b') so BuyerModeProvider maps the logged-in
// identity to the right experience. Guests (no token) are left untouched, so the
// manual toggle still works for them; logout resets the cookie to 'guest'.

// Clear the auth cookie + reset buyer-mode to guest on a response, so a stale /
// foreign session is fully torn down (mirrors /api/auth/logout).
function clearedSession() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(LOOM_JWT_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set(BUYER_MODE_COOKIE, DEFAULT_BUYER_MODE, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: BUYER_MODE_MAX_AGE,
  });
  return response;
}

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ authenticated: false });

  // STALE / FOREIGN COOKIE GUARD. The native cart accepts ONLY a wrapper-minted
  // JWT (cleartext customerId + roles claims). A pre-native-mint RAW Loom token
  // (or a cookie from another environment) still validates against the
  // pass-through READ routes, so the session LOOKS logged in -- yet every native
  // cart write is denied with 'Authorization has been denied.' Detect that shape
  // mismatch up front and treat it as logged-out: expire the cookie + reset
  // buyer-mode so the UI prompts a fresh sign-in instead of stranding the buyer
  // in a logged-in-but-cart-broken state.
  if (!isWrapperToken(token)) {
    return clearedSession();
  }

  try {
    const res = await getCustomerProfile(token);
    // Native wrapper envelopes the customer under `customer`; live Loom uses `entity`.
    const profile = (res?.entity ??
      (res as Record<string, unknown>)?.customer ??
      res) as Record<string, unknown>;
    const tenant = (profile?.tenant ?? profile) as Record<string, unknown>;
    const name = (tenant?.name ?? profile?.name ?? '') as string;
    const email = (tenant?.email ?? profile?.email ?? '') as string;
    const buyerMode = profile?.buyerType === 'b2b' ? 'b2b' : 'b2c';

    const normalizedProfile = {
      ...profile,
      name,
      firstName: name.split(' ')[0] || 'Member',
      email,
      buyerType: buyerMode,
    };

    const response = NextResponse.json({ authenticated: true, profile: normalizedProfile });
    response.cookies.set(BUYER_MODE_COOKIE, buyerMode, {
      httpOnly: false, // client BuyerModeProvider reads this via document.cookie
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: BUYER_MODE_MAX_AGE,
    });
    return response;
  } catch {
    // Token rejected / expired.
    return NextResponse.json({ authenticated: false });
  }
}
