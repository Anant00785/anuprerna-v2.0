/**
 * src/commerce/domain/discount-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for DiscountMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { DiscountMigratedDomainController } from "./discount-migrated.controller.js";

describeGates(
  "DiscountMigratedDomainController",
  DiscountMigratedDomainController as never,
  [
    ["get_get_volume_discount_profile_list", GateCode.CODE_SU],
    ["get_get_volume_discount_profile_profileId", GateCode.CODE_SU],
    ["post_add_volume_discount_profile", GateCode.CODE_SU],
    ["patch_update_volume_discount_profile", GateCode.CODE_SU],
    ["delete_delete_volume_discount_profile_profileId", GateCode.CODE_SU],
    ["get_get_discount_list", GateCode.CODE_SU],
    ["get_get_discount_discountId", GateCode.CODE_SU],
    ["post_add_discount", GateCode.CODE_SU],
    ["patch_update_discount", GateCode.CODE_SU],
    ["delete_delete_discount_discountId", GateCode.CODE_SU],
    ["get_get_table_explorer_data_volume_discount_profile_item_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_volume_discount_profile_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_discount", GateCode.CODE_SU],
    ["get_get_table_explorer_data_volume_discount_profile_item", GateCode.CODE_SU],
    ["get_get_table_explorer_data_volume_discount_profile", GateCode.CODE_SU],
  ],
  [],
);
