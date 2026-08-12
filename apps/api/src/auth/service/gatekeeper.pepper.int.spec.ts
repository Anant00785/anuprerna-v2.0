/**
 * apps/api/src/auth/service/gatekeeper.pepper.int.spec.ts
 *
 * Local-only verification that GatekeeperService's bcrypt(pepper + password)
 * composition matches what's actually stored in production data — without
 * the real pepper ever leaving this machine (not printed, not logged, not
 * committed, not in a fixture).
 *
 * Gated behind RUN_SECRET_TESTS=1 so it never runs in CI (CI has no
 * secrets and must make no network calls — docs/TESTING.md §1). Naming it
 * `*.int.spec.ts` additionally keeps it out of the default `pnpm test`
 * task (vitest.config.ts excludes that glob); this file only runs via
 * `pnpm test:int` AND with RUN_SECRET_TESTS=1 explicitly set.
 *
 * Reads AUTH_PASSWORD_PEPPER from apps/api/.env (git-ignored) and connects
 * to loom-local-db (docker, localhost:5433, user/pass loom/loom) —
 * `loom_prod` for real bcrypt hashes. There is no known plaintext password
 * for any real account, so this cannot assert a positive match; instead it
 * asserts the stored hash is structurally a bcrypt-cost-11 hash (the
 * NVersePasswordEncoder shape) and that verifyPassword() runs against it
 * without throwing — the check that would fail loudly if the pepper env
 * var were missing/empty or the bcrypt wiring were broken.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { GatekeeperService } from "./gatekeeper.service.js";

const RUN = process.env.RUN_SECRET_TESTS === "1";

describe.skipIf(!RUN)("GatekeeperService — real pepper against loom_prod (RUN_SECRET_TESTS=1 only)", () => {
  const pepper = process.env.AUTH_PASSWORD_PEPPER;
  const client = postgres(
    { host: "localhost", port: 5433, database: "loom_prod", username: "loom", password: "loom", max: 1 },
  );

  const gatekeeper = new GatekeeperService({
    get: (key: string) => (key === "AUTH_PASSWORD_PEPPER" ? pepper : key === "AUTH_JWT_SECRET" ? "unused" : undefined),
  } as any);

  afterAll(async () => {
    await client.end();
  });

  beforeAll(() => {
    if (!pepper) {
      throw new Error(
        "RUN_SECRET_TESTS=1 but AUTH_PASSWORD_PEPPER is not set in the environment — check apps/api/.env is loaded.",
      );
    }
  });

  it("stored password hashes on real accounts are bcrypt cost-11, and verifyPassword runs against one without throwing", async () => {
    const rows = await client`select user_password from loom_tenant where user_password is not null limit 1`;

    if (rows.length === 0) {
      // loom_prod may still be loading (per the clone pipeline notes) —
      // don't fail the suite for an empty table, just say so loudly.
      console.warn(
        "[gatekeeper.pepper.int.spec] loom_prod.loom_tenant has 0 rows — clone may still be loading. " +
          "Skipping the real-hash assertion; re-run once the clone finishes.",
      );
      return;
    }

    const storedHash = rows[0].user_password as string;
    expect(storedHash).toMatch(/^\$2[aby]\$11\$/);

    // No known plaintext for a real account exists here, so this only
    // proves the pepper+bcrypt wiring executes end to end against a real
    // hash without throwing — it cannot assert a positive match without a
    // known password. A true login-shaped proof needs a dev-created test
    // account with a known password hashed by the legacy Java encoder.
    await expect(gatekeeper.verifyPassword("not-the-real-password", storedHash)).resolves.toBe(false);
  });
});
