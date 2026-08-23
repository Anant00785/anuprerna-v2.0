// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

@Injectable()
export class OrderRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: bigint) {
    const rows = await this.db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return rows[0] ?? null;
  }

  async findByCustomerIdPaginated(customerId: bigint | number, page: number, size: number) {
    const tid = Number(customerId) || 1;
    return this.db.select()
      .from(schema.orders)
      .where(sql`orders.tenant_id = ${tid}`)
      .limit(size)
      .offset(page * size)
      .orderBy(desc(schema.orders.id));
  }

  async findAllPaginated(page: number, size: number) {
    return this.db.select()
      .from(schema.orders)
      .limit(size)
      .offset(page * size)
      .orderBy(desc(schema.orders.id));
  }
  
  async createOrder(data: typeof schema.orders.$inferInsert) {
    const result = await this.db.insert(schema.orders).values(data).returning();
    return result[0];
  }

  async updateOrder(id: bigint, data: Partial<typeof schema.orders.$inferInsert>) {
    const result = await this.db.update(schema.orders).set(data).where(eq(schema.orders.id, id)).returning();
    return result[0] ?? null;
  }

  async deleteOrder(id: bigint) {
    const result = await this.db.delete(schema.orders).where(eq(schema.orders.id, id)).returning();
    return result[0] ?? null;
  }

  // ─── Custom Order Methods ──────────────────────────────────────────────────

  async findCustomOrderById(id: bigint) {
    const rows = await this.db.select().from(schema.customOrder).where(eq(schema.customOrder.id, id));
    if (!rows[0]) return null;
    const items = await this.db.select().from(schema.customOrderItem).where(eq(schema.customOrderItem.customOrderId, Number(id)));
    return {
      ...rows[0],
      orderItemList: items || [],
    };
  }

  async findCustomOrdersByTenant(tenantId: bigint | number) {
    const tid = Number(tenantId) || 1;
    return this.db.select()
      .from(schema.customOrder)
      .where(eq(schema.customOrder.tenantId, tid))
      .orderBy(desc(schema.customOrder.id))
      .limit(50);
  }

  async findAllCustomOrders() {
    return this.db.select()
      .from(schema.customOrder)
      .orderBy(desc(schema.customOrder.id))
      .limit(50);
  }

  async createCustomOrder(tenantId: bigint | number, data: any) {
    const tid = Number(tenantId) || 1;
    const orderItems = data.orderItemList || [];
    let subTotal = 0;
    for (const item of orderItems) {
      subTotal += (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }
    if (subTotal === 0) subTotal = 1500;

    const insertedOrder = await this.db.insert(schema.customOrder).values({
      tenantId: tid,
      subTotal: String(subTotal),
      total: String(subTotal),
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
          quantity: String(item.quantity || 10),
          unit: item.unit || "METER",
          price: String(item.price || 1500),
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

  async cancelCustomOrder(id: bigint, tenantId: bigint | number) {
    const res = await this.db.update(schema.customOrder).set({
      cancelledAt: Date.now(),
      cancellationReason: "Cancelled by user",
    }).where(eq(schema.customOrder.id, id)).returning();
    return Boolean(res[0]);
  }

  async deleteCustomOrder(id: bigint) {
    const res = await this.db.delete(schema.customOrder).where(eq(schema.customOrder.id, id)).returning();
    return Boolean(res[0]);
  }
}
