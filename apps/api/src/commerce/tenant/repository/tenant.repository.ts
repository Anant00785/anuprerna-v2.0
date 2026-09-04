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

  /**
   * The buyer's identity lives on `loom_tenant`, but their shopping
   * preferences — the wishlist CSV among them — live on the one-row-per-tenant
   * `customer` table. This used to read `loom_tenant` alone, so the wishlist a
   * shopper had just saved (PUT /manage/wishlist writes `customer.wishlist`)
   * was never returned and the wishlist page always rendered "0 Items".
   *
   * The customer row is optional: a tenant that has never set a preference has
   * none, and the profile is still valid without it.
   */
  async getCustomerProfile(tenantId: unknown) {
    const id = this.requireTenantId(tenantId);
    const result = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.id, id)).limit(1);
    const tenant = result[0] ?? null;
    if (!tenant) return null;

    const customerRows = await this.db
      .select()
      .from(schema.customer)
      .where(eq(schema.customer.tenantId, Number(id)))
      .limit(1);
    const customer = customerRows[0];
    if (!customer) return tenant;

    return { ...tenant, wishlist: customer.wishlist ?? '', defaultCurrency: customer.defaultCurrency ?? '' };
  }

  async updateCustomerProfile(tenantId: unknown, data: any) {
    const id = this.requireTenantId(tenantId);
    // `loom_tenant` has NO `name` column — the display name lives in `user_name`.
    // This used to set `updateData.name`, which Drizzle rejects as an unknown
    // column, so a profile edit that touched the name failed outright. Every
    // spelling the callers use (name / userName / firstName+lastName) now
    // resolves to the one real column.
    const updateData: any = {};
    const fullName =
      [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
      (data.name !== undefined ? String(data.name).trim() : "") ||
      (data.userName !== undefined ? String(data.userName).trim() : "");
    if (fullName) updateData.userName = fullName;
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

  /**
   * The buyer's display currency. `customer` is the one-row-per-tenant
   * preferences table (`unique_customer` on tenant_id), so this is an upsert:
   * a tenant that has never had a customer row still gets their choice stored.
   * Currency is stored upper-case, matching the existing `default_currency`
   * values ("INR").
   */
  async setSelectedCurrency(tenantId: unknown, currency: string) {
    const id = this.requireTenantId(tenantId);
    await this.db
      .insert(schema.customer)
      .values({ tenantId: Number(id), defaultCurrency: currency })
      .onConflictDoUpdate({ target: schema.customer.tenantId, set: { defaultCurrency: currency } });
    return currency;
  }

  async getUserRoles(limit: number, offset: number) {
    return this.db.select().from(schema.userRole).limit(limit).offset(offset);
  }

  async getUserRoleById(id: any) {
    const result = await this.db.select().from(schema.userRole).where(eq(schema.userRole.id, BigInt(id))).limit(1);
    return result[0] ?? null;
  }
}
