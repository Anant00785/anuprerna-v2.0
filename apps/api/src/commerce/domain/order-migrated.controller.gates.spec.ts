/**
 * src/commerce/domain/order-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for OrderMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { OrderMigratedDomainController } from "./order-migrated.controller.js";

describeGates(
  "OrderMigratedDomainController",
  OrderMigratedDomainController as never,
  [
    ["patch_update_order_global_note", GateCode.CODE_SU],
    ["patch_update_order_shipment", GateCode.CODE_SU],
    ["get_get_impact_order_orderId", GateCode.CODE_SUCU],
    ["post_trigger_impact_order_orderId", GateCode.CODE_SU],
    ["get_get_impact_order_aggregation", GateCode.CODE_SU],
    ["get_get_order_orderId_workflow_list", GateCode.CODE_SU],
    ["get_get_order_orderId_workflow_orderItemId", GateCode.CODE_CU],
    ["get_get_data_dump_order", GateCode.CODE_SU],
    ["get_get_data_dump_order_item", GateCode.CODE_SU],
    ["get_get_table_explorer_data_order_item_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_order_review_scheduled_email_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_orders_id", GateCode.CODE_SU],
    ["get_get_ads_conversion_orders", GateCode.CODE_SU],
    ["get_get_email_audit_log_order_orderId", GateCode.CODE_SU],
    ["post_send_email_order_notification", GateCode.CODE_SU],
    ["get_get_table_explorer_data_order_fulfillment_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_order_fulfillment", GateCode.CODE_SU],
    ["get_get_table_explorer_data_order_item_fulfillment", GateCode.CODE_SU],
    ["get_get_table_explorer_data_order_item", GateCode.CODE_SU],
    ["get_get_table_explorer_data_order_review_scheduled_email", GateCode.CODE_SU],
    ["get_get_table_explorer_data_orders", GateCode.CODE_SU],
  ],
  [],
);
