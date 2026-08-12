// @ts-nocheck
import * as schema from '../../../database/schema/schema.js';

export function toWhatsappHistoryDto(row: typeof schema.whatsappNotificationHistory.$inferSelect) {
    return {
        id: row.id,
        tenantId: row.tenantId,
        entityId: row.entityId,
        entityType: row.entityType,
        triggerType: row.triggerType,
        status: row.status
    };
}
// @ts-nocheck
// @ts-nocheck
