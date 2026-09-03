import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";

// token-helper reads AUTH_JWT_SECRET per call, so each test can set its own.
const ORIGINAL = process.env.AUTH_JWT_SECRET;

import { signToken, decodeTokenPayload, verifyToken } from "./token-helper";

// Every token this server mints carries an `exp`; helpers keep the tests honest.
const future = () => Math.floor(Date.now() / 1000) + 3600;
const past = () => Math.floor(Date.now() / 1000) - 1;

beforeEach(() => {
  process.env.AUTH_JWT_SECRET = "test-secret-do-not-ship";
});
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AUTH_JWT_SECRET;
  else process.env.AUTH_JWT_SECRET = ORIGINAL;
});

describe("signToken / decodeTokenPayload", () => {
  it("round-trips a payload it signed itself", () => {
    const exp = future();
    const token = signToken({ email: "buyer@example.com", name: "A Buyer", buyerType: "b2b", exp });
    expect(decodeTokenPayload(token)).toEqual({
      email: "buyer@example.com",
      name: "A Buyer",
      buyerType: "b2b",
      exp,
    });
  });

  it("produces the three-segment JWS shape with an HS256 header", () => {
    const [header, payload, signature] = signToken({ sub: 1, exp: future() }).split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString("utf8"))).toEqual({
      alg: "HS256",
      typ: "JWT",
    });
    expect(payload).toBeTruthy();
    expect(signature).toBeTruthy();
  });
});

describe("decodeTokenPayload rejects anything it did not sign", () => {
  it("rejects a payload swapped under a valid signature (the privilege-escalation case)", () => {
    const token = signToken({ email: "buyer@example.com", buyerType: "b2c", exp: future() });
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ email: "admin@example.com", buyerType: "b2b", exp: future() })
    ).toString("base64url");

    expect(decodeTokenPayload(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a token minted with a different secret", () => {
    const token = signToken({ email: "buyer@example.com", exp: future() });
    process.env.AUTH_JWT_SECRET = "a-different-secret";
    expect(decodeTokenPayload(token)).toBeNull();
  });

  it("rejects an unsigned alg:none token carrying a full profile", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ email: "x@y.z", name: "X", exp: future() })).toString("base64url");
    expect(decodeTokenPayload(`${header}.${payload}.`)).toBeNull();
  });

  it("rejects a foreign (real Loom) token rather than reading its claims", () => {
    // Three segments, decodable payload, signature from someone else's key.
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "opaque" })).toString("base64url");
    expect(decodeTokenPayload(`${header}.${payload}.bm90LW91ci1zaWduYXR1cmU`)).toBeNull();
  });

  it("rejects malformed input without throwing", () => {
    expect(decodeTokenPayload("")).toBeNull();
    expect(decodeTokenPayload("not-a-jwt")).toBeNull();
    expect(decodeTokenPayload("a.b")).toBeNull();
    expect(decodeTokenPayload("a.b.c.d")).toBeNull();
    expect(decodeTokenPayload(undefined as unknown as string)).toBeNull();
  });

  it("rejects a correctly signed token whose payload is not JSON", () => {
    // Signature is genuinely valid for these bytes; only JSON.parse fails.
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const garbage = Buffer.from("not json").toString("base64url");
    const sig = createHmac("sha256", process.env.AUTH_JWT_SECRET!)
      .update(`${header}.${garbage}`)
      .digest("base64url");
    expect(decodeTokenPayload(`${header}.${garbage}.${sig}`)).toBeNull();
  });
});

describe("AUTH_JWT_SECRET is required", () => {
  it("fails closed when the secret is absent instead of signing with a fallback", () => {
    delete process.env.AUTH_JWT_SECRET;
    expect(() => signToken({ email: "buyer@example.com" })).toThrow(/AUTH_JWT_SECRET/);
  });

  it("does not silently accept tokens when the secret is absent", () => {
    process.env.AUTH_JWT_SECRET = "test-secret-do-not-ship";
    const token = signToken({ email: "buyer@example.com", exp: future() });
    delete process.env.AUTH_JWT_SECRET;
    expect(decodeTokenPayload(token)).toBeNull();
  });
});

describe("expiry is enforced, not merely written", () => {
  it("rejects a correctly signed token whose exp has passed", () => {
    const token = signToken({ email: "buyer@example.com", name: "A Buyer", exp: past() });

    // The signature is genuinely ours. Only the clock says no.
    expect(decodeTokenPayload(token)).toBeNull();
    expect(verifyToken(token)).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a token that expires exactly now (>=, not >)", () => {
    const token = signToken({ email: "a@b.co", exp: Math.floor(Date.now() / 1000) });
    expect(verifyToken(token).ok).toBe(false);
  });

  it("rejects a signed token with NO exp — a session with no stated lifetime is immortal", () => {
    expect(verifyToken(signToken({ email: "a@b.co", name: "A" }))).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects a non-numeric or non-finite exp rather than coercing it", () => {
    for (const exp of ["9999999999", null, Infinity, {}]) {
      expect(verifyToken(signToken({ email: "a@b.co", exp })).ok).toBe(false);
    }
  });

  it("accepts a token still inside its window", () => {
    const result = verifyToken(signToken({ email: "a@b.co", exp: future() }));
    expect(result.ok).toBe(true);
    expect(result.ok && result.payload.email).toBe("a@b.co");
  });

  it("separates 'expired' from 'invalid' so a caller can tell our dead token from a foreign one", () => {
    expect(verifyToken(signToken({ email: "a@b.co", exp: past() })).ok).toBe(false);
    expect(verifyToken(signToken({ email: "a@b.co", exp: past() }))).toMatchObject({ reason: "expired" });
    expect(verifyToken("not.a.token")).toMatchObject({ reason: "invalid" });
  });
});
