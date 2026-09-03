/**
 * Ports com.bloomscorp.loom.notifire.orm enums.
 *
 * These MUST stay identical to the Postgres enums
 * (`email_notification_status_enum`, `email_notification_trigger_type_enum`,
 * `email_notification_entity_type_enum`) in database/schema/schema.ts —
 * the previous PENDING/SENT/FAILED + ORDER_DISPATCH/CUSTOMER values did not
 * exist in either the Java enums or the database, so every audit insert was a
 * guaranteed `invalid input value for enum` at runtime. The `as any` casts on
 * the insert hid that.
 */
export enum EmailNotificationStatus {
  PENDING_SEND = 'PENDING_SEND',
  POST_SUCCESS = 'POST_SUCCESS',
  POST_FAILED = 'POST_FAILED',
  POST_ERROR = 'POST_ERROR',
}

export enum EmailNotificationTriggerType {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ORDER_FULFILLMENT_DISPATCH = 'ORDER_FULFILLMENT_DISPATCH',
  ORDER_PAYMENT_FAILED = 'ORDER_PAYMENT_FAILED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_REVIEW_REQUEST = 'ORDER_REVIEW_REQUEST',
  CUSTOM_ORDER_CONFIRMATION = 'CUSTOM_ORDER_CONFIRMATION',
  CUSTOM_ORDER_DISPATCH = 'CUSTOM_ORDER_DISPATCH',
  PRE_ORDER_CONFIRMATION = 'PRE_ORDER_CONFIRMATION',
  PRE_ORDER_READY_TO_SHIP = 'PRE_ORDER_READY_TO_SHIP',
  CONTACT_US = 'CONTACT_US',
  CUSTOMER_BTS_UPDATE = 'CUSTOMER_BTS_UPDATE',
  INTERNAL_BTS_UPDATE = 'INTERNAL_BTS_UPDATE',
  WORKFLOW_STATUS_UPDATE = 'WORKFLOW_STATUS_UPDATE',
}

export enum EmailNotificationEntityType {
  ORDER = 'ORDER',
  CUSTOM_ORDER = 'CUSTOM_ORDER',
  WORKFLOW = 'WORKFLOW',
}
