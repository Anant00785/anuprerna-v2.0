/**
 * apps/api/src/commerce/nverse/service/msg91-otp.service.ts
 *
 * Port of com.bloomscorp.loom.msg91.service.MSG91OTPService.
 *
 * The load-bearing property, copied exactly: THE OTP NEVER EXISTS IN THIS
 * PROCESS. MSG91 generates it, MSG91 stores it, MSG91 verifies it. We send a
 * mobile number and later ask "is this the right code?". Nothing here
 * generates, stores, compares, logs or returns an OTP value — see the Java:
 * sendOTP() posts {authkey, mobile, template_id, otp_length, otp_expiry, otp:null}
 * and verifyOTP() GETs ?authkey&mobile&otp, both keyed only on `type == "success"`.
 *
 * Loom's FakeMSG91OTPService is DELIBERATELY NOT PORTED as a working fake. It
 * mints its own OTP, keeps it in a ConcurrentHashMap and hands it back through
 * FakeOTPOperationResponse, which is what let FakeOTPController leak a live OTP
 * plus a real login JWT in a response body. The kill-switch path below is the
 * only "fake" path here, and it is fail-closed: it sends nothing and verifies
 * nothing, so no OTP can be guessed, replayed or returned.
 */
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "../../../common/config/env.schema.js";

/** MSG91OTPService.java:21-23 — the three endpoints, overridable by env. */
const DEFAULT_SEND_OTP_URL = "https://control.msg91.com/api/v5/otp";
const DEFAULT_VERIFY_OTP_URL = "https://control.msg91.com/api/v5/otp/verify";
const DEFAULT_RESEND_OTP_URL = "https://control.msg91.com/api/v5/otp/resend";

/** MSG91OTPService.java: `${msg91.otp.length:6}` / `${msg91.otp.expiry:15}`. */
export const DEFAULT_OTP_LENGTH = 6;
const DEFAULT_OTP_EXPIRY_MINUTES = 15;

/** MSG91OTPService.java: `"91" + mobileNumber` on every call. */
const COUNTRY_CODE = "91";

const OUTBOUND_DISABLED = "outbound SMS disabled";

/**
 * Deliberately NOT a discriminated union carrying provider detail to the
 * caller. `ok` is all the HTTP layer is allowed to branch on; `reason` is for
 * logs only. Anything richer becomes an oracle.
 */
export interface OtpOperationResult {
  readonly ok: boolean;
  readonly reason: string;
}

const ok = (reason: string): OtpOperationResult => ({ ok: true, reason });
const fail = (reason: string): OtpOperationResult => ({ ok: false, reason });

@Injectable()
export class Msg91OtpService {
  private readonly logger = new Logger(Msg91OtpService.name);

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  private cfg(key: keyof EnvironmentVariables): string | undefined {
    const value = this.config.get(key, { infer: true }) as unknown;
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  }

  /**
   * Root kill switch — env.schema.ts:98, defaults false. Repo invariant
   * (root CLAUDE.md): "Never point outbound email/SMS/payments at real creds
   * outside a sandbox."
   */
  private get outboundEnabled(): boolean {
    return this.config.get("OUTBOUND_SMS_ENABLED", { infer: true }) === true;
  }

  private get authKey(): string | undefined {
    return this.cfg("MSG91_AUTH_KEY");
  }

  private get templateId(): string | undefined {
    return this.cfg("MSG91_OTP_TEMPLATE_ID") ?? this.cfg("MSG91_TEMPLATE_ID");
  }

  /** Also read by the verify validator so a wrong-length OTP never reaches MSG91. */
  get otpLength(): number {
    const parsed = Number.parseInt(this.cfg("MSG91_OTP_LENGTH") ?? "", 10);
    return Number.isInteger(parsed) && parsed >= 4 && parsed <= 9 ? parsed : DEFAULT_OTP_LENGTH;
  }

  /**
   * Fail-closed gate in front of every network call. Returns a failure result
   * when the switch is off or credentials are missing; `null` means proceed.
   */
  private blockedReason(operation: string, mobile: string): OtpOperationResult | null {
    if (!this.outboundEnabled) {
      // Never log the full number.
      this.logger.warn(
        `[OUTBOUND_SMS_ENABLED=false] Suppressed MSG91 ${operation} for ...${mobile.slice(-4)}. No request was made.`,
      );
      return fail(OUTBOUND_DISABLED);
    }
    if (!this.authKey || !this.templateId) {
      this.logger.error(`MSG91 ${operation} aborted: MSG91_AUTH_KEY / MSG91_OTP_TEMPLATE_ID not configured.`);
      return fail("msg91 not configured");
    }
    return null;
  }

  /**
   * MSG91 answers `{"type":"success"|"error", ...}` on all three endpoints;
   * the Java keys on `"success".equalsIgnoreCase(response.type())` and maps
   * everything else to INSERT_FAILURE.
   */
  private async call(operation: string, url: string, init?: RequestInit): Promise<OtpOperationResult> {
    try {
      const response = await fetch(url, init);
      const body = (await response.json().catch(() => null)) as { type?: string } | null;
      if (response.ok && body?.type?.toLowerCase() === "success") return ok("success");
      this.logger.warn(`MSG91 ${operation} failed (http ${response.status}, type=${body?.type ?? "n/a"}).`);
      return fail("provider rejected");
    } catch (error) {
      this.logger.error(`MSG91 ${operation} threw: ${(error as Error).message}`);
      return fail("provider unreachable");
    }
  }

  /** MSG91OTPService.java:sendOTP + sendOTPWithActionCode. */
  async sendOtp(mobileNumber: string): Promise<OtpOperationResult> {
    const blocked = this.blockedReason("sendOTP", mobileNumber);
    if (blocked) return blocked;

    return this.call("sendOTP", this.cfg("MSG91_SEND_OTP_URL") ?? DEFAULT_SEND_OTP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authkey: this.authKey,
        mobile: COUNTRY_CODE + mobileNumber,
        template_id: this.templateId,
        otp_length: this.otpLength,
        otp_expiry: DEFAULT_OTP_EXPIRY_MINUTES,
        // `otp: null` in the Java — we never supply our own value.
        otp: null,
      }),
    });
  }

  /** MSG91OTPService.java:verifyOTP + verifyOTPWithActionCode (GET, query params). */
  async verifyOtp(mobileNumber: string, otp: string): Promise<OtpOperationResult> {
    const blocked = this.blockedReason("verifyOTP", mobileNumber);
    if (blocked) return blocked;

    const url = new URL(this.cfg("MSG91_VERIFY_OTP_URL") ?? DEFAULT_VERIFY_OTP_URL);
    url.searchParams.set("authkey", this.authKey as string);
    url.searchParams.set("mobile", COUNTRY_CODE + mobileNumber);
    url.searchParams.set("otp", otp);
    return this.call("verifyOTP", url.toString(), { method: "GET" });
  }

  /** MSG91OTPService.java:resendOTP + resendOTPWithActionCode. */
  async resendOtp(mobileNumber: string): Promise<OtpOperationResult> {
    const blocked = this.blockedReason("resendOTP", mobileNumber);
    if (blocked) return blocked;

    const url = new URL(this.cfg("MSG91_RESEND_OTP_URL") ?? DEFAULT_RESEND_OTP_URL);
    url.searchParams.set("authkey", this.authKey as string);
    url.searchParams.set("mobile", COUNTRY_CODE + mobileNumber);
    return this.call("resendOTP", url.toString(), { method: "GET" });
  }
}
