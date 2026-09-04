import { Inject, Injectable, Logger } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";
import * as schema from "../../database/schema/schema.js";

/**
 * Loom LoomUtility.isDateWithInRange — compares at DAY granularity
 * (timestamps truncated to their calendar date before comparison).
 */
function isDateWithinRange(startMs: number, endMs: number, checkMs: number): boolean {
  const day = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return day(checkMs) >= day(startMs) && day(checkMs) <= day(endMs);
}

@Injectable()
export class DiscountService extends CommerceDataService {
  private readonly logger = new Logger(DiscountService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly database: Database) {
    super(database, "discount");
  }

  override async getAll() {
    try {
      const rows = await (this.database as any).select().from(schema.discount).limit(50);
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          name: r.couponCode,
          couponCode: r.couponCode,
          discountPercentage: r.discountPercentage,
          discountType: r.discountType,
          discountMethod: r.discountMethod,
          minimumOrderValue: r.minimumOrderValue,
          location: r.location,
          active: Boolean(r.active),
        }));
      }
    } catch (err) {
      this.logger.warn(`discount table read failed, falling back to the generic commerce_discount table: ${err}`);
    }

    // Previously this returned a fabricated "WELCOME15" 15%-off coupon whenever
    // the discount table was empty or unreadable — an invented discount served
    // from a live route as if it were configuration. An empty catalogue is an
    // empty catalogue.
    return (await super.getAll()) ?? [];
  }

  /**
   * Loom DiscountDAOController.applyVoucher, ported 1:1. Validates the coupon
   * against the discount table and the caller's order history — never a
   * fabricated approval. Action codes match VoucherApplicationEnhancedResponse:
   * 0 applied, 1 invalid code, 2 minimum order value not satisfied,
   * 3 not applicable (inactive), 4 expired, 5 already used (SINGLE usage).
   */
  async applyVoucher(tenantId: number, couponCode: string, cartValue: number): Promise<number> {
    return (await this.evaluateVoucher(tenantId, couponCode, cartValue)).code;
  }

  /**
   * The same evaluation, keeping the row that justified the verdict.
   *
   * `/apply/coupon/{code}` has to tell the storefront HOW MUCH the coupon is
   * worth, and the only defensible source for that is the row the checks
   * passed against — never a default. `discount` is non-null if and only if a
   * row with this coupon code exists; on code 1 there is nothing to return.
   */
  async evaluateVoucher(
    tenantId: number,
    couponCode: string,
    cartValue: number,
  ): Promise<{ code: number; discount: typeof schema.discount.$inferSelect | null }> {
    const rows = await this.database
      .select()
      .from(schema.discount)
      .where(sql`lower(${schema.discount.couponCode}) = lower(${couponCode})`)
      .limit(1);
    const discount = rows[0];

    if (!discount) return { code: 1, discount: null };
    if (discount.minimumOrderValue > cartValue) return { code: 2, discount };
    if (!discount.active) return { code: 3, discount };
    if (!isDateWithinRange(discount.startDate, discount.endDate, Date.now())) return { code: 4, discount };

    if (discount.usageType === "SINGLE") {
      const used = await this.database
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.tenantId, tenantId),
            eq(schema.orders.deleted, false),
            sql`lower(${schema.orders.couponCode}) = lower(${couponCode})`,
          ),
        )
        .limit(1);
      if (used.length > 0) return { code: 5, discount };
    }

    return { code: 0, discount };
  }
}
