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

import { verifyToken } from '@/lib/auth/token-helper';

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ authenticated: false });

  if (!isWrapperToken(token)) {
    return clearedSession();
  }

  // 1. Passwordless sessions carry their identity in the wrapper-minted token
  // itself. Read it from the token — never from a user store on disk.
  const verified = verifyToken(token);

  // Our own token, past its `exp`. Tear the session down here rather than let
  // it fall through to the Loom profile fetch: that would answer
  // `authenticated: false` while LEAVING the expired cookie in the browser, so
  // every subsequent request would repeat the same dead round trip.
  if (!verified.ok && verified.reason === 'expired') {
    return clearedSession();
  }

  const payload = verified.ok ? verified.payload : null;
  if (payload && payload.email && payload.name) {
    const email = String(payload.email).trim().toLowerCase();
    const name = String(payload.name);
    const firstName = name.split(' ')[0] || 'Member';
    const phone = String(payload.contactNumber || payload.phone || '');
    const buyerMode = payload.buyerType === 'b2b' ? 'b2b' : 'b2c';

    const normalizedProfile = {
      ...payload,
      email,
      name,
      firstName,
      contactNumber: phone,
      phone,
      buyerType: buyerMode,
      nameKnown: Boolean(name && name !== email.split('@')[0]),
    };

    const response = NextResponse.json({ authenticated: true, profile: normalizedProfile });
    response.cookies.set(BUYER_MODE_COOKIE, buyerMode, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: BUYER_MODE_MAX_AGE,
    });
    return response;
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

    // Validate that we have at least email (name can come from email if needed)
    if (!email || !email.trim()) {
      return clearedSession();
    }

    const normalizedProfile = {
      ...profile,
      name: name || email.split('@')[0],
      firstName: (name || email.split('@')[0]).split(' ')[0] || 'Member',
      email: email.trim().toLowerCase(),
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
  } catch (err) {
    // Token rejected / expired / API error — clear the session
    console.error('[/api/auth/me] Profile fetch failed:', err);
    return clearedSession();
  }
}
