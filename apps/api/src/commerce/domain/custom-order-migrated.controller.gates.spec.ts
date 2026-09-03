/**
 * src/commerce/domain/custom-order-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for CustomOrderMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { CustomOrderMigratedDomainController } from "./custom-order-migrated.controller.js";

describeGates(
  "CustomOrderMigratedDomainController",
  CustomOrderMigratedDomainController as never,
  [
    ["get_get_customer_custom_order_orderId_fulfill", GateCode.CODE_CU],
    ["get_get_customer_custom_order_orderId_fulfillment_list", GateCode.CODE_CU],
    ["patch_update_custom_order_global_note", GateCode.CODE_SU],
    ["patch_update_custom_order_item", GateCode.CODE_SU],
    ["patch_add_custom_order_items", GateCode.CODE_SU],
    ["patch_update_custom_order_shipment", GateCode.CODE_SU],
    ["patch_update_custom_order_info", GateCode.CODE_SU],
    ["delete_delete_custom_order_item_orderItemId", GateCode.CODE_SU],
    ["post_add_custom_order_fulfillment", GateCode.CODE_SU],
    ["patch_update_custom_order_fulfillment", GateCode.CODE_SU],
    ["post_add_custom_order_ready", GateCode.CODE_SU],
    ["patch_update_custom_order_ready", GateCode.CODE_SU],
    ["post_add_custom_order_adjustment", GateCode.CODE_SU],
    ["patch_update_custom_order_adjustment", GateCode.CODE_SU],
    ["delete_delete_custom_order_adjustment_adjustmentId", GateCode.CODE_SU],
    ["get_get_table_explorer_data_custom_order_adjustment", GateCode.CODE_SU],
    ["get_get_table_explorer_data_custom_order_fulfillment", GateCode.CODE_SU],
    ["get_get_table_explorer_data_custom_order_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_custom_order_item_fulfillment", GateCode.CODE_SU],
    ["get_get_table_explorer_data_custom_order_item", GateCode.CODE_SU],
    ["get_get_table_explorer_data_custom_order", GateCode.CODE_SU],
  ],
  [],
);
