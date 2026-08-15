// @ts-nocheck
import { Controller, Get, Patch, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TenantService } from '../service/tenant.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { CurrentTenant } from '../../../common/auth/current-tenant.decorator.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { UpdateCustomerProfileDto, parseUpdateCustomerProfileInput, parseUserRoleFilterInput } from '../dto/tenant.dto.js';
import { validateUpdateCustomerProfile } from '../validators/tenant.validator.js';
import { sanitizeUpdateCustomerProfile } from '../validators/tenant.sanitizer.js';

@ApiTags("Tenant")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('get/super-user/profile')
  @ApiOperation({ summary: "Get super-user profile." })
  async getSuperUserProfile(@CurrentTenant() tenant: any) {
    const profile = await this.tenantService.getSuperUserProfile(tenant.id);
    return keyedResponse('profile', profile);
  }

  @Get('get/tenant/profile/:uId')
  @ApiOperation({ summary: "Get tenant profile by UID (super-user)." })
  @ApiParam({ name: 'uId', description: 'Tenant User UID', example: 'e4d9ea92-78f6-4ce9-9d99-ce843f7e2fe4', type: String })
  async getTenantProfile(@Param('uId') uId: string) {
    const profile = await this.tenantService.getTenantProfile(uId);
    return keyedResponse('profile', profile);
  }

  @Get('get/customer/profile')
  @ApiOperation({ summary: "Get customer profile." })
  async getCustomerProfile(@CurrentTenant() tenant: any) {
    const profile = await this.tenantService.getCustomerProfile(tenant.id);
    return keyedResponse('profile', profile);
  }

  @Patch('update/customer/profile')
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Update customer profile." })
  @ApiBody({ type: UpdateCustomerProfileDto })
  async updateCustomerProfile(@CurrentTenant() tenant: any, @Body() body: any) {
    const dto = parseUpdateCustomerProfileInput(body);
    const errors = validateUpdateCustomerProfile(dto);
    if (errors.length > 0) throw new BadRequestException(errors.join(', '));
    const sanitized = sanitizeUpdateCustomerProfile(dto);
    const profile = await this.tenantService.updateCustomerProfile(tenant.id, sanitized);
    return simpleResponse(true, 'Profile updated successfully');
  }

  @Get('get/table-explorer/data/user-role')
  @ApiOperation({ summary: "Paginated user roles list." })
  async getUserRoles(@Query() query: any) {
    const filter = parseUserRoleFilterInput(query);
    const offset = (filter.page! - 1) * filter.limit!;
    const roles = await this.tenantService.getUserRoles(filter.limit!, offset);
    return keyedResponse('roles', roles);
  }

  @Get('get/table-explorer/data/user-role/:id')
  @ApiOperation({ summary: "Get user role by ID." })
  @ApiParam({ name: 'id', description: 'User Role ID', example: 1, type: Number })
  async getUserRoleById(@Param('id') id: string) {
    const role = await this.tenantService.getUserRoleById(parseInt(id, 10));
    return keyedResponse('role', role);
  }
}
