// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc, asc, like, or, inArray, isNull, isNotNull, between, gte, lte } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

@Injectable()
export class InventoryRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // Warehouse
  async findWarehouseById(id: bigint) {
    const rows = await this.db.select().from(schema.warehouse).where(eq(schema.warehouse.id, id));
    return rows[0] ?? null;
  }

  async findWarehousesPaginated(page: number, size: number) {
    return this.db.select().from(schema.warehouse).limit(size).offset(page * size).orderBy(desc(schema.warehouse.createdAt));
  }

  async insertWarehouse(data: typeof schema.warehouse.$inferInsert) {
    const rows = await this.db.insert(schema.warehouse).values(data).returning();
    return rows[0];
  }

  async updateWarehouse(id: bigint, data: Partial<typeof schema.warehouse.$inferInsert>) {
    const rows = await this.db.update(schema.warehouse).set(data).where(eq(schema.warehouse.id, id)).returning();
    return rows[0];
  }

  // Inventory Adjustment Reason
  async findReasonById(id: bigint) {
    const rows = await this.db.select().from(schema.inventoryAdjustmentReason).where(eq(schema.inventoryAdjustmentReason.id, id));
    return rows[0] ?? null;
  }

  async findReasonsPaginated(page: number, size: number) {
    return this.db.select().from(schema.inventoryAdjustmentReason).limit(size).offset(page * size).orderBy(desc(schema.inventoryAdjustmentReason.createdAt));
  }

  async insertReason(data: typeof schema.inventoryAdjustmentReason.$inferInsert) {
    const rows = await this.db.insert(schema.inventoryAdjustmentReason).values(data).returning();
    return rows[0];
  }

  async updateReason(id: bigint, data: Partial<typeof schema.inventoryAdjustmentReason.$inferInsert>) {
    const rows = await this.db.update(schema.inventoryAdjustmentReason).set(data).where(eq(schema.inventoryAdjustmentReason.id, id)).returning();
    return rows[0];
  }

  // Inventory Adjustment
  async findAdjustmentById(id: bigint) {
    const rows = await this.db.select().from(schema.inventoryAdjustment).where(eq(schema.inventoryAdjustment.id, id));
    if (!rows[0]) return null;
    const items = await this.db.select().from(schema.inventoryAdjustmentItem).where(eq(schema.inventoryAdjustmentItem.inventoryAdjustmentId, id));
    return { ...rows[0], items };
  }

  async findAdjustmentsPaginated(page: number, size: number) {
    return this.db.select().from(schema.inventoryAdjustment).limit(size).offset(page * size).orderBy(desc(schema.inventoryAdjustment.createdAt));
  }

  async insertAdjustment(data: typeof schema.inventoryAdjustment.$inferInsert, items: typeof schema.inventoryAdjustmentItem.$inferInsert[]) {
    return await this.db.transaction(async (tx) => {
      const rows = await tx.insert(schema.inventoryAdjustment).values(data).returning();
      const adjustmentId = rows[0].id;
      const itemsToInsert = items.map(item => ({ ...item, inventoryAdjustmentId: adjustmentId }));
      await tx.insert(schema.inventoryAdjustmentItem).values(itemsToInsert);
      return rows[0];
    });
  }

  // Inventory Restock Request
  async findRestockRequestById(id: bigint) {
    const rows = await this.db.select().from(schema.inventoryRestockRequest).where(eq(schema.inventoryRestockRequest.id, id));
    return rows[0] ?? null;
  }

  async findRestockRequestsPaginated(page: number, size: number) {
    return this.db.select().from(schema.inventoryRestockRequest).limit(size).offset(page * size).orderBy(desc(schema.inventoryRestockRequest.createdAt));
  }

  async insertRestockRequest(data: typeof schema.inventoryRestockRequest.$inferInsert) {
    const rows = await this.db.insert(schema.inventoryRestockRequest).values(data).returning();
    return rows[0];
  }

  async updateRestockRequestQuantity(id: bigint, quantity: number) {
    const rows = await this.db.update(schema.inventoryRestockRequest).set({ requestedQuantity: quantity.toString() }).where(eq(schema.inventoryRestockRequest.id, id)).returning();
    return rows[0];
  }

  async updateRestockRequestStatus(id: bigint, status: any) {
    const rows = await this.db.update(schema.inventoryRestockRequest).set({ status }).where(eq(schema.inventoryRestockRequest.id, id)).returning();
    return rows[0];
  }

  async deleteRestockRequest(id: bigint) {
    const rows = await this.db.delete(schema.inventoryRestockRequest).where(eq(schema.inventoryRestockRequest.id, id)).returning();
    return rows[0] ?? null;
  }
}
// @ts-nocheck
// @ts-nocheck
