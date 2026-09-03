/**
 * apps/api/src/commerce/domain/customer-domain.service.ts
 *
 * Java original:
 *   loyaltyprogram/controller/LoyaltyProgramConfigController
 *     .getCustomerLoyaltyProgramMembershipInfo (CODE_CU)
 *   -> LoyaltyProgramConfigDAOController.getCustomerLoyaltyProgramMembershipInfo(tenant)
 *   -> LoyaltyProgramNativeQuery.FIND_CUSTOMER_LOYALTY_PROGRAM_INFO
 *
 * The Java handler resolves the customer FROM THE TOKEN and reads exactly one
 * row. The migrated controller was returning `SELECT * FROM customer LIMIT 50`
 * to any authenticated customer — 50 other people's customer rows, including
 * their WhatsApp numbers.
 */
import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import * as schema from "../../database/schema/schema.js";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";

/** Loom: loyaltyprogram/pojo/CustomerLoyaltyProgramMembershipInfo. */
export interface CustomerLoyaltyProgramMembershipInfo {
  tenantId: number | null;
  active: boolean | null;
  programEnrollmentDateEpochMS: number | null;
  currentCycleStartDateEpochMS: number | null;
  currentCycleEndDateEpochMS: number | null;
  tenureMonths: number | null;
  minimumOrderValueCurrency: string | null;
  minimumOrderValue: number | null;
  minimumOrderValueINR: number | null;
  exchangeRate: number | null;
  percentileDiscount: number | null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class CustomerDomainService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * `tenantId` comes from @CurrentTenant (the verified JWT) and from nowhere
   * else. Returns null when the caller is not enrolled — Loom's query yields
   * no row in that case.
   */
  async getLoyaltyMembershipInfo(tenantId: number): Promise<CustomerLoyaltyProgramMembershipInfo | null> {
    if (!Number.isFinite(tenantId) || tenantId <= 0) return null;

    const customers = await this.db
      .select({ id: schema.customer.id })
      .from(schema.customer)
      .where(eq(schema.customer.tenantId, tenantId))
      .limit(1);
    if (customers.length === 0) return null;

    const rows = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .where(eq(schema.loyaltyProgramConfig.customerId, Number(customers[0].id)))
      .limit(1);
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      // Loom's query aliases lpc.customer_id AS tenantId; preserved verbatim
      // so the wire shape does not change under the CMS.
      tenantId: num(r.customerId),
      active: r.active ?? null,
      programEnrollmentDateEpochMS: num(r.createdAt),
      currentCycleStartDateEpochMS: num(r.startDate),
      currentCycleEndDateEpochMS: num(r.endDate),
      tenureMonths: num(r.tenure),
      minimumOrderValueCurrency: r.minOrderValueCurrency ?? null,
      minimumOrderValue: num(r.minOrderValue),
      minimumOrderValueINR: num(r.minOrderValueInr),
      exchangeRate: num(r.exchangeRate),
      percentileDiscount: num(r.discountPercentage),
    };
  }

  /**
   * Loom: CustomerDAOController.manageWishlist(tenant, commaSeparatedSkuList) —
   *
   *     customer.setWishlist(commaSeparatedSkuList);
   *     return this.modifyEntity(customer);
   *
   * It is a whole-list REPLACE of the `customer.wishlist` text column with the
   * CSV as given, not an incremental add/remove: `customer.wishlist` is a
   * single `text NOT NULL DEFAULT ''` column, so the client sends the complete
   * desired list every time. Reproduced rather than reinterpreted.
   *
   * Returns false when the tenant has no `customer` row (Loom's
   * ActionCode.NO_ACTION branch) — the caller must report failure, not success.
   *
   * `tenantId` is @CurrentTenant's; there is no client-supplied customer id on
   * this path, so tenant A cannot touch tenant B's row.
   */
  async replaceWishlist(tenantId: number, commaSeparatedSkuList: string): Promise<boolean> {
    if (!Number.isFinite(tenantId) || tenantId <= 0) return false;

    const updated = await this.db
      .update(schema.customer)
      .set({ wishlist: commaSeparatedSkuList })
      .where(eq(schema.customer.tenantId, tenantId))
      .returning({ id: schema.customer.id });

    return updated.length > 0;
  }

  /** Reads the caller's own wishlist CSV back. Used by the wishlist spec. */
  async getWishlist(tenantId: number): Promise<string | null> {
    if (!Number.isFinite(tenantId) || tenantId <= 0) return null;
    const rows = await this.db
      .select({ wishlist: schema.customer.wishlist })
      .from(schema.customer)
      .where(eq(schema.customer.tenantId, tenantId))
      .limit(1);
    return rows[0]?.wishlist ?? null;
  }
}
