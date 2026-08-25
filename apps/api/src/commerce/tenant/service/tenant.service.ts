// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../repository/tenant.repository.js';
import { mapTenantProfile, mapUserRole } from '../mapper/tenant.mapper.js';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepo: TenantRepository) {}

  async getSuperUserProfile(tenantId: string | number) {
    const profile = await this.tenantRepo.getSuperUserProfile(tenantId);
    return profile ? mapTenantProfile(profile) : null;
  }

  async getTenantProfile(uId: string) {
    const profile = await this.tenantRepo.getTenantProfile(uId);
    return profile ? mapTenantProfile(profile) : null;
  }

  async getCustomerProfile(tenantId: string | number) {
    const profile = await this.tenantRepo.getCustomerProfile(tenantId);
    return profile ? mapTenantProfile(profile) : null;
  }

  async updateCustomerProfile(tenantId: string | number, data: any) {
    const profile = await this.tenantRepo.updateCustomerProfile(tenantId, data);
    return profile ? mapTenantProfile(profile) : null;
  }

  async getUserRoles(limit: number, offset: number) {
    const roles = await this.tenantRepo.getUserRoles(limit, offset);
    return roles.map(mapUserRole);
  }

  async getUserRoleById(id: string | number) {
    const role = await this.tenantRepo.getUserRoleById(id);
    return role ? mapUserRole(role) : null;
  }
}
// @ts-nocheck
