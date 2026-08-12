// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import { eq } from 'drizzle-orm';
import * as schema from '../../../database/schema/schema.js';

@Injectable()
export class TenantRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async getSuperUserProfile(tenantId: string) {
    const result = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.id, BigInt(tenantId))).limit(1);
    return result[0];
  }

  async getTenantProfile(uId: string) {
    const result = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.loomId, uId)).limit(1);
    return result[0];
  }

  async getCustomerProfile(tenantId: string) {
    const result = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.id, BigInt(tenantId))).limit(1);
    return result[0];
  }

  async updateCustomerProfile(tenantId: string, data: any) {
    await this.db.update(schema.loomTenant).set(data).where(eq(schema.loomTenant.id, BigInt(tenantId)));
    return this.getCustomerProfile(tenantId);
  }

  async getUserRoles(limit: number, offset: number) {
    return this.db.select().from(schema.userRole).limit(limit).offset(offset);
  }

  async getUserRoleById(id: string) {
    const result = await this.db.select().from(schema.userRole).where(eq(schema.userRole.id, BigInt(id))).limit(1);
    return result[0];
  }
}
// @ts-nocheck
// @ts-nocheck
