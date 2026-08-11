// @ts-nocheck
export enum WhatsappNotificationStatus { PENDING = 'PENDING', SENT = 'SENT', DELIVERED = 'DELIVERED', READ = 'READ', FAILED = 'FAILED' }
export enum WhatsappNotificationEntityType { CUSTOMER = 'CUSTOMER' }
export enum WhatsappNotificationTriggerType { OPT_IN = 'OPT_IN', ALERT = 'ALERT' }
export enum WhatsappNotificationTenantType { SYSTEM = 'SYSTEM' }

export interface WhatsappOutboundMessage { messaging_product: string; recipient_type: string; to: string; type: string; template: any; }
export interface WhatsappContactNumber { input: string; wa_id: string; }
export interface WhatsappTransferResponse { messaging_product: string; contacts: WhatsappContactNumber[]; messages: { id: string }[]; }
// @ts-nocheck
// @ts-nocheck
