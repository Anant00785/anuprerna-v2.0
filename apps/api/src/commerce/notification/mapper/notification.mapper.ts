import * as schema from '../../../database/schema/schema.js';

export function toEmailHistoryDto(row: typeof schema.emailNotificationHistory.$inferSelect) {
    return {
        id: row.id,
        tenantId: row.tenantId,
        entityId: row.entityId,
        entityType: row.entityType,
        triggerType: row.triggerType,
        status: row.status
    };
}
