import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class NotificationRepository {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>) {}

    async createHistory(data: typeof schema.emailNotificationHistory.$inferInsert) {
        const [result] = await this.db.insert(schema.emailNotificationHistory).values(data).returning();
        return result;
    }

    /**
     * Ports EmailNotificationHistoryDAOController.recordPostSuccess /
     * recordPostFailure: the PENDING_SEND row is transitioned in place once the
     * send resolves.
     */
    async recordSendOutcome(
        id: bigint,
        outcome: {
            status: (typeof schema.emailNotificationHistory.$inferInsert)['status'];
            httpStatus: number;
            errorMessage: string;
            sentAt: number;
            latencyMs: number;
        },
    ) {
        const [result] = await this.db.update(schema.emailNotificationHistory)
            .set(outcome)
            .where(eq(schema.emailNotificationHistory.id, id))
            .returning();
        return result ?? null;
    }

    async getPaginatedHistory(page: number, size: number) {
        const offset = (page - 1) * size;
        return this.db.select().from(schema.emailNotificationHistory).limit(size).offset(offset).orderBy(desc(schema.emailNotificationHistory.id));
    }

    async getHistoryById(id: bigint) {
        const [result] = await this.db.select().from(schema.emailNotificationHistory).where(eq(schema.emailNotificationHistory.id, id));
        return result ?? null;
    }

    /**
     * The recipient and tenant for an order, as OrderEmailTriggerService gets
     * them: `order.getTenant()` supplies the address and display name, so the
     * email is rebuilt from current database state rather than from caller
     * input.
     */
    async getOrderEmailTarget(orderId: bigint) {
        const [row] = await this.db
            .select({
                orderId: schema.orders.id,
                tenantId: schema.orders.tenantId,
                email: schema.loomTenant.email,
                userName: schema.loomTenant.userName,
                deleted: schema.orders.deleted,
            })
            .from(schema.orders)
            .innerJoin(schema.loomTenant, eq(schema.orders.tenantId, schema.loomTenant.id))
            .where(eq(schema.orders.id, orderId));
        return row ?? null;
    }
}
