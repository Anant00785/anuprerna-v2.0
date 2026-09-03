// Loom BFF configuration — the SINGLE place the Loom base URL + shared headers live.
// All server-side Loom calls go through lib/loom/client.ts which imports this.
// IMPORTANT: every Loom request MUST send the `Origin: localhost` header, otherwise
// many endpoints reject with "Authorization has been denied".

// Defaults to OUR OWN API (apps/api). Its loom-legacy-auth and cart
// controllers serve the same paths legacy Loom did, so the BFF needs no other
// change to run against it. The previous default was the remote Loom, which
// rejects sessions issued locally — a developer with no LOOM_BASE_URL set got
// a storefront that logged in but could not write to a cart.
export const LOOM_BASE_URL =
  process.env.LOOM_BASE_URL?.replace(/\/+$/, '') ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'https://loom-v2.anuprerna.com';

// Default headers attached to EVERY Loom request (server-side only).
export const LOOM_DEFAULT_HEADERS: Record<string, string> = {
  Origin: 'localhost',
  Accept: 'application/json',
};

// Name of the httpOnly cookie that carries the Loom JWT for an authenticated browser session.
export const LOOM_JWT_COOKIE = 'loom_jwt';
