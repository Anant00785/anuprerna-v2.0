import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import { eq } from 'drizzle-orm';
import * as schema from '../../../database/schema/schema.js';

@Injectable()
export class TenantRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  /**
   * A tenant id must be a positive integer. This used to fall back to
   * TENANT 1 on a missing or 0 id, so a caller with a bad id silently
   * read/wrote another tenant's data. Reject instead.
   */
  private requireTenantId(tenantId: unknown): bigint {
    const n = Number(tenantId);
    if (!Number.isInteger(n) || n <= 0) {
      throw new BadRequestException('A valid tenant id is required.');
    }
    return BigInt(n);
  }

  async getSuperUserProfile(tenantId: unknown) {
    const id = this.requireTenantId(tenantId);
    const result = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.id, id)).limit(1);
    return result[0] ?? null;
  }

  async getTenantProfile(uId: string) {
    const result = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.loomId, uId)).limit(1);
    return result[0] ?? null;
  }

  async getCustomerProfile(tenantId: unknown) {
    const id = this.requireTenantId(tenantId);
    const result = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.id, id)).limit(1);
    return result[0] ?? null;
  }

  async updateCustomerProfile(tenantId: unknown, data: any) {
    const id = this.requireTenantId(tenantId);
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.userName !== undefined) {
      updateData.userName = data.userName;
      if (!updateData.name) updateData.name = data.userName;
    }
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const combined = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
      if (combined) {
        updateData.name = combined;
        updateData.userName = combined;
      }
    }
    if (data.contactNumber !== undefined) updateData.contactNumber = data.contactNumber;
    if (data.phone !== undefined) updateData.contactNumber = data.phone;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dob !== undefined) {
      if (typeof data.dob === "number") {
        updateData.dob = data.dob;
      } else if (typeof data.dob === "string") {
        const parsed = Date.parse(data.dob);
        updateData.dob = isNaN(parsed) ? 0 : parsed;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.update(schema.loomTenant).set(updateData).where(eq(schema.loomTenant.id, id));
    }
    return this.getCustomerProfile(tenantId);
  }

  async getUserRoles(limit: number, offset: number) {
    return this.db.select().from(schema.userRole).limit(limit).offset(offset);
  }

  async getUserRoleById(id: any) {
    const result = await this.db.select().from(schema.userRole).where(eq(schema.userRole.id, BigInt(id))).limit(1);
    return result[0] ?? null;
  }
}
