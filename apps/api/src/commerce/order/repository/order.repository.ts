import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

@Injectable()
export class OrderRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) public readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: bigint) {
    // Loom: OrdersJpaRepository.findByIdAndDeletedFalse — soft-deleted orders are
    // invisible to every read path.
    const rows = await this.db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.id, id), eq(schema.orders.deleted, false)));
    if (!rows[0]) return null;
    const items = await this.db.select().from(schema.orderItem).where(eq(schema.orderItem.orderId, Number(id)));
    return {
      ...rows[0],
      orderItems: items || [],
      orderItemList: items || [],
    };
  }

  async findByCustomerIdPaginated(customerId: bigint | number, page: number, size: number) {
    // No `|| 1` fallback: an unusable tenant id must return nothing rather than
    // silently serving tenant 1's orders.
    const tid = Number(customerId);
    if (!Number.isFinite(tid) || tid <= 0) return [];
    return this.db.select()
      .from(schema.orders)
      .where(and(eq(schema.orders.tenantId, tid), eq(schema.orders.deleted, false)))
      .limit(size)
      .offset(page * size)
      .orderBy(desc(schema.orders.id));
  }

  async findAllPaginated(page: number, size: number) {
    return this.db.select()
      .from(schema.orders)
      .where(eq(schema.orders.deleted, false))
      .limit(size)
      .offset(page * size)
      .orderBy(desc(schema.orders.id));
  }
  
  // ─── Order previews with computed status ───────────────────────────────────
  // Direct ports of Loom's two named native queries:
  //   order/nativequery/OrderNativeQuery.FIND_CUSTOMER_ORDER_LIST_WITH_STATUS_MAPPING
  //     ("findCustomerOrderListWithStatusMapping")
  //   order/orm/CustomOrder.java @NamedNativeQuery
  //     ("findCustomerCustomOrderListWithStatusMapping")
  // Both project OrderPreviewWithStatus. The status CASE ladder and the
  // 21600000 ms (6h) IN_STOCK grace window are Loom's, reproduced verbatim.
  //
  // DIVERGENCE (deliberate): Loom writes `LIMIT :pageSize OFFSET :pageNo`, i.e.
  // it treats the page NUMBER as a row offset. Every known caller passes
  // pageNumber=0 so the bug is unobservable today; we use page * size so that
  // page 2 actually means page 2.

  async findOrderPreviewsByTenant(tenantId: number, page: number, size: number) {
    const rows = await this.db.execute(sql`
      WITH latest_order_item AS (
        SELECT oi.order_id, oi.dispatched_on, oi.tracking_url, oi.estimated_delivery_to,
               ROW_NUMBER() OVER (PARTITION BY oi.order_id ORDER BY oi.updated_at DESC) AS row_num
        FROM order_item oi
      )
      SELECT o.id                        AS "orderId",
             o.created_at                AS "createdAt",
             loi.dispatched_on           AS "dispatchedOn",
             loi.tracking_url            AS "trackingUrl",
             loi.estimated_delivery_to   AS "estimatedDeliveryDate",
             COUNT(oi.id)                AS "totalItemCount",
             COUNT(CASE
               WHEN oi.order_type = 'IN_STOCK' AND (EXTRACT(EPOCH FROM NOW()) * 1000 - oi.created_at) > 21600000 THEN 1
               WHEN oi.order_type <> 'IN_STOCK' AND w.id IS NOT NULL AND (w.status = 'INITIATED' OR w.status = 'COMPLETED') THEN 1
             END)                        AS "processingItemCount",
             COUNT(CASE
               WHEN oi.order_type = 'IN_STOCK' AND (EXTRACT(EPOCH FROM NOW()) * 1000 - oi.created_at) > 21600000 THEN 1
               WHEN oi.order_type <> 'IN_STOCK' AND w.id IS NOT NULL AND w.status = 'COMPLETED' THEN 1
             END)                        AS "readyItemCount",
             COUNT(CASE WHEN oi.tracking_url <> '' THEN 1 END)            AS "dispatchedItemCount",
             COUNT(CASE WHEN oi.order_status = 'CANCELLED' THEN 1 END)    AS "cancelledItemCount",
             CASE
               WHEN COUNT(CASE WHEN oi.order_status = 'CANCELLED' THEN 1 END) > 0 THEN 'CANCELLED'
               WHEN COUNT(CASE WHEN oi.order_status = 'INITIATED' OR oi.order_status = 'FAILED' THEN 1 END) > 0 THEN 'FAILED'
               WHEN COUNT(CASE WHEN oi.order_status = 'PARTIALLY_DISPATCHED' THEN 1 END) > 0 THEN 'PARTIALLY_DISPATCHED'
               WHEN COUNT(CASE WHEN oi.tracking_url = '' THEN 1 END) = COUNT(oi.id) THEN 'PROCESSING'
               WHEN COUNT(CASE WHEN oi.tracking_url <> '' THEN 1 END) = COUNT(oi.id) THEN 'DISPATCHED'
               ELSE 'IN_TRANSIT'
             END                         AS "status",
             'ORDER'                     AS "orderType",
             o.loyalty_order             AS "loyaltyOrder"
      FROM orders o
        JOIN loom_tenant lt ON lt.id = o.tenant_id
        JOIN order_item oi  ON o.id = oi.order_id
        LEFT JOIN workflow w ON w.order_item_id = oi.id
        LEFT JOIN latest_order_item loi ON o.id = loi.order_id AND loi.row_num = 1
      WHERE o.tenant_id = ${tenantId}
      GROUP BY o.id, o.created_at, o.loyalty_order, loi.dispatched_on, loi.tracking_url, loi.estimated_delivery_to
      ORDER BY o.created_at DESC
      LIMIT ${size} OFFSET ${page * size}
    `);
    return normalisePreviews(rows);
  }

  async findCustomOrderPreviewsByTenant(tenantId: number, page: number, size: number) {
    const rows = await this.db.execute(sql`
      WITH latest_order_item AS (
        SELECT oi.custom_order_id AS order_id, oi.dispatched_on, oi.tracking_url, oi.estimated_delivery_to,
               ROW_NUMBER() OVER (PARTITION BY oi.custom_order_id ORDER BY oi.updated_at DESC) AS row_num
        FROM custom_order_item oi
      )
      SELECT o.id                        AS "orderId",
             o.created_at                AS "createdAt",
             loi.dispatched_on           AS "dispatchedOn",
             o.loyalty_order             AS "loyaltyOrder",
             loi.tracking_url            AS "trackingUrl",
             loi.estimated_delivery_to   AS "estimatedDeliveryDate",
             COUNT(oi.id)                AS "totalItemCount",
             COUNT(CASE
               WHEN oi.order_type = 'IN_STOCK' AND (EXTRACT(EPOCH FROM NOW()) * 1000 - oi.created_at) > 21600000 THEN 1
               WHEN oi.order_type <> 'IN_STOCK' AND w.id IS NOT NULL AND (w.status = 'INITIATED' OR w.status = 'COMPLETED') THEN 1
             END)                        AS "processingItemCount",
             COUNT(CASE
               WHEN oi.order_type = 'IN_STOCK' AND (EXTRACT(EPOCH FROM NOW()) * 1000 - oi.created_at) > 21600000 THEN 1
               WHEN oi.order_type <> 'IN_STOCK' AND w.id IS NOT NULL AND w.status = 'COMPLETED' THEN 1
             END)                        AS "readyItemCount",
             COUNT(CASE WHEN oi.tracking_url <> '' THEN 1 END)            AS "dispatchedItemCount",
             COUNT(CASE WHEN oi.order_status = 'CANCELLED' THEN 1 END)    AS "cancelledItemCount",
             CASE
               WHEN COUNT(CASE WHEN oi.order_status = 'CANCELLED' THEN 1 END) > 0 THEN 'CANCELLED'
               WHEN COUNT(CASE WHEN oi.order_status = 'INITIATED' OR oi.order_status = 'FAILED' THEN 1 END) > 0 THEN 'FAILED'
               WHEN COUNT(CASE WHEN oi.order_status = 'PARTIALLY_DISPATCHED' THEN 1 END) > 0 THEN 'PARTIALLY_DISPATCHED'
               WHEN COUNT(CASE WHEN oi.tracking_url = '' THEN 1 END) = COUNT(oi.id) THEN 'PROCESSING'
               WHEN COUNT(CASE WHEN oi.tracking_url <> '' THEN 1 END) = COUNT(oi.id) THEN 'DISPATCHED'
               ELSE 'IN_TRANSIT'
             END                         AS "status",
             'CUSTOM_ORDER'              AS "orderType"
      FROM custom_order o
        JOIN loom_tenant lt ON lt.id = o.tenant_id
        JOIN custom_order_item oi ON o.id = oi.custom_order_id
        LEFT JOIN workflow_custom_order_mapping wcom ON wcom.custom_order_item_id = oi.id
        LEFT JOIN workflow w ON w.id = wcom.workflow_id
        LEFT JOIN latest_order_item loi ON o.id = loi.order_id AND loi.row_num = 1
      WHERE o.tenant_id = ${tenantId}
      GROUP BY o.id, o.created_at, o.loyalty_order, loi.dispatched_on, loi.tracking_url, loi.estimated_delivery_to
      ORDER BY o.created_at DESC
      LIMIT ${size} OFFSET ${page * size}
    `);
    return normalisePreviews(rows);
  }

  async createOrder(data: typeof schema.orders.$inferInsert) {
    const result = await this.db.insert(schema.orders).values(data).returning();
    return result[0];
  }

  async updateOrder(id: bigint, data: Partial<typeof schema.orders.$inferInsert>) {
    const result = await this.db.update(schema.orders).set(data).where(eq(schema.orders.id, id)).returning();
    return result[0] ?? null;
  }

  /**
   * Loom: OrderDAOController.deleteOrder marks the row deleted; every read path
   * uses a `...AndDeletedFalse` finder. The `orders.deleted` column exists
   * (NOT NULL DEFAULT false) precisely for this. A hard DELETE would also
   * violate the stripe_transaction.fk_loom_order_id FK.
   */
  async deleteOrder(id: bigint) {
    const result = await this.db
      .update(schema.orders)
      .set({ deleted: true })
      .where(and(eq(schema.orders.id, id), eq(schema.orders.deleted, false)))
      .returning();
    return result[0] ?? null;
  }

  /**
   * Loom: OrderDAOController.updateOrderStatusToCancelled — stamps the order
   * header AND drives every order_item to CANCELLED with a fresh updatedAt.
   * The item write is load-bearing: findOrderPreviewsByTenant derives the
   * customer-visible status from `oi.order_status`, so a header-only cancel
   * leaves a cancelled order still reading PROCESSING/DISPATCHED.
   * Returns null when the order does not exist (or is already soft-deleted).
   */
  async cancelOrder(id: bigint, cancellationReason: string) {
    const now = Date.now();
    const result = await this.db
      .update(schema.orders)
      .set({ cancelledAt: now, cancellationReason })
      .where(and(eq(schema.orders.id, id), eq(schema.orders.deleted, false)))
      .returning();

    const order = result[0] ?? null;
    if (!order) return null;

    await this.db
      .update(schema.orderItem)
      .set({ orderStatus: "CANCELLED", updatedAt: now })
      .where(eq(schema.orderItem.orderId, Number(id)));

    return order;
  }

  // ─── Custom Order Methods ──────────────────────────────────────────────────

  async findCustomOrderById(id: bigint) {
    const rows = await this.db
      .select()
      .from(schema.customOrder)
      .where(and(eq(schema.customOrder.id, id), eq(schema.customOrder.deleted, false)));
    if (!rows[0]) return null;
    const items = await this.db.select().from(schema.customOrderItem).where(eq(schema.customOrderItem.customOrderId, Number(id)));
    return {
      ...rows[0],
      orderItemList: items || [],
    };
  }

  async findCustomOrdersByTenant(tenantId: bigint | number) {
    const tid = Number(tenantId);
    if (!Number.isFinite(tid) || tid <= 0) return [];
    return this.db.select()
      .from(schema.customOrder)
      .where(and(eq(schema.customOrder.tenantId, tid), eq(schema.customOrder.deleted, false)))
      .orderBy(desc(schema.customOrder.id))
      .limit(50);
  }

  async findAllCustomOrders() {
    return this.db.select()
      .from(schema.customOrder)
      .where(eq(schema.customOrder.deleted, false))
      .orderBy(desc(schema.customOrder.id))
      .limit(50);
  }

  async createCustomOrder(tenantId: bigint | number, data: any) {
    const tid = Number(tenantId);
    if (!Number.isFinite(tid) || tid <= 0) {
      throw new Error("createCustomOrder: a positive tenant id is required");
    }
    const orderItems = data.orderItemList || [];
    // Loom's addOrder trusts the payload's money: there is no invented floor
    // price anywhere in CustomOrderDAOController. The previous `if (subTotal
    // === 0) subTotal = 1500` silently billed 1500 for a zero-value order.
    let subTotal = 0;
    for (const item of orderItems) {
      subTotal += (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }

    const insertedOrder = await this.db.insert(schema.customOrder).values({
      tenantId: tid,
      subTotal: String(subTotal),
      total: String(subTotal),
      // Loom addOrder: `if (adjustedTotal == null || adjustedTotal == 0) adjustedTotal = total`.
      // The column defaults to '0', and every later adjustment is `adjustedTotal + delta`,
      // so leaving it unset permanently understates the order by its own total.
      adjustedTotal: String(subTotal),
      currency: data.currency || "INR",
      orderType: data.orderType || "FABRIC",
      note: data.note || "",
      address: data.address || {},
      ccEmails: data.ccEmails || [],
      loyaltyOrder: Boolean(data.loyaltyOrder),
      shippingMode: data.shippingMode || {},
      createdAt: Date.now(),
    }).returning();

    const newOrder = insertedOrder[0];
    if (newOrder && orderItems.length > 0) {
      for (const item of orderItems) {
        const customization = item.customization || {};
        if (item.description) customization.description = item.description;
        await this.db.insert(schema.customOrderItem).values({
          customOrderId: Number(newOrder.id),
          productGroup: item.productGroup || "fabric",
          orderType: item.orderType || "MADE_TO_ORDER",
          quantity: String(Number(item.quantity) || 0),
          unit: item.unit || "METER",
          price: String(Number(item.price) || 0),
          currency: item.currency || data.currency || "INR",
          customization,
          orderStatus: "PROCESSING",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return newOrder;
  }

  async updateCustomOrder(data: any) {
    const id = BigInt(data.orderId || 0);
    const updatePayload: any = {};
    if (data.ccEmails) updatePayload.ccEmails = data.ccEmails;
    if (data.currency) updatePayload.currency = data.currency;
    if (data.orderType) updatePayload.orderType = data.orderType;
    if (data.loyaltyOrder !== undefined) updatePayload.loyaltyOrder = data.loyaltyOrder;

    const res = await this.db.update(schema.customOrder).set(updatePayload).where(eq(schema.customOrder.id, id)).returning();
    return res[0] ?? null;
  }

  /**
   * Loom: CustomOrderDAOController.updateOrderStatusToCancelled + the
   * tenant-scoped `findByIdAndTenantAndDeletedFalse` read it is reached
   * through. `tenantId` was previously accepted and then ignored, so any
   * authenticated tenant could cancel any other tenant's custom order by id.
   */
  async cancelCustomOrder(id: bigint, tenantId: bigint | number) {
    const tid = Number(tenantId);
    if (!Number.isFinite(tid) || tid <= 0) return false;
    const now = Date.now();
    const res = await this.db.update(schema.customOrder).set({
      cancelledAt: now,
      cancellationReason: "Cancelled by user",
    }).where(and(
      eq(schema.customOrder.id, id),
      eq(schema.customOrder.tenantId, tid),
      eq(schema.customOrder.deleted, false),
    )).returning();

    if (!res[0]) return false;

    await this.db
      .update(schema.customOrderItem)
      .set({ orderStatus: "CANCELLED", updatedAt: now })
      .where(eq(schema.customOrderItem.customOrderId, Number(id)));

    return true;
  }

  /** Loom: soft delete — `custom_order.deleted` exists and every finder is `...AndDeletedFalse`. */
  async deleteCustomOrder(id: bigint) {
    const res = await this.db
      .update(schema.customOrder)
      .set({ deleted: true })
      .where(and(eq(schema.customOrder.id, id), eq(schema.customOrder.deleted, false)))
      .returning();
    return Boolean(res[0]);
  }
}

/** An OrderPreviewWithStatus row, as Loom's SqlResultSetMapping types it. */
export interface OrderPreview {
  orderId: number;
  createdAt: number;
  dispatchedOn: number | null;
  trackingUrl: string | null;
  estimatedDeliveryDate: number | null;
  totalItemCount: number;
  processingItemCount: number;
  readyItemCount: number;
  dispatchedItemCount: number;
  cancelledItemCount: number;
  status: string;
  orderType: "ORDER" | "CUSTOM_ORDER";
  loyaltyOrder: boolean;
}

/** pg returns COUNT()/BIGINT as strings; Loom's mapping types them as numbers. */
function normalisePreviews(result: unknown): OrderPreview[] {
  const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
  if (!Array.isArray(rows)) return [];
  return rows.map((raw) => {
    const r = raw as Record<string, unknown>;
    const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    return {
      orderId: Number(r.orderId),
      createdAt: Number(r.createdAt ?? 0),
      dispatchedOn: num(r.dispatchedOn),
      trackingUrl: (r.trackingUrl as string) ?? null,
      estimatedDeliveryDate: num(r.estimatedDeliveryDate),
      totalItemCount: Number(r.totalItemCount ?? 0),
      processingItemCount: Number(r.processingItemCount ?? 0),
      readyItemCount: Number(r.readyItemCount ?? 0),
      dispatchedItemCount: Number(r.dispatchedItemCount ?? 0),
      cancelledItemCount: Number(r.cancelledItemCount ?? 0),
      status: String(r.status ?? "PROCESSING"),
      orderType: r.orderType === "CUSTOM_ORDER" ? "CUSTOM_ORDER" : "ORDER",
      loyaltyOrder: Boolean(r.loyaltyOrder),
    } as OrderPreview;
  });
}
