/**
 * CMS session-cookie signing.
 *
 * The session token in `weave_token` is a Loom JWT signed with Loom's private
 * key, which this app does not hold — so the CMS cannot verify that signature
 * itself, and it must NOT accept any well-formed unexpired JWT as identity
 * (that let a hand-crafted token through the page gate). Instead, when
 * /api/auth/login has actually verified a credential against Loom, it mints a
 * second cookie, `weave_session`, that binds the exact issued token under an
 * HMAC keyed with CMS_SESSION_SECRET. The middleware admits a session only
 * when the pair verifies. No secret configured means NO JWT session verifies —
 * fail closed, never "presence + shape".
 *
 * Web Crypto only (no node:crypto) so it runs in both the Node route runtime
 * and the edge middleware runtime.
 */

export const SESSION_COOKIE = "weave_session";

const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Value for the weave_session cookie: `<expiryMs>.<hmac(expiryMs.token)>`. */
export async function mintSessionCookie(token: string, expiresAtMs: number, secret: string): Promise<string> {
  return `${expiresAtMs}.${await hmacHex(secret, `${expiresAtMs}.${token}`)}`;
}

/** True only when the cookie is unexpired AND its HMAC binds this exact token. */
export async function verifySessionCookie(
  cookieValue: string | undefined,
  token: string,
  secret: string,
): Promise<boolean> {
  if (!cookieValue) return false;
  const dot = cookieValue.indexOf(".");
  if (dot <= 0) return false;
  const expiresAtMs = Number(cookieValue.slice(0, dot));
  const signature = cookieValue.slice(dot + 1);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) return false;
  const expected = await hmacHex(secret, `${expiresAtMs}.${token}`);
  if (signature.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
