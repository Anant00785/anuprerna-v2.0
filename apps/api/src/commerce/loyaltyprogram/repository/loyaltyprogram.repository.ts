import { Injectable, Inject } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import {
  CustomerLoyaltyProgramMembershipInfo,
  LoyaltyConfigAuditLogType,
  LoyaltyProgramConfigAuditLogData,
  LoyaltyProgramConfigData,
  LoyaltyProgramConfigInput,
  CustomerLoyaltyProgramOrder,
  toMoney,
} from '../types/loyaltyprogram.types.js';

type ConfigRow = typeof schema.loyaltyProgramConfig.$inferSelect;
type AuditRow = typeof schema.loyaltyProgramConfigAuditLog.$inferSelect;

/**
 * Every epoch/id column on loyalty_program_config and
 * loyalty_program_config_audit_log is declared `bigint(..., { mode: "number" })`
 * in database/schema/schema.ts, so a BigInt written into one is a driver-level
 * type error. The previous implementation wrote `BigInt(Date.now())` into
 * createdAt / updatedAt / startDate / endDate and `BigInt(customerId)` into
 * customer_id; all of them are plain numbers here.
 */
function toConfigData(r: ConfigRow): LoyaltyProgramConfigData {
  return {
    id: String(r.id),
    version: Number(r.version),
    customerId: r.customerId,
    minOrderValueCurrency: r.minOrderValueCurrency,
    minOrderValue: toMoney(r.minOrderValue, 'min_order_value'),
    minOrderValueInr: toMoney(r.minOrderValueInr, 'min_order_value_inr'),
    exchangeRate: toMoney(r.exchangeRate, 'exchange_rate'),
    tenure: r.tenure,
    discountPercentage: toMoney(r.discountPercentage, 'discount_percentage'),
    startDate: r.startDate,
    endDate: r.endDate,
    active: r.active,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toAuditLogData(r: AuditRow): LoyaltyProgramConfigAuditLogData {
  return {
    id: String(r.id),
    version: Number(r.version),
    customerId: r.customerId,
    minOrderValueCurrency: r.minOrderValueCurrency,
    minOrderValue: toMoney(r.minOrderValue, 'min_order_value'),
    minOrderValueInr: toMoney(r.minOrderValueInr, 'min_order_value_inr'),
    exchangeRate: toMoney(r.exchangeRate, 'exchange_rate'),
    tenure: r.tenure,
    discountPercentage: toMoney(r.discountPercentage, 'discount_percentage'),
    startDate: r.startDate,
    endDate: r.endDate,
    createdAt: r.createdAt,
    type: r.type as LoyaltyConfigAuditLogType,
  };
}

/**
 * Ports CustomerLoyaltyProgramOrder's @ConstructorResult column types. Money
 * columns arrive as strings from pg; `Number(v) || 0` would erase a legitimate
 * zero discount, so they go through the same strict parse as the config.
 */
function toLoyaltyProgramOrder(row: Record<string, unknown>): CustomerLoyaltyProgramOrder {
  return {
    orderId: String(row.orderId),
    productImage: row.productImage === null ? '' : String(row.productImage),
    productName: row.productName === null ? '' : String(row.productName),
    additionalProductCount: Number(row.additionalProductCount),
    totalOrderValue: toMoney(row.totalOrderValue as string | number, 'totalOrderValue'),
    loyaltyDiscountValue: toMoney(row.loyaltyDiscountValue as string | number, 'loyaltyDiscountValue'),
    currency: String(row.currency),
    status: String(row.status),
    latestDispatchedOn: row.latestDispatchedOn === null ? null : Number(row.latestDispatchedOn),
    createdAt: Number(row.createdAt),
    isCustomOrder: row.isCustomOrder === true,
  };
}

@Injectable()
export class LoyaltyprogramRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /** Ports CustomerDAOController.findByTenant — loyalty rows key on customer.id, not tenant id. */
  async getCustomerIdForTenant(tenantId: number): Promise<number | null> {
    const [row] = await this.db
      .select({ id: schema.customer.id })
      .from(schema.customer)
      .where(eq(schema.customer.tenantId, tenantId))
      .limit(1);
    return row ? Number(row.id) : null;
  }

  async getConfigById(id: bigint): Promise<LoyaltyProgramConfigData | null> {
    const [row] = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .where(eq(schema.loyaltyProgramConfig.id, id));
    return row ? toConfigData(row) : null;
  }

  async getConfigByCustomerId(customerId: number): Promise<LoyaltyProgramConfigData | null> {
    const [row] = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .where(eq(schema.loyaltyProgramConfig.customerId, customerId))
      .limit(1);
    return row ? toConfigData(row) : null;
  }

  /**
   * Ports findCustomerLoyaltyProgramInfo:
   *   SELECT ... FROM loyalty_program_config lpc WHERE lpc.customer_id = :customerId
   * The customerId is ALWAYS the caller's own resolved customer id — see
   * LoyaltyprogramService.getCustomerInfo.
   */
  async getMembershipInfo(customerId: number): Promise<CustomerLoyaltyProgramMembershipInfo | null> {
    const config = await this.getConfigByCustomerId(customerId);
    if (!config) return null;
    return {
      tenantId: config.customerId,
      active: config.active,
      programEnrollmentDateEpochMS: config.createdAt,
      currentCycleStartDateEpochMS: config.startDate,
      currentCycleEndDateEpochMS: config.endDate,
      tenureMonths: config.tenure,
      minimumOrderValueCurrency: config.minOrderValueCurrency,
      minimumOrderValue: config.minOrderValue,
      minimumOrderValueINR: config.minOrderValueInr,
      exchangeRate: config.exchangeRate,
      percentileDiscount: config.discountPercentage,
    };
  }

  /**
   * Ports retrieveLoyaltyProgramConfig: `ORDER BY id LIMIT :size OFFSET :offset`
   * (ascending, and genuinely paginated — the previous implementation ignored
   * page/size entirely and hardcoded DESC LIMIT 50).
   */
  async getConfigPage(page: number, size: number): Promise<LoyaltyProgramConfigData[]> {
    const rows = await this.db
      .select()
      .from(schema.loyaltyProgramConfig)
      .orderBy(asc(schema.loyaltyProgramConfig.id))
      .limit(size)
      .offset(page * size);
    return rows.map(toConfigData);
  }

  async getAuditLogById(id: bigint): Promise<LoyaltyProgramConfigAuditLogData | null> {
    const [row] = await this.db
      .select()
      .from(schema.loyaltyProgramConfigAuditLog)
      .where(eq(schema.loyaltyProgramConfigAuditLog.id, id));
    return row ? toAuditLogData(row) : null;
  }

  /** Ports retrieveLoyaltyProgramConfigAuditLog: `ORDER BY id LIMIT :size OFFSET :offset`. */
  async getAuditLogPage(page: number, size: number): Promise<LoyaltyProgramConfigAuditLogData[]> {
    const rows = await this.db
      .select()
      .from(schema.loyaltyProgramConfigAuditLog)
      .orderBy(asc(schema.loyaltyProgramConfigAuditLog.id))
      .limit(size)
      .offset(page * size);
    return rows.map(toAuditLogData);
  }

  async customerExists(customerId: number): Promise<boolean> {
    const [row] = await this.db
      .select({ id: schema.customer.id })
      .from(schema.customer)
      .where(eq(schema.customer.id, BigInt(customerId)))
      .limit(1);
    return row !== undefined;
  }

  /**
   * Ports addNewProgram: insert the config and its ONBOARDING audit row.
   *
   * Both writes run in ONE transaction: Java's addLog runs inside the DAO's
   * transactional boundary, and the previous implementation wrapped the audit
   * insert in a try/catch that logged a warning — a failed audit write left the
   * config live with no audit trail and still reported success.
   */
  async insertConfig(
    input: LoyaltyProgramConfigInput,
    startDate: number,
    endDate: number,
    now: number,
  ): Promise<LoyaltyProgramConfigData> {
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(schema.loyaltyProgramConfig)
        .values({
          customerId: input.customerId,
          minOrderValueCurrency: input.minOrderValueCurrency,
          minOrderValue: String(input.minOrderValue),
          minOrderValueInr: String(input.minOrderValueInr),
          exchangeRate: String(input.exchangeRate),
          tenure: input.tenure,
          discountPercentage: String(input.discountPercentage),
          startDate,
          endDate,
          active: true,
          createdAt: now,
        })
        .returning();

      await tx.insert(schema.loyaltyProgramConfigAuditLog).values({
        customerId: inserted.customerId,
        minOrderValueCurrency: inserted.minOrderValueCurrency,
        minOrderValue: inserted.minOrderValue,
        minOrderValueInr: inserted.minOrderValueInr,
        exchangeRate: inserted.exchangeRate,
        tenure: inserted.tenure,
        discountPercentage: inserted.discountPercentage,
        startDate: inserted.startDate,
        endDate: inserted.endDate,
        createdAt: now,
        updatedAt: null,
        type: LoyaltyConfigAuditLogType.ONBOARDING,
      });

      return toConfigData(inserted);
    });
  }

  /**
   * Ports updateExistingProgram.
   *
   * `active: false` deactivates the program and writes NO audit row (Java sends
   * the expiry notification instead); an active update rewrites the money terms,
   * recomputes the cycle window and writes one audit row of the requested type.
   * Nothing is ever hard-deleted — Loom soft-deactivates via `active`.
   *
   * The WHERE also pins `version`, so a concurrent writer makes this update
   * match zero rows rather than silently clobbering: award/adjust is not
   * replayable against a stale read.
   */
  async updateConfig(
    id: bigint,
    expectedVersion: number,
    input: LoyaltyProgramConfigInput,
    startDate: number,
    endDate: number,
    now: number,
  ): Promise<LoyaltyProgramConfigData | null> {
    return this.db.transaction(async (tx) => {
      const set = input.active
        ? {
            minOrderValueCurrency: input.minOrderValueCurrency,
            minOrderValue: String(input.minOrderValue),
            minOrderValueInr: String(input.minOrderValueInr),
            exchangeRate: String(input.exchangeRate),
            tenure: input.tenure,
            discountPercentage: String(input.discountPercentage),
            startDate,
            endDate,
            active: true,
            updatedAt: now,
            version: sql`${schema.loyaltyProgramConfig.version} + 1`,
          }
        : { active: false, updatedAt: now, version: sql`${schema.loyaltyProgramConfig.version} + 1` };

      const [updated] = await tx
        .update(schema.loyaltyProgramConfig)
        .set(set)
        .where(and(
          eq(schema.loyaltyProgramConfig.id, id),
          eq(schema.loyaltyProgramConfig.version, BigInt(expectedVersion)),
        ))
        .returning();

      if (!updated) return null;

      if (input.active) {
        await tx.insert(schema.loyaltyProgramConfigAuditLog).values({
          customerId: updated.customerId,
          minOrderValueCurrency: updated.minOrderValueCurrency,
          minOrderValue: updated.minOrderValue,
          minOrderValueInr: updated.minOrderValueInr,
          exchangeRate: updated.exchangeRate,
          tenure: updated.tenure,
          discountPercentage: updated.discountPercentage,
          startDate: updated.startDate,
          endDate: updated.endDate,
          createdAt: now,
          updatedAt: now,
          type: input.type,
        });
      }

      return toConfigData(updated);
    });
  }

  /**
   * Ports OrderNativeQuery.FIND_CUSTOMER_LOYALTY_PROGRAM_ORDERS_MAPPING verbatim.
   * `tenantId` is always the caller's own tenant — Loom resolves it from the
   * authorization token, never from a request parameter.
   */
  async findCustomerLoyaltyProgramOrders(tenantId: bigint): Promise<CustomerLoyaltyProgramOrder[]> {
    const result = await this.db.execute(sql`
      WITH valid_orders AS (
          SELECT DISTINCT o.id
          FROM orders o
          JOIN order_item oi ON o.id = oi.order_id
          WHERE o.loyalty_order = true
            AND o.deleted = false
            AND o.cancelled_at IS NULL
            AND oi.order_status NOT IN ('FAILED', 'CANCELLED', 'INITIATED')
            AND o.tenant_id = ${tenantId}
      ),
      first_item AS (
          SELECT DISTINCT ON (oi.order_id)
              oi.order_id,
              CASE
                  WHEN oi.product_group IN ('fabric','swatch')
                      THEN oi.customization::jsonb -> 'fabricProductPreview' -> 'product' ->> 'heroImage'
                  WHEN oi.product_group = 'finished'
                      THEN oi.customization::jsonb -> 'finishedProductPreview' -> 'product' ->> 'heroImage'
                  ELSE ''
              END AS product_image,
              CASE
                  WHEN oi.product_group IN ('fabric','swatch')
                      THEN oi.customization::jsonb -> 'fabricProductPreview' -> 'product' ->> 'name'
                  WHEN oi.product_group = 'finished'
                      THEN oi.customization::jsonb -> 'finishedProductPreview' -> 'product' ->> 'name'
                  ELSE ''
              END AS product_name
          FROM order_item oi
          JOIN valid_orders vo ON vo.id = oi.order_id
          WHERE oi.order_status NOT IN ('FAILED', 'CANCELLED', 'INITIATED')
          ORDER BY oi.order_id, oi.created_at
      ),
      item_counts AS (
          SELECT
              oi.order_id,
              COUNT(*) AS total_items,
              COUNT(CASE WHEN oi.tracking_url <> '' THEN 1 END) AS dispatched_count,
              COUNT(CASE WHEN oi.order_status = 'CANCELLED' THEN 1 END) AS cancelled_count,
              COUNT(CASE WHEN oi.order_status IN ('INITIATED','FAILED') THEN 1 END) AS failed_count,
              COUNT(CASE WHEN oi.order_status = 'PARTIALLY_DISPATCHED' THEN 1 END) AS partially_dispatched_count,
              COUNT(oi.id) AS all_items
          FROM order_item oi
          JOIN valid_orders vo ON vo.id = oi.order_id
          GROUP BY oi.order_id
      ),
      LatestOrderItem AS (
          SELECT
              oi.order_id,
              oi.dispatched_on,
              ROW_NUMBER() OVER (PARTITION BY oi.order_id ORDER BY oi.updated_at DESC) AS row_num
          FROM order_item oi
          JOIN valid_orders vo ON vo.id = oi.order_id
      )
      SELECT
          o.id AS "orderId",
          fi.product_image AS "productImage",
          fi.product_name AS "productName",
          GREATEST(ic.total_items - 1, 0) AS "additionalProductCount",
          o.total AS "totalOrderValue",
          o.loyalty_discount_amount AS "loyaltyDiscountValue",
          o.currency AS "currency",
          loi.dispatched_on AS "latestDispatchedOn",
          o.created_at AS "createdAt",
          false AS "isCustomOrder",
          CASE
              WHEN ic.cancelled_count > 0 THEN 'CANCELLED'
              WHEN ic.failed_count > 0 THEN 'FAILED'
              WHEN ic.partially_dispatched_count > 0 THEN 'PARTIALLY_DISPATCHED'
              WHEN ic.dispatched_count = 0 THEN 'PROCESSING'
              WHEN ic.dispatched_count = ic.all_items THEN 'DISPATCHED'
              ELSE 'IN_TRANSIT'
          END AS "status"
      FROM orders o
      JOIN valid_orders vo ON vo.id = o.id
      JOIN first_item fi ON fi.order_id = o.id
      JOIN item_counts ic ON ic.order_id = o.id
      LEFT JOIN LatestOrderItem loi ON loi.order_id = o.id AND loi.row_num = 1
      ORDER BY o.created_at DESC
    `);
    return result.rows.map(toLoyaltyProgramOrder);
  }

  /** Ports CustomOrderNativeQuery.FIND_CUSTOMER_LOYALTY_PROGRAM_CUSTOM_ORDERS_MAPPING verbatim. */
  async findCustomerLoyaltyProgramCustomOrders(tenantId: bigint): Promise<CustomerLoyaltyProgramOrder[]> {
    const result = await this.db.execute(sql`
      WITH valid_orders AS (
          SELECT DISTINCT co.id
          FROM custom_order co
          JOIN custom_order_item coi ON co.id = coi.custom_order_id
          WHERE co.loyalty_order = true
            AND co.deleted = false
            AND co.cancelled_at IS NULL
            AND coi.order_status NOT IN ('FAILED', 'INITIATED')
            AND co.tenant_id = ${tenantId}
      ),
      first_item AS (
          SELECT DISTINCT ON (coi.custom_order_id)
              coi.custom_order_id,
              CASE
                  WHEN coi.product_group IN ('custom')
                      THEN coi.customization::jsonb -> 'customProduct' ->> 'heroImage'
                  ELSE ''
              END AS product_image,
              CASE
                  WHEN coi.product_group IN ('custom')
                      THEN coi.customization::jsonb -> 'customProduct' ->> 'name'
                  ELSE ''
              END AS product_name
          FROM custom_order_item coi
          JOIN valid_orders vo ON vo.id = coi.custom_order_id
          WHERE coi.order_status NOT IN ('FAILED', 'INITIATED')
          ORDER BY coi.custom_order_id, coi.created_at
      ),
      item_counts AS (
          SELECT
              coi.custom_order_id,
              COUNT(*) AS total_items,
              COUNT(CASE WHEN coi.tracking_url <> '' THEN 1 END) AS dispatched_count,
              COUNT(CASE WHEN coi.order_status = 'PARTIALLY_DISPATCHED' THEN 1 END) AS partially_dispatched_count,
              COUNT(CASE WHEN coi.order_status = 'CANCELLED' THEN 1 END) AS cancelled_count,
              COUNT(CASE WHEN coi.order_status IN ('INITIATED','FAILED') THEN 1 END) AS failed_count,
              COUNT(coi.id) AS all_items
          FROM custom_order_item coi
          JOIN valid_orders vo ON vo.id = coi.custom_order_id
          GROUP BY coi.custom_order_id
      ),
      LatestOrderItem AS (
          SELECT
              coi.custom_order_id,
              coi.dispatched_on,
              ROW_NUMBER() OVER (PARTITION BY coi.custom_order_id ORDER BY coi.updated_at DESC) AS row_num
          FROM custom_order_item coi
          JOIN valid_orders vo ON vo.id = coi.custom_order_id
      )
      SELECT
          co.id AS "orderId",
          fi.product_image AS "productImage",
          fi.product_name AS "productName",
          GREATEST(ic.total_items - 1, 0) AS "additionalProductCount",
          co.adjusted_total AS "totalOrderValue",
          COALESCE(coa.adjustment_amount, 0) AS "loyaltyDiscountValue",
          co.currency AS "currency",
          loi.dispatched_on AS "latestDispatchedOn",
          co.created_at AS "createdAt",
          true as "isCustomOrder",
          CASE
              WHEN ic.cancelled_count > 0 THEN 'CANCELLED'
              WHEN ic.failed_count > 0 THEN 'FAILED'
              WHEN ic.partially_dispatched_count > 0 THEN 'PARTIALLY_DISPATCHED'
              WHEN ic.dispatched_count = 0 THEN 'PROCESSING'
              WHEN ic.dispatched_count = ic.all_items THEN 'DISPATCHED'
              ELSE 'IN_TRANSIT'
          END AS "status"
      FROM custom_order co
      JOIN valid_orders vo ON vo.id = co.id
      JOIN first_item fi ON fi.custom_order_id = co.id
      JOIN item_counts ic ON ic.custom_order_id = co.id
      LEFT JOIN LatestOrderItem loi ON loi.custom_order_id = co.id AND loi.row_num = 1
      LEFT JOIN custom_order_adjustment coa ON coa.custom_order_id = co.id AND coa.particular = 'Wholesale Discount'
      ORDER BY co.created_at DESC
    `);
    return result.rows.map(toLoyaltyProgramOrder);
  }
}
