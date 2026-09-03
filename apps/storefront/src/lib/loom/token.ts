// ---------------------------------------------------------------------------
// loom_jwt cookie SHAPE probe.
//
// The native (wrapper) cart accepts ONLY a WRAPPER-minted JWT: an HS256 token
// whose payload carries cleartext `customerId` (numeric) AND `roles` (array)
// claims. A legacy / foreign RAW Loom token (pre-2026-07-04 native-mint login,
// or a cookie from a different environment) has an opaque/encrypted `sub` and
// NEITHER of those cleartext claims -> the native cart denies it with
// HTTP 200 { success:false, "Authorization has been denied." } even though the
// pass-through READ routes still accept it (so the session LOOKS logged in).
//
// isWrapperToken() decodes the payload WITHOUT verifying the signature. This is
// a cheap shape heuristic used only to decide whether to trust the cookie as a
// live session -- it is NOT an auth decision (the wrapper still verifies the
// signature on every real cart call). Any malformed / non-wrapper token => false.
// ---------------------------------------------------------------------------
function decodePayload(token: string | undefined | null): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as unknown;
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * LENIENT: is this a structurally valid JWT at all?
 *
 * Deliberately does NOT inspect claims. /api/auth/me relies on that: a legacy or
 * unrecognised token must fall THROUGH to the backend profile call so the
 * backend decides, rather than being torn down locally — see the "does NOT trust
 * a forged token's claims" and "falls back to the Loom profile for a legacy
 * token" cases in route.test.ts. Tightening this function clears sessions that
 * the backend would have accepted.
 */
export function isWrapperToken(token: string | undefined | null): boolean {
  return decodePayload(token) !== null;
}

/**
 * STRICT: can this token actually perform a cart WRITE?
 *
 * The native cart needs cleartext identity claims. A legacy Loom token has an
 * opaque `sub` and no cleartext `roles`, and the cart answers
 * 200 {success:false, "Authorization has been denied."} for it — so the session
 * looks alive while every write silently fails. That is the case this catches,
 * up front, with an honest "sign in again".
 *
 * Matched against what apps/api actually mints (GatekeeperService): numeric
 * `sub`, `uid`, `email`, `roles[]`. The older wrapper's `customerId` shape is
 * still accepted so a token issued before the cutover is not spuriously
 * rejected. This is a SHAPE heuristic, never an auth decision — the API
 * verifies the signature on every real call.
 */
export function isCartCapableToken(token: string | undefined | null): boolean {
  const payload = decodePayload(token);
  if (!payload) return false;

  const hasRoles = Array.isArray(payload.roles);
  const sub = payload.sub;
  const hasSubject =
    typeof sub === 'number' ||
    (typeof sub === 'string' && /^\d+$/.test(sub)) ||
    typeof payload.customerId === 'number';

  return hasRoles && hasSubject;
}
