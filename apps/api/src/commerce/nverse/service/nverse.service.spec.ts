/**
 * Two properties this file exists to protect:
 *   1. NO TOKEN ON FAILURE. A `token` key must never appear in a response
 *      unless MSG91 (or bcrypt) actually said yes.
 *   2. NON-ENUMERABLE ERRORS. An unknown contact number and a wrong OTP must be
 *      byte-identical to the caller — Loom answers INCORRECT_INFORMATION for
 *      both (OTPController.java:214 and :219).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GENERIC_FAILURE, NVerseService } from "./nverse.service.js";

const KNOWN_NUMBER = "9876543210";
const UNKNOWN_NUMBER = "9000000000";

const tenant = {
  id: 7,
  uid: "uid-7",
  email: "known@example.com",
  userPassword: "$2a$11$hash",
  roles: ["ROLE_CUSTOMER"],
  banned: false,
  suspended: false,
  deleted: false,
};

let repository: any;
let tenantLookup: any;
let gatekeeper: any;
let msg91: any;
let service: NVerseService;

beforeEach(() => {
  repository = {
    findTenantByContactNumber: vi.fn(async (n: string) =>
      n === KNOWN_NUMBER ? { email: tenant.email } : null,
    ),
    consumeEmailVerificationToken: vi.fn(async () => false),
  };
  tenantLookup = {
    findByEmail: vi.fn(async () => tenant),
    updateLoginMetadata: vi.fn(async () => undefined),
  };
  gatekeeper = {
    generateToken: vi.fn(async () => "real.signed.jwt"),
    verifyPassword: vi.fn(async () => true),
  };
  msg91 = {
    sendOtp: vi.fn(async () => ({ ok: false, reason: "outbound SMS disabled" })),
    resendOtp: vi.fn(async () => ({ ok: false, reason: "outbound SMS disabled" })),
    verifyOtp: vi.fn(async () => ({ ok: false, reason: "outbound SMS disabled" })),
  };
  service = new NVerseService(repository, tenantLookup, gatekeeper, msg91);
});

describe("no token is issued on any failure path", () => {
  it("verifyOtp with a rejected OTP returns no token", async () => {
    const result = await service.verifyOtp({ contactNumber: KNOWN_NUMBER, otp: "000000" });
    expect(result).toEqual({ success: false, message: GENERIC_FAILURE });
    expect(result).not.toHaveProperty("token");
    expect(gatekeeper.generateToken).not.toHaveBeenCalled();
  });

  it("verifyOtp for an unknown number never even asks MSG91", async () => {
    const result = await service.verifyOtp({ contactNumber: UNKNOWN_NUMBER, otp: "123456" });
    expect(result).not.toHaveProperty("token");
    expect(msg91.verifyOtp).not.toHaveBeenCalled();
  });

  it("verifyOtp with the kill switch on (MSG91 unavailable) issues nothing", async () => {
    // msg91.verifyOtp already returns {ok:false, reason:"outbound SMS disabled"}
    const result = await service.verifyOtp({ contactNumber: KNOWN_NUMBER, otp: "123456" });
    expect(result).toEqual({ success: false, message: GENERIC_FAILURE });
    expect(gatekeeper.generateToken).not.toHaveBeenCalled();
  });

  it("login with a wrong password returns no token", async () => {
    gatekeeper.verifyPassword.mockResolvedValue(false);
    const result = await service.login({ email: tenant.email, password: "nope" });
    expect(result).toEqual({ success: false, message: GENERIC_FAILURE });
    expect(gatekeeper.generateToken).not.toHaveBeenCalled();
  });

  it("login never compares passwords itself — it delegates to GatekeeperService", async () => {
    await service.login({ email: tenant.email, password: "s3cret" });
    expect(gatekeeper.verifyPassword).toHaveBeenCalledWith("s3cret", tenant.userPassword);
  });

  it("issues a real signed token only when MSG91 verifies", async () => {
    msg91.verifyOtp.mockResolvedValue({ ok: true, reason: "success" });
    const result = await service.verifyOtp({ contactNumber: KNOWN_NUMBER, otp: "123456" });
    expect(result).toMatchObject({ success: true, token: "real.signed.jwt" });
    expect(gatekeeper.generateToken).toHaveBeenCalledOnce();
  });

  it("refuses a disabled account even when MSG91 verifies the OTP", async () => {
    msg91.verifyOtp.mockResolvedValue({ ok: true, reason: "success" });
    tenantLookup.findByEmail.mockResolvedValue({ ...tenant, banned: true });
    const result = await service.verifyOtp({ contactNumber: KNOWN_NUMBER, otp: "123456" });
    expect(result).toEqual({ success: false, message: GENERIC_FAILURE });
  });
});

describe("responses are not an account-enumeration oracle", () => {
  it("unknown number and wrong OTP are indistinguishable on verify", async () => {
    const unknown = await service.verifyOtp({ contactNumber: UNKNOWN_NUMBER, otp: "123456" });
    const wrongOtp = await service.verifyOtp({ contactNumber: KNOWN_NUMBER, otp: "999999" });
    expect(unknown).toEqual(wrongOtp);
  });

  it("unknown number and provider failure are indistinguishable on send", async () => {
    const unknown = await service.sendOtp({ contactNumber: UNKNOWN_NUMBER });
    const known = await service.sendOtp({ contactNumber: KNOWN_NUMBER });
    expect(unknown).toEqual(known);
    expect(unknown.message).toBe(GENERIC_FAILURE);
  });

  it("unknown email and wrong password are indistinguishable on login", async () => {
    tenantLookup.findByEmail.mockResolvedValueOnce(null);
    const unknown = await service.login({ email: "nobody@example.com", password: "x" });
    gatekeeper.verifyPassword.mockResolvedValue(false);
    const wrong = await service.login({ email: tenant.email, password: "x" });
    expect(unknown).toEqual(wrong);
  });

  it("no response body ever carries an OTP value", async () => {
    const bodies = [
      await service.sendOtp({ contactNumber: KNOWN_NUMBER }),
      await service.resendOtp({ contactNumber: KNOWN_NUMBER }),
      await service.verifyOtp({ contactNumber: KNOWN_NUMBER, otp: "123456" }),
    ];
    for (const body of bodies) {
      expect(JSON.stringify(body)).not.toMatch(/\d{4,9}/);
    }
  });
});

describe("verifyEmail is no longer an unconditional success", () => {
  it("fails when the token does not check out", async () => {
    const result = await service.verifyEmail({ email: tenant.email, token: "forged" });
    expect(result).toEqual({ success: false, message: GENERIC_FAILURE });
  });

  it("succeeds only when the repository consumes a real token", async () => {
    repository.consumeEmailVerificationToken.mockResolvedValue(true);
    const result = await service.verifyEmail({ email: tenant.email, token: "real" });
    expect(result.success).toBe(true);
  });
});
