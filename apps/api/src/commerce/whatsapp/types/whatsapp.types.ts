import {
  whatsappNotificationEntityTypeEnum,
  whatsappNotificationStatusEnum,
  whatsappNotificationTenantTypeEnum,
  whatsappNotificationTriggerTypeEnum,
} from '../../../database/schema/schema.js';

/**
 * These four were hand-written enums whose members ('PENDING', 'FAILED',
 * 'CUSTOMER' as an entity type, 'OPT_IN', 'ALERT', 'SYSTEM') exist in none of
 * the whatsapp_notification_* Postgres enums, so every value written through
 * them was rejected by the database. They are now derived from the schema.
 */
export type WhatsappNotificationStatus = (typeof whatsappNotificationStatusEnum.enumValues)[number];
export type WhatsappNotificationEntityType = (typeof whatsappNotificationEntityTypeEnum.enumValues)[number];
export type WhatsappNotificationTriggerType = (typeof whatsappNotificationTriggerTypeEnum.enumValues)[number];
export type WhatsappNotificationTenantType = (typeof whatsappNotificationTenantTypeEnum.enumValues)[number];

export interface WhatsappOutboundMessage { messaging_product: string; recipient_type: string; to: string; type: string; template: any; }
export interface WhatsappContactNumber { input: string; wa_id: string; }
export interface WhatsappTransferResponse { messaging_product: string; contacts: WhatsappContactNumber[]; messages: { id: string }[]; }

/**
 * Freshchat delivery-status read shapes — the response of
 * `GET {WHATSAPP_API_URL}/outbound-messages?request_id=...`, ported from
 * Loom's WhatsappDeliveryStatusResponse / WhatsappOutboundMessage pojos.
 * (Distinct from WhatsappOutboundMessage above, which is the SEND payload.)
 */
export interface FreshchatDeliveryRecord {
  message_id?: string;
  to?: { phone_number?: string };
  status?: string;
  failure_code?: string;
  failure_reason?: string;
}

export interface WhatsappDeliveryStatusResponse {
  outbound_messages?: FreshchatDeliveryRecord[];
}

/** Ported verbatim from Loom's WhatsappDeliveryStatusPollSummary. */
export interface WhatsappDeliveryStatusPollSummary {
  candidatesScanned: number;
  requestBatchesQueried: number;
  rowsTransitioned: number;
  rowsUnchanged: number;
  failedBatches: number;
  rateLimited: boolean;
}
