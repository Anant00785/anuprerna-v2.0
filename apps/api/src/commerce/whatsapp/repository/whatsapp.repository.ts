// @ts-nocheck
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION, type Database } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, desc } from 'drizzle-orm';

function formatWhatsappHistoryRow(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    tenantType: r.tenantType,
    tenantId: r.tenantId ? String(r.tenantId) : null,
    tenantName: r.tenantName,
    recipientMobile: r.recipientMobile,
    fromMobile: r.fromMobile,
    triggerType: r.triggerType,
    entityType: r.entityType,
    entityId: r.entityId ? String(r.entityId) : null,
    templateName: r.templateName,
    languageCode: r.languageCode,
    namespace: r.namespace,
    status: r.status,
    httpStatus: r.httpStatus,
    errorCode: r.errorCode || null,
    errorMessage: r.errorMessage || null,
    attemptCount: r.attemptCount ? Number(r.attemptCount) : 1,
    createdAt: r.createdAt ? Number(r.createdAt) : null,
    sentAt: r.sentAt ? Number(r.sentAt) : null,
    statusUpdatedAt: r.statusUpdatedAt ? Number(r.statusUpdatedAt) : null,
  };
}

@Injectable()
export class WhatsappRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async createHistory(data: typeof schema.whatsappNotificationHistory.$inferInsert) {
    const [result] = await this.db.insert(schema.whatsappNotificationHistory).values(data).returning();
    return formatWhatsappHistoryRow(result);
  }

  async getPaginatedHistory(page: number, size: number) {
    const safePage = Math.max(0, page > 0 ? page - 1 : page);
    const safeSize = Math.max(1, size || 10);
    const offset = safePage * safeSize;
    const rows = await this.db
      .select()
      .from(schema.whatsappNotificationHistory)
      .limit(safeSize)
      .offset(offset)
      .orderBy(desc(schema.whatsappNotificationHistory.id));
    return (rows || []).map(formatWhatsappHistoryRow);
  }

  async getHistoryById(id: number | bigint | string) {
    const rows = await this.db
      .select()
      .from(schema.whatsappNotificationHistory)
      .where(eq(schema.whatsappNotificationHistory.id, BigInt(id)));
    return rows && rows.length > 0 ? formatWhatsappHistoryRow(rows[0]) : null;
  }
}
