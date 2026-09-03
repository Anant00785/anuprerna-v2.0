import crypto from "node:crypto";

// Read per call, not at module load: this module is evaluated during
// `next build`, where the variable is legitimately absent.
function jwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  // A committed fallback is a published signing key — anyone holding it can
  // forge a session for any account. Fail closed instead.
  if (!secret) throw new Error("AUTH_JWT_SECRET is not configured.");
  return secret;
}

export function signToken(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(`${b64Header}.${b64Payload}`);
  return `${b64Header}.${b64Payload}.${signature}`;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", jwtSecret()).update(data).digest("base64url");
}

export type TokenVerification =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Verify a token this server signed: HMAC first, THEN `exp`. A token whose
 * signature checks out but whose `exp` has passed is NOT a session — ignoring
 * the claim we ourselves wrote would make every minted session immortal,
 * including a stolen one. A token with no `exp` at all is not something this
 * server mints, and a session with no stated lifetime is the same defect, so
 * it is rejected too.
 *
 * `expired` is reported separately from `invalid` so a caller can tear the
 * cookie down (it is our token, just finished) rather than fall through to the
 * legacy-Loom path (which is what `invalid` means).
 */
export function verifyToken(token: string): TokenVerification {
  if (!token || typeof token !== "string") return { ok: false, reason: "invalid" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "invalid" };
  let payload: Record<string, unknown>;
  try {
    const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`));
    const actual = Buffer.from(parts[2]);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return { ok: false, reason: "invalid" };
    }
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!payload || typeof payload !== "object") return { ok: false, reason: "invalid" };

  const exp = payload.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return { ok: false, reason: "expired" };
  if (Date.now() >= exp * 1000) return { ok: false, reason: "expired" };

  return { ok: true, payload };
}

/**
 * Decode a token this server signed, AFTER verifying the signature AND its
 * expiry. An unverified decode would let anyone hand us a payload of their
 * choosing. Returns null for anything not minted here (e.g. a real Loom JWT)
 * and for anything past its `exp`.
 */
export function decodeTokenPayload(token: string): Record<string, unknown> | null {
  const result = verifyToken(token);
  return result.ok ? result.payload : null;
}
