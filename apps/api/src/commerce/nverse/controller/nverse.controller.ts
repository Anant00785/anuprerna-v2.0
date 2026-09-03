import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Post, Get, HttpCode, Param, Query, Body, UseGuards } from '@nestjs/common';
import { NVerseService } from '../service/nverse.service.js';
import { Msg91OtpService } from '../service/msg91-otp.service.js';
import { 
  parseLoginRequest, parseOtpSendRequest, parseOtpVerifyRequest, parseEmailVerifyRequest, parsePaginationQuery 
} from '../dto/nverse.dto.js';
import { 
  validateLoginRequest, validateOtpSendRequest, validateOtpVerifyRequest, validateEmailVerifyRequest 
} from '../validators/nverse.validator.js';
import { sanitizeEmail, sanitizeContactNumber } from '../validators/nverse.sanitizer.js';
import { simpleResponse } from '../../../common/response/rain-response.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { OtpRateLimitGuard } from '../otp-rate-limit.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';

/**
 * NVerse auth endpoints — port of com.bloomscorp.loom.nverse.controller.OTPController.
 *
 * login / otp/send / otp/resend / otp/verify / email/verify carry no
 * @RequireGate BECAUSE THEY ARE THE ENDPOINTS THAT MINT THE TOKEN — the same
 * shape as AuthController's public POST /auth/authenticate, and as Loom's
 * postEntityUnauthorized(...) / plain @PostMapping (OTPController.java:166, 207,
 * 265). They are genuinely public; nverse.controller.gates.spec.ts pins that.
 *
 * NOT PORTED: com.bloomscorp.loom.nverse.controller.FakeOTPController. It
 * returns the OTP in the response body and mints real login JWTs from it.
 * Nothing resembling it belongs here.
 *
 * RATE LIMITING: otp/send and otp/resend cost money per call once
 * OUTBOUND_SMS_ENABLED is true, so both sit behind OtpRateLimitGuard —
 * 3/hour per contact number and 10/hour per IP. Read the ceiling documented in
 * otp-rate-limit.guard.ts before relying on it: the counters are per process,
 * so a multi-instance deployment multiplies the quota. otp/verify is not
 * limited here because MSG91 rate-limits verification server-side.
 */
@ApiBearerAuth()
@ApiTags("Authentication")
@Controller('nverse')
@UseGuards(RolesGuard)
export class NVerseController {
  constructor(
    private readonly nverseService: NVerseService,
    private readonly msg91: Msg91OtpService,
  ) {}

  @Post('login')
  @HttpCode(200) // Loom's OTPController answers 200, not Nest's default 201.
  async login(@Body() body: any) {
    const data = parseLoginRequest(body);
    data.email = sanitizeEmail(data.email);
    const error = validateLoginRequest(data);
    if (error) return simpleResponse(false, error);
    return this.nverseService.login(data);
  }

  @Post('otp/send')
  @UseGuards(OtpRateLimitGuard)
  @HttpCode(200) // Loom's OTPController answers 200, not Nest's default 201.
  async sendOtp(@Body() body: any) {
    const data = parseOtpSendRequest(body);
    data.contactNumber = sanitizeContactNumber(data.contactNumber) || '';
    const error = validateOtpSendRequest(data);
    if (error) return simpleResponse(false, error);
    return this.nverseService.sendOtp(data);
  }

  /** OTPController.java:265 resendOTP — same request shape as sendOTP. */
  @Post('otp/resend')
  @UseGuards(OtpRateLimitGuard)
  @HttpCode(200) // Loom's OTPController answers 200, not Nest's default 201.
  async resendOtp(@Body() body: any) {
    const data = parseOtpSendRequest(body);
    data.contactNumber = sanitizeContactNumber(data.contactNumber) || '';
    const error = validateOtpSendRequest(data);
    if (error) return simpleResponse(false, error);
    return this.nverseService.resendOtp(data);
  }

  @Post('otp/verify')
  @HttpCode(200) // Loom's OTPController answers 200, not Nest's default 201.
  async verifyOtp(@Body() body: any) {
    const data = parseOtpVerifyRequest(body);
    data.contactNumber = sanitizeContactNumber(data.contactNumber) || '';
    const error = validateOtpVerifyRequest(data, this.msg91.otpLength);
    if (error) return simpleResponse(false, error);
    return this.nverseService.verifyOtp(data);
  }

  @Post('email/verify')
  @HttpCode(200) // Loom's OTPController answers 200, not Nest's default 201.
  async verifyEmail(@Body() body: any) {
    const data = parseEmailVerifyRequest(body);
    data.email = sanitizeEmail(data.email) || '';
    const error = validateEmailVerifyRequest(data);
    if (error) return simpleResponse(false, error);
    return this.nverseService.verifyEmail(data);
  }

  @Get('/get/table-explorer/data/verification-token')
  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  async getVerificationTokens(@Query() query: any) {
    const { page, size } = parsePaginationQuery(query);
    return this.nverseService.getVerificationTokens(page, size);
  }

  @Get('/get/table-explorer/data/verification-token/:id')
  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  async getVerificationTokenById(@Param('id') id: string) {
    return this.nverseService.getVerificationTokenById(id);
  }
}
