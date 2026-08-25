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
  async getSuperUserProfiles() {
    return this.profileService.getSuperUserProfiles();
  }

  @Get('get/tenant/profile/:uId')
  async getTenantProfile(@Param('uId') uId: string) {
    return this.profileService.getTenantProfile(Number(uId));
  }

  @Get('get/customer/profile')
  async getCustomerProfile(@CurrentTenant() tenant: any) {
    const tenantId = Number(tenant?.tenantId || tenant?.id || 1);
    return this.profileService.getTenantProfile(tenantId);
  }

  @Post('update/customer/profile')
  @Patch('update/customer/profile')
  @RequireGate(GateCode.CODE_CU)
  async updateCustomerProfile(@CurrentTenant() tenant: any, @Body() body: any) {
    const tenantId = Number(tenant?.tenantId || tenant?.id || 1);
    const result = await this.profileService.updateCustomerProfile(tenantId, body);
    return {
      success: true,
      message: 'Profile updated successfully',
      profile: result?.data || result,
      entity: result?.data || result,
      data: result?.data || result,
    };
  }
}
