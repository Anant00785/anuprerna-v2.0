/**
 * src/commerce/domain/notifications.controller.gates.spec.ts
 *
 * Authorization regression tests for NotificationsDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { NotificationsDomainController } from "./notifications.controller.js";

describeGates(
  "NotificationsDomainController",
  NotificationsDomainController as never,
  [
    ["post_send_email_prepared_order", GateCode.CODE_SU],
    ["post_send_email_confirmed_order_orderId", GateCode.CODE_SU],
    ["post_send_email_confirmed_custom_order_orderId", GateCode.CODE_SU],
    ["get_get_cron_logs", GateCode.CODE_SU],
    ["get_get_whatsapp_audit_log", GateCode.CODE_SU],
    ["get_get_whatsapp_audit_log_id", GateCode.CODE_SU],
    ["post_poll_whatsapp_delivery_status", GateCode.CODE_SU],
    ["post_poll_whatsapp_delivery_status_stale", GateCode.CODE_SU],
    ["post_poll_whatsapp_delivery_status_id", GateCode.CODE_SU],
    ["get_get_email_audit_log", GateCode.CODE_SU],
    ["get_get_email_audit_log_id", GateCode.CODE_SU],
    ["post_retrigger_email_audit_log", GateCode.CODE_SU],
    ["patch_customer_whatsapp_dismiss", GateCode.CODE_CU],
    ["patch_customer_whatsapp_opt_in", GateCode.CODE_CU],
    ["patch_customer_whatsapp_opt_out", GateCode.CODE_CU],
    ["post_send_email", GateCode.CODE_SU],
  ],
  [],
);
