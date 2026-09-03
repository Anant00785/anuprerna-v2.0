// Loom BFF configuration — the SINGLE place the Loom base URL + shared headers live.
// All server-side Loom calls go through lib/loom/client.ts which imports this.
// IMPORTANT: every Loom request MUST send the `Origin: localhost` header, otherwise
// many endpoints reject with "Authorization has been denied".

// Points at OUR OWN API (apps/api). Its loom-legacy-auth and cart controllers
// serve the same paths legacy Loom did, so the BFF needs no other change.
//
// NO SILENT FALLBACK. This used to end in `|| 'http://127.0.0.1:3000'`, which
// meant a missing/typo'd env var produced a storefront that rendered fine and
// quietly talked to the wrong backend — in production that is indistinguishable
// from working until a write fails. An unset base URL is a deployment fault and
// must fail loudly at the first call instead.
// Empty when unset — deliberately NOT a localhost/legacy default. The failure is
// raised by requireLoomBaseUrl() at call time rather than at import time, so a
// missing var breaks the request that needed it (loudly, with a usable message)
// instead of taking down the build or every test that merely imports this module.
export const LOOM_BASE_URL = (
  process.env.LOOM_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ''
).replace(/\/+$/, '');

export function requireLoomBaseUrl(): string {
  if (!LOOM_BASE_URL) {
    throw new Error(
      'LOOM_BASE_URL (or NEXT_PUBLIC_API_URL) is not set. Point it at the Anuprerna API — ' +
        'there is deliberately no default, so a misconfigured deploy cannot silently call the wrong backend.',
    );
  }
  return LOOM_BASE_URL;
}

// Default headers attached to EVERY Loom request (server-side only).
export const LOOM_DEFAULT_HEADERS: Record<string, string> = {
  Origin: 'localhost',
  Accept: 'application/json',
};

// Name of the httpOnly cookie that carries the Loom JWT for an authenticated browser session.
export const LOOM_JWT_COOKIE = 'loom_jwt';
