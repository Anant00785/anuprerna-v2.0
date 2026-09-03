import { describe, it, expect } from "vitest";
import {
  validateLoginRequest,
  validateOtpSendRequest,
  validateOtpVerifyRequest,
  validateEmailVerifyRequest,
} from "./nverse.validator.js";
import { GENERIC_FAILURE } from "../service/nverse.service.js";

describe("validateLoginRequest", () => {
  it("accepts email + password", () => {
    expect(validateLoginRequest({ email: "a@b.com", password: "secret" })).toBeNull();
  });

  it("accepts contactNumber + password (email not required)", () => {
    expect(validateLoginRequest({ contactNumber: "123", password: "secret" })).toBeNull();
  });

  it("rejects when neither email nor contactNumber is present", () => {
    expect(validateLoginRequest({ password: "secret" })).toBe(GENERIC_FAILURE);
  });

  it("rejects when password is missing", () => {
    expect(validateLoginRequest({ email: "a@b.com" })).toBe(GENERIC_FAILURE);
  });
});

/** ContactNumberValidator.java — "^[0-9]{3,20}$". */
describe("validateOtpSendRequest — contact number format", () => {
  it("accepts a 10-digit number", () => {
    expect(validateOtpSendRequest({ contactNumber: "9876543210" })).toBeNull();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["too short", "12"],
    ["too long", "1".repeat(21)],
    ["non-numeric", "+91-98765"],
  ])("rejects a %s contact number", (_label, contactNumber) => {
    expect(validateOtpSendRequest({ contactNumber } as never)).toBe(GENERIC_FAILURE);
  });
});

/** OTPVerifyRequestValidator.java — digits only, length == msg91.otp.length (default 6). */
describe("validateOtpVerifyRequest — otp format", () => {
  it("accepts a 6-digit otp by default", () => {
    expect(validateOtpVerifyRequest({ contactNumber: "9876543210", otp: "123456" })).toBeNull();
  });

  it("honours a configured otp length", () => {
    expect(validateOtpVerifyRequest({ contactNumber: "9876543210", otp: "1234" }, 4)).toBeNull();
    expect(validateOtpVerifyRequest({ contactNumber: "9876543210", otp: "123456" }, 4)).toBe(GENERIC_FAILURE);
  });

  it.each([
    ["missing", undefined],
    ["blank", "   "],
    ["wrong length", "1234"],
    ["non-numeric", "12a456"],
  ])("rejects a %s otp", (_label, otp) => {
    expect(validateOtpVerifyRequest({ contactNumber: "9876543210", otp } as never)).toBe(GENERIC_FAILURE);
  });

  it("rejects a bad contact number before looking at the otp", () => {
    expect(validateOtpVerifyRequest({ contactNumber: "xx", otp: "123456" })).toBe(GENERIC_FAILURE);
  });
});

describe("validateEmailVerifyRequest", () => {
  it("accepts email + token", () => {
    expect(validateEmailVerifyRequest({ email: "a@b.com", token: "tok" })).toBeNull();
  });

  it("rejects when token is missing", () => {
    expect(validateEmailVerifyRequest({ email: "a@b.com" } as never)).toBe(GENERIC_FAILURE);
  });
});

describe("every validator failure is the same, non-enumerable message", () => {
  it("does not distinguish which field was wrong", () => {
    const messages = new Set([
      validateOtpSendRequest({ contactNumber: "" }),
      validateOtpVerifyRequest({ contactNumber: "", otp: "" }),
      validateOtpVerifyRequest({ contactNumber: "9876543210", otp: "1" }),
      validateLoginRequest({}),
    ]);
    expect([...messages]).toEqual([GENERIC_FAILURE]);
  });
});
