// @ts-nocheck
import { Controller, Get, Patch, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { TenantService } from '../service/tenant.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { CurrentTenant } from '../../../common/auth/current-tenant.decorator.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { parseUpdateCustomerProfileInput, parseUserRoleFilterInput } from '../dto/tenant.dto.js';
import { validateUpdateCustomerProfile } from '../validators/tenant.validator.js';
import { sanitizeUpdateCustomerProfile } from '../validators/tenant.sanitizer.js';

@Controller()
@UseGuards(RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('get/super-user/profile')
  @RequireGate(GateCode.CODE_SU)
  async getSuperUserProfile(@CurrentTenant() tenant: any) {
    const profile = await this.tenantService.getSuperUserProfile(tenant.id);
    return keyedResponse('profile', profile);
  }

  @Get('get/tenant/profile/:uId')
  @RequireGate(GateCode.CODE_SU)
  async getTenantProfile(@Param('uId') uId: string) {
    const profile = await this.tenantService.getTenantProfile(uId);
    return keyedResponse('profile', profile);
  }

  @Get('get/customer/profile')
  @RequireGate(GateCode.CODE_CU)
  async getCustomerProfile(@CurrentTenant() tenant: any) {
    const profile = await this.tenantService.getCustomerProfile(tenant.id);
    return keyedResponse('profile', profile);
  }

  @Patch('update/customer/profile')
  @RequireGate(GateCode.CODE_CU)
  async updateCustomerProfile(@CurrentTenant() tenant: any, @Body() body: any) {
    const dto = parseUpdateCustomerProfileInput(body);
    const errors = validateUpdateCustomerProfile(dto);
    if (errors.length > 0) throw new BadRequestException(errors.join(', '));
    const sanitized = sanitizeUpdateCustomerProfile(dto);
    const profile = await this.tenantService.updateCustomerProfile(tenant.id, sanitized);
    return simpleResponse(true, 'Profile updated successfully');
  }

  @Get('get/table-explorer/data/user-role')
  @RequireGate(GateCode.CODE_SU)
  async getUserRoles(@Query() query: any) {
    const filter = parseUserRoleFilterInput(query);
    const offset = (filter.page! - 1) * filter.limit!;
    const roles = await this.tenantService.getUserRoles(filter.limit!, offset);
    return keyedResponse('roles', roles);
  }

  @Get('get/table-explorer/data/user-role/:id')
  @RequireGate(GateCode.CODE_SU)
  async getUserRoleById(@Param('id') id: string) {
    const role = await this.tenantService.getUserRoleById(id);
    return keyedResponse('role', role);
  }
}
// @ts-nocheck
