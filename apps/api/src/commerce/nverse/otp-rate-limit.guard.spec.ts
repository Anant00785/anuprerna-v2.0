import { describe, it, expect, vi, afterEach } from "vitest";
import { HttpStatus } from "@nestjs/common";
import {
  OtpRateLimitGuard,
  OTP_SENDS_PER_IP,
  OTP_SENDS_PER_NUMBER,
  WINDOW_MS,
} from "./otp-rate-limit.guard.js";

/** Minimal ExecutionContext — the guard only reads ip / socket / body. */
function ctx(ip: string, contactNumber?: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip, body: { contactNumber } }) }),
  } as never;
}

afterEach(() => vi.useRealTimers());

describe("OtpRateLimitGuard", () => {
  it("allows the first OTP_SENDS_PER_NUMBER sends for a number, then 429s", () => {
    const guard = new OtpRateLimitGuard();
    // Different IP each call, so only the per-number limit can be what trips.
    for (let i = 0; i < OTP_SENDS_PER_NUMBER; i++) {
      expect(guard.canActivate(ctx(`10.0.0.${i}`, "9876543210"))).toBe(true);
    }
    expect(() => guard.canActivate(ctx("10.0.0.99", "9876543210"))).toThrowError(
      /Too many OTP requests/,
    );
  });

  it("limits per IP even when every request uses a different number", () => {
    const guard = new OtpRateLimitGuard();
    for (let i = 0; i < OTP_SENDS_PER_IP; i++) {
      expect(guard.canActivate(ctx("10.0.0.1", `90000000${String(i).padStart(2, "0")}`))).toBe(true);
    }
    expect(() => guard.canActivate(ctx("10.0.0.1", "9111111111"))).toThrow();
  });

  it("keeps a different number on a different IP unaffected", () => {
    const guard = new OtpRateLimitGuard();
    for (let i = 0; i < OTP_SENDS_PER_NUMBER; i++) guard.canActivate(ctx("10.0.0.1", "9876543210"));
    expect(guard.canActivate(ctx("10.0.0.2", "9000000000"))).toBe(true);
  });

  it("normalises formatting so +91-98765 43210 cannot buy a fresh quota", () => {
    const guard = new OtpRateLimitGuard();
    guard.canActivate(ctx("10.0.0.1", "9876543210"));
    guard.canActivate(ctx("10.0.0.2", "98765 43210"));
    guard.canActivate(ctx("10.0.0.3", "98765-43210"));
    expect(() => guard.canActivate(ctx("10.0.0.4", "(98765)43210"))).toThrow();
  });

  it("answers 429 TOO_MANY_REQUESTS, not a generic 500", () => {
    const guard = new OtpRateLimitGuard();
    for (let i = 0; i < OTP_SENDS_PER_NUMBER; i++) guard.canActivate(ctx("10.0.0.1", "9876543210"));
    try {
      guard.canActivate(ctx("10.0.0.1", "9876543210"));
      expect.unreachable("guard should have thrown");
    } catch (err) {
      expect((err as { getStatus(): number }).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it("does not reveal WHICH limit tripped — same message for IP and number", () => {
    const byNumber = new OtpRateLimitGuard();
    for (let i = 0; i < OTP_SENDS_PER_NUMBER; i++) byNumber.canActivate(ctx(`10.0.0.${i}`, "9876543210"));
    let numberMessage = "";
    try { byNumber.canActivate(ctx("10.0.0.9", "9876543210")); } catch (e) { numberMessage = (e as Error).message; }

    const byIp = new OtpRateLimitGuard();
    for (let i = 0; i < OTP_SENDS_PER_IP; i++) byIp.canActivate(ctx("10.0.0.1", `90000000${String(i).padStart(2, "0")}`));
    let ipMessage = "";
    try { byIp.canActivate(ctx("10.0.0.1", "9111111111")); } catch (e) { ipMessage = (e as Error).message; }

    expect(numberMessage).toBe(ipMessage);
  });

  it("lets the caller through again once the window has elapsed", () => {
    vi.useFakeTimers();
    const guard = new OtpRateLimitGuard();
    for (let i = 0; i < OTP_SENDS_PER_NUMBER; i++) guard.canActivate(ctx("10.0.0.1", "9876543210"));
    expect(() => guard.canActivate(ctx("10.0.0.1", "9876543210"))).toThrow();

    vi.advanceTimersByTime(WINDOW_MS + 1);
    expect(guard.canActivate(ctx("10.0.0.1", "9876543210"))).toBe(true);
  });

  it("still limits by IP when no contactNumber is supplied at all", () => {
    const guard = new OtpRateLimitGuard();
    for (let i = 0; i < OTP_SENDS_PER_IP; i++) expect(guard.canActivate(ctx("10.0.0.1"))).toBe(true);
    expect(() => guard.canActivate(ctx("10.0.0.1"))).toThrow();
  });

  it("falls back to socket.remoteAddress when req.ip is absent", () => {
    const guard = new OtpRateLimitGuard();
    const socketCtx = {
      switchToHttp: () => ({ getRequest: () => ({ socket: { remoteAddress: "10.0.0.7" }, body: {} }) }),
    } as never;
    for (let i = 0; i < OTP_SENDS_PER_IP; i++) expect(guard.canActivate(socketCtx)).toBe(true);
    expect(() => guard.canActivate(socketCtx)).toThrow();
  });
});
