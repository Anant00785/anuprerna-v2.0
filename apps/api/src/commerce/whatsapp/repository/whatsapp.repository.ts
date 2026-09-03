import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION, type Database } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, desc, and, asc, gte, inArray, lt, ne } from 'drizzle-orm';
import type { WhatsappNotificationStatus } from '../types/whatsapp.types.js';

export type WhatsappNotificationHistoryRow = typeof schema.whatsappNotificationHistory.$inferSelect;

/**
 * Pollability, ported from Loom's findPollableDeliveryStatusWithinWindow /
 * BeforeWindow native queries: Freshchat accepted the send and the lifecycle
 * is not yet terminal. PENDING_SEND / POST_FAILED / POST_ERROR have nothing to
 * reconcile; READ / FAILED_DELIVERY are terminal.
 */
const POLLABLE_STATUSES: WhatsappNotificationStatus[] = ['POST_SUCCESS', 'SENT', 'DELIVERED'];

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

  // ---- delivery-status reconciliation (Loom WhatsappNotificationHistoryDAOController port) ----

  /** Raw row (not the formatted projection) — the polling service needs the typed entity. */
  async getHistoryEntityById(id: bigint): Promise<WhatsappNotificationHistoryRow | null> {
    const rows = await this.db
      .select()
      .from(schema.whatsappNotificationHistory)
      .where(eq(schema.whatsappNotificationHistory.id, id));
    return rows[0] ?? null;
  }

  /** Loom findPollableDeliveryStatusWithinWindow: pollable rows with sent_at >= cutoff. */
  async findPollableDeliveryStatusWithinWindow(cutoff: number): Promise<WhatsappNotificationHistoryRow[]> {
    const h = schema.whatsappNotificationHistory;
    return this.db
      .select()
      .from(h)
      .where(and(inArray(h.status, POLLABLE_STATUSES), ne(h.requestId, ''), gte(h.sentAt, cutoff)))
      .orderBy(asc(h.requestId), asc(h.id));
  }

  /** Loom findPollableDeliveryStatusBeforeWindow: the stale backlog, sent_at < cutoff. */
  async findPollableDeliveryStatusBeforeWindow(cutoff: number): Promise<WhatsappNotificationHistoryRow[]> {
    const h = schema.whatsappNotificationHistory;
    return this.db
      .select()
      .from(h)
      .where(and(inArray(h.status, POLLABLE_STATUSES), ne(h.requestId, ''), lt(h.sentAt, cutoff)))
      .orderBy(asc(h.requestId), asc(h.id));
  }

  /** Poll bookkeeping only — status untouched. Loom markDeliveryStatusPolled. */
  async markDeliveryStatusPolled(id: bigint, lastPolledAt: number, pollAttemptCount: number): Promise<void> {
    await this.db
      .update(schema.whatsappNotificationHistory)
      .set({ lastPolledAt, pollAttemptCount })
      .where(eq(schema.whatsappNotificationHistory.id, id));
  }

  /**
   * Advances a row to a reconciled delivery status. messageId/errorCode/
   * errorMessage are written only when non-blank so a reconcile never clobbers
   * a previously-captured value with an empty one (Loom recordDeliveryStatus).
   */
  async recordDeliveryStatus(
    id: bigint,
    status: WhatsappNotificationStatus,
    messageId: string,
    errorCode: string,
    errorMessage: string,
    statusUpdatedAt: number,
    lastPolledAt: number,
    pollAttemptCount: number,
  ): Promise<void> {
    const set: Partial<typeof schema.whatsappNotificationHistory.$inferInsert> = {
      status,
      statusUpdatedAt,
      lastPolledAt,
      pollAttemptCount,
    };
    if (messageId && messageId.trim() !== '') set.messageId = messageId;
    if (errorCode && errorCode.trim() !== '') set.errorCode = errorCode;
    if (errorMessage && errorMessage.trim() !== '') set.errorMessage = errorMessage;
    await this.db
      .update(schema.whatsappNotificationHistory)
      .set(set)
      .where(eq(schema.whatsappNotificationHistory.id, id));
  }
}
