import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";
// @ts-nocheck
import { Controller, Post, Body, HttpCode, Inject } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { simpleResponse } from "../../common/response/rain-response.js";
import { SendOtpDto, VerifyOtpDto } from "../../auth/dto/auth.dto.js";

@ApiTags("Authentication")
@Controller()
export class AuthMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Post("/fake/otp/send")
  @HttpCode(200)
  @ApiBody({ type: SendOtpDto })
  @ApiOperation({ summary: "Testing/Mock OTP dispatch (Development mode - does not consume SMS credits)" })
  async post_fake_otp_send(@Body() body: SendOtpDto) {
    return simpleResponse(true, "Fake OTP dispatched successfully: 1234");
  }

  @Post("/fake/otp/verify")
  @HttpCode(200)
  @ApiBody({ type: VerifyOtpDto })
  @ApiOperation({ summary: "Testing/Mock OTP verification (Development mode)" })
  async post_fake_otp_verify(@Body() body: VerifyOtpDto) {
    return simpleResponse(true, "Fake OTP verified successfully");
  }

  @Post("/fake/otp/resend")
  @HttpCode(200)
  @ApiBody({ type: SendOtpDto })
  @ApiOperation({ summary: "Testing/Mock OTP resend (Development mode)" })
  async post_fake_otp_resend(@Body() body: SendOtpDto) {
    return simpleResponse(true, "Fake OTP resent successfully: 1234");
  }
}
