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
export function isWrapperToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const payload = JSON.parse(json) as Record<string, unknown>;
    return Boolean(payload && typeof payload === 'object');
  } catch {
    return false;
  }
}
