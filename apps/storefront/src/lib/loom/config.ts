// Loom BFF configuration — the SINGLE place the Loom base URL + shared headers live.
// All server-side Loom calls go through lib/loom/client.ts which imports this.
// IMPORTANT: every Loom request MUST send the `Origin: localhost` header, otherwise
// many endpoints reject with "Authorization has been denied".

export const LOOM_BASE_URL =
  process.env.LOOM_BASE_URL?.replace(/\/+$/, '') || 'https://loom-v2.anuprerna.com';

// Default headers attached to EVERY Loom request (server-side only).
export const LOOM_DEFAULT_HEADERS: Record<string, string> = {
  Origin: 'localhost',
  Accept: 'application/json',
};

// Name of the httpOnly cookie that carries the Loom JWT for an authenticated browser session.
export const LOOM_JWT_COOKIE = 'loom_jwt';
