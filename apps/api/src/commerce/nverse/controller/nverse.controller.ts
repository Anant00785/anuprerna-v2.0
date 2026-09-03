import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Post, Get, Param, Query, Body, UseGuards } from '@nestjs/common';
import { NVerseService } from '../service/nverse.service.js';
import { 
  parseLoginRequest, parseOtpSendRequest, parseOtpVerifyRequest, parseEmailVerifyRequest, parsePaginationQuery 
} from '../dto/nverse.dto.js';
import { 
  validateLoginRequest, validateOtpSendRequest, validateOtpVerifyRequest, validateEmailVerifyRequest 
} from '../validators/nverse.validator.js';
import { sanitizeEmail, sanitizeContactNumber } from '../validators/nverse.sanitizer.js';
import { simpleResponse } from '../../../common/response/rain-response.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';

@ApiBearerAuth()
@ApiTags("Authentication")
@Controller('nverse')
export class NVerseController {
  constructor(private readonly nverseService: NVerseService) {}

  @Post('login')
  async login(@Body() body: any) {
    const data = parseLoginRequest(body);
    data.email = sanitizeEmail(data.email);
    const error = validateLoginRequest(data);
    if (error) return simpleResponse(false, error);
    return this.nverseService.login(data);
  }

  @Post('otp/send')
  async sendOtp(@Body() body: any) {
    const data = parseOtpSendRequest(body);
    data.contactNumber = sanitizeContactNumber(data.contactNumber) || '';
    const error = validateOtpSendRequest(data);
    if (error) return simpleResponse(false, error);
    return this.nverseService.sendOtp(data);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: any) {
    const data = parseOtpVerifyRequest(body);
    data.contactNumber = sanitizeContactNumber(data.contactNumber) || '';
    const error = validateOtpVerifyRequest(data);
    if (error) return simpleResponse(false, error);
    return this.nverseService.verifyOtp(data);
  }

  @Post('email/verify')
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
