/**
 * apps/api/src/commerce/transmission/tracking.service.ts
 *
 * Ownership scoping for the /track/* routes.
 *
 * These routes have NO Java original in loom — they are new. As written they
 * were CODE_SU and keyed off a sequential order id, so any caller who reached
 * them could enumerate order ids and read carrier, AWB, destination hub and
 * delivery dates for every shipment in the system. They are meant to serve
 * customers tracking their OWN orders, so they are now CODE_CU and every read
 * is filtered through the caller's tenant id here.
 *
 * There is deliberately no guest path: tracking a shipment by a sequential
 * order id without authentication is enumeration by construction. A guest flow
 * needs an unguessable per-shipment token, which does not exist in the schema
 * today — so this fails closed rather than shipping the enumerable version.
 * Recorded in docs/KNOWN-GAPS.md.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";
import * as schema from "../../database/schema/schema.js";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";

@Injectable()
export class TrackingOwnershipService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** Does this standard or custom order belong to the calling tenant? */
  async tenantOwnsOrder(orderId: number, tenantId: number): Promise<boolean> {
    return (await this.ownedOrderIds([orderId], tenantId)).size > 0;
  }

  /** Does the tenant own at least one of the orders on a shipment/batch? */
  async tenantOwnsAnyOrder(orderIds: readonly number[], tenantId: number): Promise<boolean> {
    return (await this.ownedOrderIds(orderIds, tenantId)).size > 0;
  }

  /**
   * The subset of `orderIds` the tenant actually owns. A shipment can carry
   * several customers' orders, so a batch view must be narrowed to the
   * caller's own ids rather than shown whole.
   */
  async ownedOrderIds(orderIds: readonly number[], tenantId: number): Promise<Set<number>> {
    const ids = [...new Set(orderIds)].filter((n) => Number.isSafeInteger(n) && n > 0);
    if (ids.length === 0) return new Set();
    if (!Number.isFinite(tenantId) || tenantId <= 0) return new Set();

    const bigIds = ids.map((n) => BigInt(n));
    const [standard, custom] = await Promise.all([
      this.db
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(and(inArray(schema.orders.id, bigIds), eq(schema.orders.tenantId, tenantId))),
      this.db
        .select({ id: schema.customOrder.id })
        .from(schema.customOrder)
        .where(and(inArray(schema.customOrder.id, bigIds), eq(schema.customOrder.tenantId, tenantId))),
    ]);

    return new Set([...standard, ...custom].map((r) => Number(r.id)));
  }
}
