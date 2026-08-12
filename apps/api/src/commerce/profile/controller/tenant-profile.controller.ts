// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Patch, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ProfileService } from '../service/profile.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { CurrentTenant } from '../../../common/auth/current-tenant.decorator.js';
import {
  parseUpdateCustomerProfileInput,
} from '../dto/profile.dto.js';
import {
  sanitizeUpdateCustomerProfileInput,
} from '../validators/profile.sanitizer.js';
import {
  validateUpdateCustomerProfile,
} from '../validators/profile.validator.js';

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class TenantProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('get/super-user/profile')
  @RequireGate(GateCode.CODE_SU)
  async getSuperUserProfiles() {
    return this.profileService.getSuperUserProfiles();
  }

  @Get('get/tenant/profile/:uId')
  @RequireGate(GateCode.CODE_SU)
  async getTenantProfile(@Param('uId') uId: string) {
    return this.profileService.getTenantProfile(Number(uId));
  }

  @Get('get/customer/profile')
  @RequireGate(GateCode.CODE_CU)
  async getCustomerProfile(@CurrentTenant() tenant: any) {
    return this.profileService.getTenantProfile(tenant.id);
  }

  @Patch('update/customer/profile')
  @RequireGate(GateCode.CODE_CU)
  async updateCustomerProfile(@CurrentTenant() tenant: any, @Body() body: any) {
    const sanitized = sanitizeUpdateCustomerProfileInput(body);
    const input = parseUpdateCustomerProfileInput(sanitized);
    const error = validateUpdateCustomerProfile(input);
    if (error) throw new BadRequestException(error);
    return this.profileService.updateCustomerProfile(tenant.id, input);
  }
}
