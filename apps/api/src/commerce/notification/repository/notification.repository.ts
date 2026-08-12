// @ts-nocheck
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database.module.js';
import * as schema from '../../database/schema/schema.js';
import { eq, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class NotificationRepository {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>) {}

    async createHistory(data: typeof schema.emailNotificationHistory.$inferInsert) {
        const [result] = await this.db.insert(schema.emailNotificationHistory).values(data).returning();
        return result;
    }

    async getPaginatedHistory(page: number, size: number) {
        const offset = (page - 1) * size;
        return this.db.select().from(schema.emailNotificationHistory).limit(size).offset(offset).orderBy(desc(schema.emailNotificationHistory.id));
    }

    async getHistoryById(id: number) {
        const [result] = await this.db.select().from(schema.emailNotificationHistory).where(eq(schema.emailNotificationHistory.id, id));
        return result;
    }
}
// @ts-nocheck
// @ts-nocheck
