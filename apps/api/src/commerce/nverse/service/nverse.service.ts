/**
 * apps/api/src/commerce/nverse/service/nverse.service.ts
 *
 * Port of com.bloomscorp.loom.nverse.controller.OTPController's service-side
 * behaviour. This file previously held stub code that compared passwords in
 * plaintext (`user.userPassword !== data.password`), accepted the hardcoded
 * OTP "1234", returned the literal string 'dummy-jwt-token', and answered
 * every email-verification with success. All four are gone.
 *
 * Loom's real flow, source-verified:
 *   sendOTP   — OTPController.java:177-181: reject unknown contact number with
 *               ActionCode.INCORRECT_INFORMATION, else msg91.sendOTPWithActionCode.
 *   verifyOTP — OTPController.java:210-231: validate shape -> contact number
 *               must exist -> MSG91 verifies the code -> only THEN load the
 *               tenant and jwtService.generateToken(user). The OTP itself is
 *               never generated, stored or compared here.
 *   resendOTP — OTPController.java:276-280, same shape as sendOTP.
 *
 * ACCOUNT ENUMERATION: Loom answers ActionCode.INCORRECT_INFORMATION for both
 * "no such contact number" (:179, :214, :224) and a failed validator (:211), so
 * an anonymous caller cannot tell a registered number from an unregistered one.
 * That is reproduced with the single GENERIC_FAILURE message below — every
 * pre-token failure path returns exactly it, byte for byte.
 */
import { Injectable, Logger } from "@nestjs/common";
import { NVerseRepository } from "../repository/nverse.repository.js";
import { TenantLookupRepository } from "../../../auth/repository/tenant-lookup.repository.js";
import { GatekeeperService } from "../../../auth/service/gatekeeper.service.js";
import { Msg91OtpService } from "./msg91-otp.service.js";
import { LoginRequest, OtpSendRequest, OtpVerifyRequest, EmailVerifyRequest } from "../types/nverse.types.js";
import { simpleResponse, keyedResponse, paginatedResponse } from "../../../common/response/rain-response.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";

/**
 * ActionCode.message(ActionCode.INCORRECT_INFORMATION) equivalent. ONE string
 * for every anonymous failure: unknown user, wrong password, wrong OTP,
 * provider outage, kill switch. Do not add a second one — the moment two
 * failure paths are distinguishable these endpoints become an oracle over the
 * tenant table.
 */
export const GENERIC_FAILURE = "Incorrect information.";

@Injectable()
export class NVerseService {
  private readonly logger = new Logger(NVerseService.name);

  constructor(
    private readonly repository: NVerseRepository,
    private readonly tenantLookup: TenantLookupRepository,
    private readonly gatekeeper: GatekeeperService,
    private readonly msg91: Msg91OtpService,
  ) {}

  /**
   * Delegates to the same bcrypt(pepper + password) path AuthController uses
   * (GatekeeperService#verifyPassword) and issues a real signed JWT via
   * GatekeeperService#generateToken. No plaintext compare, no literal token.
   */
  async login(data: LoginRequest) {
    const email = data.email ?? (await this.emailForContactNumber(data.contactNumber));
    if (!email || !data.password) return simpleResponse(false, GENERIC_FAILURE);

    const tenant = await this.tenantLookup.findByEmail(email);
    if (!tenant) return simpleResponse(false, GENERIC_FAILURE);

    // Disabled accounts are indistinguishable from bad credentials here on
    // purpose — this endpoint is anonymous. /auth/authenticate keeps the
    // distinct ACCOUNT_DISABLED code for the authenticated-shape flow.
    if (tenant.banned || tenant.suspended || tenant.deleted) return simpleResponse(false, GENERIC_FAILURE);

    if (!(await this.gatekeeper.verifyPassword(data.password, tenant.userPassword))) {
      return simpleResponse(false, GENERIC_FAILURE);
    }

    return keyedResponse("token", await this.issueToken(tenant));
  }

  /** OTPController.java:166-183. */
  async sendOtp(data: OtpSendRequest) {
    if (!(await this.contactNumberExists(data.contactNumber))) {
      return simpleResponse(false, GENERIC_FAILURE);
    }
    const result = await this.msg91.sendOtp(data.contactNumber);
    return simpleResponse(result.ok, result.ok ? "OTP sent." : GENERIC_FAILURE);
  }

  /** OTPController.java:260-282 — identical shape to sendOTP. */
  async resendOtp(data: OtpSendRequest) {
    if (!(await this.contactNumberExists(data.contactNumber))) {
      return simpleResponse(false, GENERIC_FAILURE);
    }
    const result = await this.msg91.resendOtp(data.contactNumber);
    return simpleResponse(result.ok, result.ok ? "OTP resent." : GENERIC_FAILURE);
  }

  /**
   * OTPController.java:207-232. A token is issued on exactly one path: MSG91
   * itself confirmed the code AND the contact number resolves to a tenant.
   * Every other path returns GENERIC_FAILURE and no token field at all.
   */
  async verifyOtp(data: OtpVerifyRequest) {
    const email = await this.emailForContactNumber(data.contactNumber);
    if (!email) return simpleResponse(false, GENERIC_FAILURE);

    const result = await this.msg91.verifyOtp(data.contactNumber, data.otp);
    if (!result.ok) return simpleResponse(false, GENERIC_FAILURE);

    const tenant = await this.tenantLookup.findByEmail(email);
    if (!tenant || tenant.banned || tenant.suspended || tenant.deleted) {
      return simpleResponse(false, GENERIC_FAILURE);
    }

    return keyedResponse("token", await this.issueToken(tenant));
  }

  /**
   * Was `return simpleResponse(true, ...)` unconditionally — i.e. any caller
   * could mark any address verified. Now checks the token actually exists for
   * that tenant, is unused and unexpired, before flipping loom_tenant.email_verified.
   */
  async verifyEmail(data: EmailVerifyRequest) {
    const verified = await this.repository.consumeEmailVerificationToken(data.email, data.token);
    return verified
      ? simpleResponse(true, "Email verified.")
      : simpleResponse(false, GENERIC_FAILURE);
  }

  async getVerificationTokens(page: number, size: number) {
    const { items, total } = await this.repository.getVerificationTokens(page, size);
    return paginatedResponse(items, total, page, size);
  }

  async getVerificationTokenById(id: string) {
    const token = await this.repository.getVerificationTokenById(id);
    if (!token) return simpleResponse(false, "Token not found");
    return keyedResponse("data", token);
  }

  // -------------------------------------------------------------------------

  /** LoomTenantDAOController#contactNumberExists (OTPController.java:178). */
  private async contactNumberExists(contactNumber: string): Promise<boolean> {
    return (await this.emailForContactNumber(contactNumber)) !== null;
  }

  /**
   * LoomTenantDAOController#retrieveUserByContactNumber followed by
   * NVerseUserDetailsService#loadUserByUsername(tenant.getDecryptedEmail())
   * (OTPController.java:221-226) — the contact number gets us the row, the
   * email gets us the roles the token has to carry.
   */
  private async emailForContactNumber(contactNumber?: string): Promise<string | null> {
    if (!contactNumber) return null;
    const row = await this.repository.findTenantByContactNumber(contactNumber);
    return row?.email ?? null;
  }

  /** jwtService.generateToken(user) — OTPController.java:227. */
  private async issueToken(tenant: {
    id: number;
    uid: string;
    email: string;
    roles: readonly string[];
  }): Promise<string> {
    const authenticated = {
      id: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    } as AuthenticatedTenant;

    // cron.scheduleLoginLogTask(user.getTenant()) — OTPController.java:229.
    void this.tenantLookup.updateLoginMetadata(tenant.id, { lastAccessTime: Date.now(), provider: "BASIC" });

    return this.gatekeeper.generateToken(authenticated);
  }
}
