import { describe, it, expect } from "vitest";
import {
  validateLoginRequest,
  validateOtpSendRequest,
  validateOtpVerifyRequest,
  validateEmailVerifyRequest,
} from "./nverse.validator.js";

describe("validateLoginRequest", () => {
  it("accepts email + password", () => {
    expect(validateLoginRequest({ email: "a@b.com", password: "secret" })).toBeNull();
  });

  it("accepts contactNumber + password (email not required)", () => {
    expect(validateLoginRequest({ contactNumber: "123", password: "secret" })).toBeNull();
  });

  it("rejects when neither email nor contactNumber is present", () => {
    expect(validateLoginRequest({ password: "secret" })).toMatch(/Email or contact number/);
  });

  it("rejects when password is missing", () => {
    expect(validateLoginRequest({ email: "a@b.com" })).toMatch(/Password/);
  });
});

describe("validateOtpSendRequest", () => {
  it("accepts a request with a contactNumber", () => {
    expect(validateOtpSendRequest({ contactNumber: "123" })).toBeNull();
  });

  it("rejects a request missing contactNumber", () => {
    expect(validateOtpSendRequest({} as any)).toMatch(/Contact number/);
  });
});

describe("validateOtpVerifyRequest", () => {
  it("accepts contactNumber + otp", () => {
    expect(validateOtpVerifyRequest({ contactNumber: "123", otp: "0000" })).toBeNull();
  });

  it("rejects when otp is missing", () => {
    expect(validateOtpVerifyRequest({ contactNumber: "123" } as any)).toMatch(/Contact number and OTP/);
  });
});

describe("validateEmailVerifyRequest", () => {
  it("accepts email + token", () => {
    expect(validateEmailVerifyRequest({ email: "a@b.com", token: "tok" })).toBeNull();
  });

  it("rejects when token is missing", () => {
    expect(validateEmailVerifyRequest({ email: "a@b.com" } as any)).toMatch(/Email and token/);
  });
});
