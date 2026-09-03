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
import { GateCode } from "../types/auth.types.js";
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

/**
 * Role authority — the port of LoomGatekeeper's userHasAppropriateAuthority
 * switch. These are the regression guard for the "every gate returns true"
 * authorization bypass: before the fix, every case below passed.
 */
describe("GatekeeperService — role authority (LoomGatekeeper port)", () => {
  const gatekeeper = new GatekeeperService(fakeConfig());

  const withRoles = (...roles: string[]): AuthenticatedTenant =>
    ({ id: 7, uid: "u7", email: "r@b.com", roles }) as AuthenticatedTenant;

  const SU = "ROLE_SUPER_USER";
  const CU = "ROLE_CUSTOMER";
  const GOD = "ROLE_GOD_MODE";
  // Not a member of user_role_enum — roleAR is ported but inert. See the
  // ROLE DISCREPANCY note in auth.types.ts.
  const AR = "ROLE_ARTISAN";

  // [gate, roles that satisfy it, roles that do not]
  const cases: Array<[GateCode, string[][], string[][]]> = [
    [GateCode.CODE_SU, [[SU], [GOD], [SU, CU]], [[CU], [AR], ["ROLE_ADMIN"], []]],
    [GateCode.CODE_CU, [[CU], [GOD]], [[SU], [AR], []]],
    [GateCode.CODE_AR, [[AR], [GOD]], [[SU], [CU], []]],
    [GateCode.CODE_SUCU, [[SU], [CU], [GOD]], [[AR], ["ROLE_ADMIN"], []]],
    [GateCode.CODE_SUAR, [[SU], [AR], [GOD]], [[CU], []]],
    [GateCode.CODE_CUAR, [[CU], [AR], [GOD]], [[SU], []]],
    [GateCode.CODE_SUCUAR, [[SU], [CU], [AR], [GOD]], [["ROLE_ADMIN"], []]],
  ];

  for (const [code, allowed, denied] of cases) {
    for (const roles of allowed) {
      it(`allows [${roles.join(",")}] at gate ${GateCode[code]}`, () => {
        expect(gatekeeper.userHasAppropriateAuthority(withRoles(...roles), code)).toBe(true);
      });
    }
    for (const roles of denied) {
      it(`denies [${roles.join(",") || "no roles"}] at gate ${GateCode[code]}`, () => {
        expect(gatekeeper.userHasAppropriateAuthority(withRoles(...roles), code)).toBe(false);
      });
    }
  }

  /** The single regression guard for the whole "gates are decorative" finding. */
  it("DENIES a plain ROLE_CUSTOMER token at a super-user gate", () => {
    expect(gatekeeper.userHasAppropriateAuthority(withRoles(CU), GateCode.CODE_SU)).toBe(false);
  });

  it("fails closed on an unknown gate code", () => {
    expect(gatekeeper.userHasAppropriateAuthority(withRoles(GOD), 99 as GateCode)).toBe(false);
  });

  it("fails closed when the roles claim is missing or not an array", () => {
    const noRoles = { id: 1, uid: "u", email: "e" } as unknown as AuthenticatedTenant;
    const badRoles = { id: 1, uid: "u", email: "e", roles: "ROLE_SUPER_USER" } as unknown as AuthenticatedTenant;
    for (const code of [GateCode.CODE_SU, GateCode.CODE_CU, GateCode.CODE_SUCUAR]) {
      expect(gatekeeper.userHasAppropriateAuthority(noRoles, code)).toBe(false);
      expect(gatekeeper.userHasAppropriateAuthority(badRoles, code)).toBe(false);
    }
  });
});
