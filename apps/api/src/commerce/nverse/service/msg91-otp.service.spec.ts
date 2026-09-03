/**
 * The kill switch is the single most important behaviour in this file: with
 * OUTBOUND_SMS_ENABLED false (its default, env.schema.ts:98) nothing may reach
 * the network, and no OTP value may exist anywhere in the process.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { Msg91OtpService } from "./msg91-otp.service.js";

const config = (values: Record<string, unknown>) =>
  ({ get: (key: string) => values[key] }) as never;

const CREDS = {
  MSG91_AUTH_KEY: "test-key",
  MSG91_OTP_TEMPLATE_ID: "test-template",
};

afterEach(() => vi.unstubAllGlobals());

describe("Msg91OtpService — OUTBOUND_SMS_ENABLED kill switch", () => {
  it.each(["sendOtp", "resendOtp"] as const)("%s makes no network call when the switch is off", async (method) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new Msg91OtpService(config({ ...CREDS, OUTBOUND_SMS_ENABLED: false }));
    const result = await service[method]("9876543210");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: "outbound SMS disabled" });
  });

  it("verifyOtp makes no network call and never succeeds when the switch is off", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new Msg91OtpService(config({ ...CREDS, OUTBOUND_SMS_ENABLED: false }));
    const result = await service.verifyOtp("9876543210", "123456");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });

  it("treats an unset switch as off (fail closed)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new Msg91OtpService(config(CREDS));
    expect((await service.sendOtp("9876543210")).ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails closed when the switch is on but credentials are missing", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new Msg91OtpService(config({ OUTBOUND_SMS_ENABLED: true }));
    expect((await service.sendOtp("9876543210")).ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("Msg91OtpService — provider call shape (MSG91OTPService.java parity)", () => {
  const enabled = () =>
    new Msg91OtpService(config({ ...CREDS, OUTBOUND_SMS_ENABLED: true, MSG91_OTP_LENGTH: "6" }));

  it("sends the Java's payload and never supplies its own OTP value", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ type: "success" }) });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await enabled().sendOtp("9876543210");

    expect(result.ok).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://control.msg91.com/api/v5/otp");
    // "91" + mobileNumber — MSG91OTPService.java sendOTP.
    expect(JSON.parse(init.body)).toEqual({
      authkey: "test-key",
      mobile: "919876543210",
      template_id: "test-template",
      otp_length: 6,
      otp_expiry: 15,
      otp: null,
    });
  });

  it("verifies via GET with authkey/mobile/otp query params", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ type: "success" }) });
    vi.stubGlobal("fetch", fetchSpy);

    await enabled().verifyOtp("9876543210", "654321");

    const url = new URL(fetchSpy.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/v5/otp/verify");
    expect(url.searchParams.get("mobile")).toBe("919876543210");
    expect(url.searchParams.get("otp")).toBe("654321");
  });

  it('maps anything other than type=="success" to failure', async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ type: "error" }) }));
    expect((await enabled().verifyOtp("9876543210", "000000")).ok).toBe(false);
  });

  it("fails closed when the provider is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    expect((await enabled().sendOtp("9876543210")).ok).toBe(false);
  });

  it("clamps a nonsense MSG91_OTP_LENGTH to the Java default of 6", () => {
    expect(new Msg91OtpService(config({ MSG91_OTP_LENGTH: "99" })).otpLength).toBe(6);
    expect(new Msg91OtpService(config({ MSG91_OTP_LENGTH: "4" })).otpLength).toBe(4);
  });
});
