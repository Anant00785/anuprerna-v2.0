/**
 * src/commerce/domain/super-user.controller.gates.spec.ts
 *
 * Authorization regression tests for SuperUserDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { SuperUserDomainController } from "./super-user.controller.js";

describeGates(
  "SuperUserDomainController",
  SuperUserDomainController as never,
  [
    ["post_super_user_registration", GateCode.CODE_SU],
    ["get_get_super_user_order_list_search", GateCode.CODE_SU],
    ["get_get_super_user_custom_order_list_search", GateCode.CODE_SU],
    ["get_get_super_user_custom_order_orderId_fulfillment_list", GateCode.CODE_SU],
    ["get_get_super_user_custom_order_orderId_ready_list", GateCode.CODE_SU],
    ["get_get_super_user_ads_conversion_summary", GateCode.CODE_SU],
    ["get_get_super_user_ads_conversion_orders", GateCode.CODE_SU],
    ["get_get_super_user_ads_conversion_abandoned_carts", GateCode.CODE_SU],
    ["get_get_table_explorer_data_super_user_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_super_user", GateCode.CODE_SU],
  ],
  [],
);
