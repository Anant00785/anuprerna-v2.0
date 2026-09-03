import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

/**
 * POST { email, auth0Token } — complete a social (Google-via-Auth0) sign-in.
 *
 * The browser gets an Auth0 ID token, and this route hands it to the API's
 * /authenticate/social. The API is the ONLY thing that decides whether that
 * token is real: it verifies the RS256 signature against the tenant JWKS,
 * checks the issuer, and — critically — checks that the token's `email` claim
 * matches the email being authenticated. Without that last check a valid Auth0
 * token for one account would authenticate as another.
 *
 * This route therefore does NOT trust the `email` in the body for anything
 * except passing it along to be checked against the token. The session cookie
 * is set from the API's response, never from anything the client asserted.
 */
export async function POST(req: Request) {
  let email = '';
  let auth0Token = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
    auth0Token = String(body?.auth0Token ?? '').trim();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  if (!email || !auth0Token) {
    return NextResponse.json(
      { success: false, message: 'Sign-in did not complete. Please try again.' },
      { status: 400 },
    );
  }

  try {
    const result = await loomPost<{ success?: boolean; token?: string; jwt?: string; message?: string }>(
      '/authenticate/social',
      { email, auth0Token },
    );

    const jwt = result?.token || result?.jwt || '';
    if (result?.success === false || !jwt) {
      return NextResponse.json(
        { success: false, message: result?.message || 'Could not sign you in with Google.' },
        { status: 401 },
      );
    }

    const store = await cookies();
    store.set(LOOM_JWT_COOKIE, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    return NextResponse.json({ success: true, message: 'Signed in.' });
  } catch (err) {
    // 401 from the API means the provider token did not verify — that is a
    // rejected sign-in, not an outage, and the two must not read the same.
    const status = (err as { status?: number })?.status;
    console.error('[auth/social] /authenticate/social failed:', status, String(err).slice(0, 200));
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { success: false, message: 'Google sign-in could not be verified. Please try again.' },
        { status: 401 },
      );
    }
    if (status === 503) {
      // AUTH0_ISSUER unset on the API — a configuration fault, not the user's.
      return NextResponse.json(
        { success: false, message: 'Google sign-in is temporarily unavailable.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { success: false, message: 'Could not sign you in right now. Please try again.' },
      { status: 502 },
    );
  }
}
