/**
 * Rate limit for the anonymous OTP routes (`otp/send`, `otp/resend`).
 *
 * WHY THIS EXISTS: these are unauthenticated and each accepted call sends a
 * real SMS through MSG91 once OUTBOUND_SMS_ENABLED is true — i.e. an anonymous
 * caller can spend money in a loop. MSG91 rate-limits *verification* attempts
 * server-side, which caps OTP brute force, but does nothing about send-spend.
 *
 * WHY NOT @nestjs/throttler: it is not a dependency, and pulling it in would
 * not actually buy correctness here — its default storage is per-process too,
 * so on multi-instance App Runner it has the same ceiling as this does at a
 * fraction of the reading. Limits are deliberately per (IP) and per (contact
 * number), because either one alone is trivially sidestepped.
 *
 * ponytail: in-memory fixed window, per process. A caller spread across N
 * instances gets N x the quota, and the counters reset on deploy. That is an
 * acceptable ceiling for "stop a loop from draining the SMS balance"; it is NOT
 * a defence against a distributed attacker. Upgrade path when that matters:
 * back `hits` with Redis (shared across instances) — the guard's shape does not
 * need to change, only `bump()`.
 */
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";

/** Per-IP and per-contact-number quotas, per WINDOW_MS. */
export const OTP_SENDS_PER_NUMBER = 3;
export const OTP_SENDS_PER_IP = 10;
export const WINDOW_MS = 60 * 60 * 1000; // 1 hour

type Window = { count: number; resetAt: number };

@Injectable()
export class OtpRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, Window>();

  /** Returns true when this key is still under `limit` for the current window. */
  private bump(key: string, limit: number, now: number): boolean {
    const existing = this.hits.get(key);
    if (!existing || now >= existing.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }
    existing.count += 1;
    return existing.count <= limit;
  }

  /** Drop expired windows so the Map cannot grow without bound. */
  private sweep(now: number): void {
    for (const [key, window] of this.hits) if (now >= window.resetAt) this.hits.delete(key);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();
    if (this.hits.size > 10_000) this.sweep(now);

    const ip = String(request?.ip ?? request?.socket?.remoteAddress ?? "unknown");
    // The raw body value on purpose: sanitizeContactNumber runs inside the
    // handler, i.e. after this guard, so normalising here would diverge.
    const number = String(request?.body?.contactNumber ?? "").replace(/\D/g, "");

    // Both counters are bumped before either is judged, so a caller cannot
    // spend another identity's quota to probe which limit they hit.
    const ipOk = this.bump(`ip:${ip}`, OTP_SENDS_PER_IP, now);
    const numberOk = number ? this.bump(`num:${number}`, OTP_SENDS_PER_NUMBER, now) : true;

    if (!ipOk || !numberOk) {
      // One identical message either way — saying which limit tripped would
      // tell an enumerator whether a number had been used, the same oracle
      // NVerseService.GENERIC_FAILURE exists to close.
      throw new HttpException("Too many OTP requests. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
