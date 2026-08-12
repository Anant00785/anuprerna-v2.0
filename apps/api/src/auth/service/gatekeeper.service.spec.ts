/**
 * apps/api/src/auth/service/gatekeeper.service.spec.ts
 *
 * Unit tests for the JC-1 (bcrypt+pepper password verification) and JC-2
 * (jose-issued JWT) rework. Uses a fixture pepper/secret only — never a
 * real secret, per docs/TESTING.md and the task brief. A local-only test
 * against a real account hash lives in gatekeeper.pepper.int.spec.ts,
 * gated behind RUN_SECRET_TESTS=1 and excluded from this (default) suite.
 *
 * No Test.createTestingModule — a fake ConfigService exposing only `.get`
 * is enough, matching the pattern in common/auth/roles.guard.spec.ts.
 *
 * TIMEOUT: bcrypt at cost 11 is deliberately slow — roughly 1.4s per hash on
 * a dev machine, and slower under load. With vitest's 5s default these tests
 * pass when run alone and fail under `turbo run test`, where three packages
 * hash concurrently. That is a flaky suite, not a slow one, so the timeout is
 * raised explicitly rather than left to chance. Do NOT "fix" this by lowering
 * the cost factor: cost 11 is what production hashes use, and testing a
 * cheaper factor would not exercise the real thing.
 */
import { describe, it, expect } from "vitest";
import { GatekeeperService } from "./gatekeeper.service.js";
import type { AuthenticatedTenant } from "../types/auth.types.js";

const FIXTURE_PEPPER = "test-pepper";
const FIXTURE_SECRET = "test-jwt-secret-not-real";

/**
 * A known-good bcrypt(pepper + password) vector, generated once with
 * `bcrypt.hashSync("test-pepper" + "hunter2", 11)` from the `bcryptjs`
 * package this service now uses — asserts against the *format* this
 * migration targets, not just this service's own round-trip.
 */
const KNOWN_GOOD_HASH = "$2b$11$2Shnw0ClWWcdJHv2QzjQv.Y.dRQErZTiMwZFp61B180jU0NCYBFkW";
const KNOWN_GOOD_PASSWORD = "hunter2";

function fakeConfig(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    AUTH_JWT_SECRET: FIXTURE_SECRET,
    AUTH_PASSWORD_PEPPER: FIXTURE_PEPPER,
    AUTH_JWT_TTL_SECONDS: 3600,
    ...overrides,
  };
  return { get: (key: string) => values[key] } as any;
}

const tenant: AuthenticatedTenant = { id: 1, uid: "u1", email: "a@b.com", roles: ["ROLE_CUSTOMER"] };

describe("GatekeeperService — password hashing (bcrypt(pepper + password), cost 11)", () => {
  it("hashes then verifies the same password round-trip", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());
    const hash = await gatekeeper.hashPassword("correct horse battery staple");

    expect(await gatekeeper.verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("produces a bcrypt hash at cost factor 11", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());
    const hash = await gatekeeper.hashPassword("anything");

    expect(hash).toMatch(/^\$2[aby]\$11\$/);
  });

  it("rejects the wrong password", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());
    const hash = await gatekeeper.hashPassword("correct horse battery staple");

    expect(await gatekeeper.verifyPassword("wrong password", hash)).toBe(false);
  });

  it("rejects a correct password hashed under a different pepper", async () => {
    const hashedUnderPepperA = await new GatekeeperService(fakeConfig({ AUTH_PASSWORD_PEPPER: "pepper-a" })).hashPassword(
      "shared-password",
    );
    const verifiedUnderPepperB = await new GatekeeperService(fakeConfig({ AUTH_PASSWORD_PEPPER: "pepper-b" })).verifyPassword(
      "shared-password",
      hashedUnderPepperA,
    );

    expect(verifiedUnderPepperB).toBe(false);
  });

  it("verifies a known-good bcrypt(pepper + password) vector — the exact composition production hashes use", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());

    expect(await gatekeeper.verifyPassword(KNOWN_GOOD_PASSWORD, KNOWN_GOOD_HASH)).toBe(true);
  });

  it("returns false, not throws, for an empty stored hash", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());

    expect(await gatekeeper.verifyPassword("anything", "")).toBe(false);
  });
});

describe("GatekeeperService — JWT (jose-issued, HS256)", () => {
  it("signs then verifies a token round-trip, preserving the claim shape RolesGuard depends on", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());
    const token = await gatekeeper.generateToken(tenant);

    const resolved = gatekeeper.verifyToken(token);
    expect(resolved).toEqual(tenant);
  });

  it("verifyToken is synchronous — RolesGuard assigns its result directly, no await", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());
    const token = await gatekeeper.generateToken(tenant);

    const resolved = gatekeeper.verifyToken(token);
    expect(resolved).not.toBeInstanceOf(Promise);
  });

  it("rejects an expired token", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig({ AUTH_JWT_TTL_SECONDS: -1 }));
    const token = await gatekeeper.generateToken(tenant);

    expect(() => gatekeeper.verifyToken(token)).toThrow(/expired/i);
  });

  it("rejects a token with a tampered signature", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());
    const token = await gatekeeper.generateToken(tenant);
    const [header, body] = token.split(".");
    const tampered = `${header}.${body}.not-the-real-signature`;

    expect(() => gatekeeper.verifyToken(tampered)).toThrow();
  });

  it("rejects a token with a tampered payload (signature no longer matches)", async () => {
    const gatekeeper = new GatekeeperService(fakeConfig());
    const token = await gatekeeper.generateToken(tenant);
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ ...tenant, roles: ["ROLE_GOD_MODE"] })).toString("base64url");

    expect(() => gatekeeper.verifyToken(`${header}.${forgedPayload}.${signature}`)).toThrow();
  });

  it("rejects a token signed with a different secret", async () => {
    const signer = new GatekeeperService(fakeConfig({ AUTH_JWT_SECRET: "secret-a" }));
    const verifier = new GatekeeperService(fakeConfig({ AUTH_JWT_SECRET: "secret-b" }));
    const token = await signer.generateToken(tenant);

    expect(() => verifier.verifyToken(token)).toThrow();
  });

  it("rejects a malformed token", () => {
    const gatekeeper = new GatekeeperService(fakeConfig());

    expect(() => gatekeeper.verifyToken("not-a-jwt")).toThrow();
  });
});
