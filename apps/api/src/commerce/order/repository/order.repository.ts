// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc, asc, like, or, inArray, isNull, isNotNull, between, gte, lte } from "drizzle-orm";
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

  async findByCustomerIdPaginated(customerId: bigint, page: number, size: number) {
    return this.db.select()
      .from(schema.orders)
      .where(eq(schema.orders.customerId, customerId))
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
}
// @ts-nocheck
// @ts-nocheck
