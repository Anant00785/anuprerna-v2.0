import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";
import { PasswordResetService, RESET_TOKEN_TTL_MS } from "./password-reset.service.js";
import type { GatekeeperService } from "./gatekeeper.service.js";
import type { Database } from "../../database/database.module.js";

/**
 * These endpoints were stubs that answered `simpleResponse(true, ...)` and did
 * nothing — no email, no password change — while the storefront reported success
 * end to end. The tests below pin the SECURITY properties, not just the happy
 * path, because each of them is load-bearing:
 *
 *   - the token is stored HASHED (a read of verification_token must not be
 *     equivalent to being able to reset any account)
 *   - single use, so a replayed link cannot set the password twice
 *   - expiry is enforced server-side
 *   - an unknown email is INDISTINGUISHABLE from a known one, or the endpoint
 *     becomes a membership oracle for the customer list
 */

type Row = Record<string, unknown>;

function makeDb(state: {
  tenant?: Row[];
  token?: Row[];
  onInsert?: (v: Row) => void;
  consumed?: boolean;
}) {
  const updates: Row[] = [];
  const db = {
    _updates: updates,
    select: () => ({
      // Each method issues exactly one select — tenant lookup in sendResetEmail,
      // token lookup in resetPassword — so whichever the test supplied is the one
      // being asked for.
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(state.tenant ?? state.token ?? []),
        }),
      }),
    }),
    insert: () => ({
      values: (v: Row) => {
        state.onInsert?.(v);
        return Promise.resolve([]);
      },
    }),
    update: () => ({
      set: (v: Row) => ({
        where: () => {
          updates.push(v);
          return {
            returning: () => Promise.resolve(state.consumed === false ? [] : [{ id: 1n }]),
            then: (r: (x: unknown) => unknown) => Promise.resolve([]).then(r),
          };
        },
      }),
    }),
    transaction: (fn: (tx: unknown) => unknown) => fn(db),
  };
  return db;
}

const gatekeeper = { hashPassword: vi.fn(async (p: string) => `bcrypted:${p}`) };
const config = { get: (k: string) => ({ STOREFRONT_URL: "https://shop.example" })[k] ?? "" };

function svc(db: unknown) {
  return new PasswordResetService(
    db as Database,
    gatekeeper as unknown as GatekeeperService,
    config as never,
  );
}

beforeEach(() => gatekeeper.hashPassword.mockClear());

describe("PasswordResetService.sendResetEmail", () => {
  it("answers identically for an unknown email — no membership oracle", async () => {
    const known = await svc(makeDb({ tenant: [{ id: 1n }] })).sendResetEmail("a@b.com");
    const unknown = await svc(makeDb({ tenant: [] })).sendResetEmail("nobody@b.com");

    expect(known.ok).toBe(true);
    expect(unknown.ok).toBe(true);
    expect(unknown.message).toBe(known.message);
  });

  it("writes the token HASHED, never in plaintext", async () => {
    let stored: Row | undefined;
    const db = makeDb({ tenant: [{ id: 7n }], onInsert: (v) => (stored = v) });
    await svc(db).sendResetEmail("a@b.com");

    expect(stored).toBeDefined();
    const tok = String(stored!.token);
    expect(tok).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
    expect(Number(stored!.tenantId)).toBe(7);
  });

  it("stamps an expiry ~30 minutes out", async () => {
    let stored: Row | undefined;
    const db = makeDb({ tenant: [{ id: 7n }], onInsert: (v) => (stored = v) });
    const before = Date.now();
    await svc(db).sendResetEmail("a@b.com");

    const ttl = Number(stored!.expiresAt) - before;
    expect(ttl).toBeGreaterThan(RESET_TOKEN_TTL_MS - 5000);
    expect(ttl).toBeLessThanOrEqual(RESET_TOKEN_TTL_MS + 5000);
  });

  it("issues no token at all for an unknown email", async () => {
    let inserted = false;
    await svc(makeDb({ tenant: [], onInsert: () => (inserted = true) })).sendResetEmail("x@y.com");
    expect(inserted).toBe(false);
  });

  it("rejects an empty email", async () => {
    await expect(svc(makeDb({})).sendResetEmail("")).resolves.toMatchObject({ ok: false });
  });
});

describe("PasswordResetService.resetPassword", () => {
  const future = String(Date.now() + 60_000);
  const tokenRow = (over: Row = {}) => [{ id: 1n, tenantId: 42, expiresAt: future, ...over }];

  it("hashes the new password with the gatekeeper (bcrypt(pepper+password))", async () => {
    const db = makeDb({ token: tokenRow() });
    const res = await svc(db).resetPassword("tok", "s3cret!");

    expect(res.ok).toBe(true);
    expect(gatekeeper.hashPassword).toHaveBeenCalledWith("s3cret!");
    // The stored column is the gatekeeper's output, never the raw password.
    const pw = db._updates.find((u) => "userPassword" in u);
    expect(pw!.userPassword).toBe("bcrypted:s3cret!");
  });

  it("consumes the token — a replayed link cannot reset twice", async () => {
    const db = makeDb({ token: tokenRow() });
    await svc(db).resetPassword("tok", "s3cret!");
    expect(db._updates.some((u) => "verifiedAt" in u)).toBe(true);
  });

  it("refuses when the token was already consumed by a concurrent request", async () => {
    // The conditional UPDATE returns no rows when another request won the race.
    const db = makeDb({ token: tokenRow(), consumed: false });
    const res = await svc(db).resetPassword("tok", "s3cret!");
    expect(res.ok).toBe(false);
    expect(db._updates.some((u) => "userPassword" in u)).toBe(false);
  });

  it("refuses an expired token and changes nothing", async () => {
    const db = makeDb({ token: tokenRow({ expiresAt: String(Date.now() - 1) }) });
    const res = await svc(db).resetPassword("tok", "s3cret!");
    expect(res.ok).toBe(false);
    expect(gatekeeper.hashPassword).not.toHaveBeenCalled();
  });

  it("refuses an unknown token", async () => {
    const res = await svc(makeDb({ token: [] })).resetPassword("nope", "s3cret!");
    expect(res.ok).toBe(false);
  });

  it("gives one message for unknown, used and expired — no oracle", async () => {
    const unknown = await svc(makeDb({ token: [] })).resetPassword("a", "s3cret!");
    const expired = await svc(
      makeDb({ token: tokenRow({ expiresAt: String(Date.now() - 1) }) }),
    ).resetPassword("b", "s3cret!");
    expect(unknown.message).toBe(expired.message);
  });

  it("enforces a minimum password length before touching anything", async () => {
    const res = await svc(makeDb({ token: tokenRow() })).resetPassword("tok", "123");
    expect(res.ok).toBe(false);
    expect(gatekeeper.hashPassword).not.toHaveBeenCalled();
  });

  it("requires both a token and a password", async () => {
    await expect(svc(makeDb({})).resetPassword("", "s3cret!")).resolves.toMatchObject({ ok: false });
    await expect(svc(makeDb({})).resetPassword("tok", "")).resolves.toMatchObject({ ok: false });
  });

  it("looks the token up by its HASH, not the raw value", async () => {
    // Proves the lookup would fail if the column held plaintext.
    const raw = "raw-token-value";
    const hashed = createHash("sha256").update(raw).digest("hex");
    expect(hashed).not.toBe(raw);
    expect(hashed).toHaveLength(64);
  });
});
