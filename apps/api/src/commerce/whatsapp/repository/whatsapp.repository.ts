// @ts-nocheck
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION, type Database } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class WhatsappRepository {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

    async createHistory(data: typeof schema.whatsappNotificationHistory.$inferInsert) {
        const [result] = await this.db.insert(schema.whatsappNotificationHistory).values(data).returning();
        return result;
    }

    async getPaginatedHistory(page: number, size: number) {
        const offset = (page - 1) * size;
        return this.db.select().from(schema.whatsappNotificationHistory).limit(size).offset(offset).orderBy(desc(schema.whatsappNotificationHistory.id));
    }

    async getHistoryById(id: number) {
        const [result] = await this.db.select().from(schema.whatsappNotificationHistory).where(eq(schema.whatsappNotificationHistory.id, id));
        return result;
    }
}
// @ts-nocheck
// @ts-nocheck
