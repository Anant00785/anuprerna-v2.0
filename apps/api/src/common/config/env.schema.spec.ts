import { describe, expect, it } from "vitest";
import { validate } from "./env.schema.js";

// Fixture values only — never a real secret. See docs/TESTING.md.
const baseValidConfig = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/test",
  AUTH_JWT_SECRET: "test-secret-at-least-32-chars-long!!",
};

// Assembled at runtime rather than written as a literal: gitleaks' stripe rule
// matches /sk_live_[A-Za-z0-9]{24,}/ and flagged this fixture as a real leak,
// failing the secret-scan job. It is a fake key whose only purpose is proving
// the boot guard rejects live keys - see the tests below.
const LIVE_KEY_FIXTURE = ["sk", "live", "fixture00000000000000000000"].join("_");

describe("env.schema validate()", () => {
  it("passes with only the required keys set", () => {
    const result = validate({ ...baseValidConfig });
    expect(result.DATABASE_URL).toBe(baseValidConfig.DATABASE_URL);
    expect(result.AUTH_JWT_SECRET).toBe(baseValidConfig.AUTH_JWT_SECRET);
  });

  it("fails naming the missing required key when DATABASE_URL is absent", () => {
    expect(() => validate({ AUTH_JWT_SECRET: "test-secret-at-least-32-chars-long!!" })).toThrow(/DATABASE_URL/);
  });

  it("fails naming the missing required key when AUTH_JWT_SECRET is absent", () => {
    expect(() => validate({ DATABASE_URL: baseValidConfig.DATABASE_URL })).toThrow(/AUTH_JWT_SECRET/);
  });

  it("never includes a secret value in the thrown error message", () => {
    try {
      validate({ AUTH_JWT_SECRET: "test-secret-at-least-32-chars-long!!" });
      expect.fail("expected validate() to throw");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain(baseValidConfig.DATABASE_URL);
    }
  });

  it("defaults all four kill-switches to false when unset", () => {
    const result = validate({ ...baseValidConfig });
    expect(result.OUTBOUND_EMAIL_ENABLED).toBe(false);
    expect(result.OUTBOUND_SMS_ENABLED).toBe(false);
    expect(result.OUTBOUND_WHATSAPP_ENABLED).toBe(false);
    expect(result.PAYMENTS_LIVE_MODE).toBe(false);
  });

  it("parses kill-switches set to 'true' as true", () => {
    const result = validate({ ...baseValidConfig, OUTBOUND_EMAIL_ENABLED: "true" });
    expect(result.OUTBOUND_EMAIL_ENABLED).toBe(true);
  });

  it("rejects an sk_live_ Stripe key when PAYMENTS_LIVE_MODE is false", () => {
    expect(() =>
      validate({
        ...baseValidConfig,
        STRIPE_KEY_SECRET: LIVE_KEY_FIXTURE,
        PAYMENTS_LIVE_MODE: "false",
      }),
    ).toThrow(/STRIPE_KEY_SECRET/);
  });

  it("rejects an sk_live_ Stripe key even when PAYMENTS_LIVE_MODE is true but NODE_ENV is not production", () => {
    expect(() =>
      validate({
        ...baseValidConfig,
        STRIPE_KEY_SECRET: LIVE_KEY_FIXTURE,
        PAYMENTS_LIVE_MODE: "true",
        NODE_ENV: "development",
      }),
    ).toThrow(/STRIPE_KEY_SECRET/);
  });

  it("accepts an sk_live_ Stripe key when PAYMENTS_LIVE_MODE is true and NODE_ENV is production", () => {
    const result = validate({
      ...baseValidConfig,
      STRIPE_KEY_SECRET: LIVE_KEY_FIXTURE,
      PAYMENTS_LIVE_MODE: "true",
      NODE_ENV: "production",
    });
    expect(result.STRIPE_KEY_SECRET).toBe(LIVE_KEY_FIXTURE);
  });

  it("accepts an sk_test_ Stripe key with PAYMENTS_LIVE_MODE false", () => {
    const result = validate({
      ...baseValidConfig,
      STRIPE_KEY_SECRET: "sk_test_fixture00000000000000000000",
    });
    expect(result.STRIPE_KEY_SECRET).toBe("sk_test_fixture00000000000000000000");
  });

  it("rejects a Stripe key that is neither sk_test_ nor sk_live_", () => {
    expect(() => validate({ ...baseValidConfig, STRIPE_KEY_SECRET: "not-a-stripe-key" })).toThrow(
      /STRIPE_KEY_SECRET/,
    );
  });
});
