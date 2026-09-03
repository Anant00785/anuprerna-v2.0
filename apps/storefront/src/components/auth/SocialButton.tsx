'use client';
/**
 * Google sign-in, via Auth0.
 *
 * This was a PLACEHOLDER: it rendered faithfully and then popped an alert
 * saying social sign-in was not enabled. It is real now.
 *
 * Flow: Auth0 popup (Google connection) -> ID token -> POST /api/auth/social ->
 * the API verifies that token against the Auth0 JWKS, checks the issuer, and
 * checks the token's `email` claim matches. The browser never mints a session;
 * the httpOnly cookie is set server-side from the API's response.
 *
 * A popup is used rather than a full redirect so the customer keeps their place
 * — no callback route, and nothing to restore afterwards.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { env } from '@/env';

export default function SocialButton({ onError }: { onError?: (msg: string) => void } = {}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fail = (msg: string) => {
    setError(msg);
    onError?.(msg);
  };

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      // Imported on demand: the SDK is only needed by the minority of visitors
      // who choose Google, so it stays out of the initial bundle.
      const { createAuth0Client } = await import('@auth0/auth0-spa-js');

      const auth0 = await createAuth0Client({
        domain: env.NEXT_PUBLIC_AUTH0_DOMAIN,
        clientId: env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
        authorizationParams: {
          redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
          connection: 'google-oauth2',
        },
        // In-memory only. Persisting Auth0's own session in localStorage would
        // create a second source of truth next to our httpOnly cookie.
        cacheLocation: 'memory',
      });

      await auth0.loginWithPopup({
        authorizationParams: { connection: 'google-oauth2' },
      });

      const claims = await auth0.getIdTokenClaims();
      const idToken = claims?.__raw ?? '';
      const email = String(claims?.email ?? '').trim().toLowerCase();

      if (!idToken || !email) {
        // Auth0 returning no email usually means the connection is not
        // requesting the `email` scope; the API cannot match a token without it.
        fail('Google did not return an email address for this account.');
        return;
      }

      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, auth0Token: idToken }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };

      if (!res.ok || data.success !== true) {
        fail(data.message || 'Could not sign you in with Google.');
        return;
      }

      router.refresh();
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Closing the popup is a deliberate cancel, not a failure worth shouting about.
      if (/popup closed|cancelled|Popup was closed/i.test(msg)) {
        setError('');
        return;
      }
      console.error('[SocialButton] Google sign-in failed:', msg);
      fail('Google sign-in did not complete. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='w-full'>
      <button
        type='button'
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
        className='w-full rounded-lg border border-bark/40 py-2.5 flex items-center justify-center gap-2.5 hover:bg-sand transition text-sm disabled:opacity-60 disabled:cursor-not-allowed'
      >
        {/* Google G logo (inline SVG to avoid an external image request) */}
        <svg width='18' height='18' viewBox='0 0 48 48' aria-hidden='true'>
          <path fill='#EA4335' d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'/>
          <path fill='#4285F4' d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'/>
          <path fill='#FBBC05' d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'/>
          <path fill='#34A853' d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'/>
          <path fill='none' d='M0 0h48v48H0z'/>
        </svg>
        {busy ? 'Signing you in…' : 'Continue with Google'}
      </button>
      {error && <p className='mt-2 text-xs text-red-600'>{error}</p>}
    </div>
  );
}
