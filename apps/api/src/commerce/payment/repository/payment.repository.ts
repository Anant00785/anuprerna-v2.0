// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

@Injectable()
export class RazorpayTransactionRepository {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async findById(id: bigint) {
        const rows = await this.db.select().from(schema.razorpayTransaction).where(eq(schema.razorpayTransaction.id, id));
        return rows[0] ?? null;
    }

    async findByOrderAndRazorpayOrderId(orderId: bigint, razorpayOrderId: string) {
        const rows = await this.db
            .select()
            .from(schema.razorpayTransaction)
            .where(
                and(
                    eq(schema.razorpayTransaction.loomOrderId, orderId),
                    eq(schema.razorpayTransaction.razorpayOrderId, razorpayOrderId)
                )
            );
        return rows[0] ?? null;
    }
    
    async findByOrder(orderId: bigint) {
        return this.db
            .select()
            .from(schema.razorpayTransaction)
            .where(eq(schema.razorpayTransaction.loomOrderId, orderId));
    }

    async findPaginated(page: number, size: number) {
        return this.db
            .select()
            .from(schema.razorpayTransaction)
            .limit(size)
            .offset(page * size);
    }

    async create(data: typeof schema.razorpayTransaction.$inferInsert) {
        const result = await this.db.insert(schema.razorpayTransaction).values(data).returning();
        return result[0];
    }

    async update(id: bigint, data: Partial<typeof schema.razorpayTransaction.$inferInsert>) {
        const result = await this.db.update(schema.razorpayTransaction).set(data).where(eq(schema.razorpayTransaction.id, id)).returning();
        return result[0];
    }
}

@Injectable()
export class StripeTransactionRepository {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async findById(id: bigint) {
        const rows = await this.db.select().from(schema.stripeTransaction).where(eq(schema.stripeTransaction.id, id));
        return rows[0] ?? null;
    }

    async findByOrderAndStripeSessionId(orderId: bigint, stripeSessionId: string) {
        const rows = await this.db
            .select()
            .from(schema.stripeTransaction)
            .where(
                and(
                    eq(schema.stripeTransaction.loomOrderId, orderId),
                    eq(schema.stripeTransaction.stripeSessionId, stripeSessionId)
                )
            );
        return rows[0] ?? null;
    }

    async findByStripePaymentIntentId(paymentIntentId: string) {
        const rows = await this.db
            .select()
            .from(schema.stripeTransaction)
            .where(eq(schema.stripeTransaction.stripePaymentIntentId, paymentIntentId));
        return rows[0] ?? null;
    }

    async findByOrderAndPaymentTypeOrderByCreatedAtDesc(orderId: bigint, paymentType: string) {
        return this.db
            .select()
            .from(schema.stripeTransaction)
            .where(
                and(
                    eq(schema.stripeTransaction.loomOrderId, orderId),
                    eq(schema.stripeTransaction.paymentType, paymentType)
                )
            )
            .orderBy(desc(schema.stripeTransaction.createdAt));
    }

    async findPaginated(page: number, size: number) {
        return this.db
            .select()
            .from(schema.stripeTransaction)
            .limit(size)
            .offset(page * size);
    }

    async create(data: typeof schema.stripeTransaction.$inferInsert) {
        const result = await this.db.insert(schema.stripeTransaction).values(data).returning();
        return result[0];
    }

    async update(id: bigint, data: Partial<typeof schema.stripeTransaction.$inferInsert>) {
        const result = await this.db.update(schema.stripeTransaction).set(data).where(eq(schema.stripeTransaction.id, id)).returning();
        return result[0];
    }
}
// @ts-nocheck
// @ts-nocheck
