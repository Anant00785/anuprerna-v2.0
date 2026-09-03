/**
 * src/commerce/domain/fabric-product-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for FabricProductMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { FabricProductMigratedDomainController } from "./fabric-product-migrated.controller.js";

describeGates(
  "FabricProductMigratedDomainController",
  FabricProductMigratedDomainController as never,
  [
    ["get_get_fabric_profile_list", GateCode.CODE_SU],
    ["get_get_fabric_profile_profileId", GateCode.CODE_SU],
    ["post_add_fabric_profile", GateCode.CODE_SU],
    ["patch_update_fabric_profile_profileId", GateCode.CODE_SU],
    ["delete_delete_fabric_profile_profileId", GateCode.CODE_SU],
    ["delete_delete_fabric_profile_item_profileItemId", GateCode.CODE_SU],
    ["get_get_table_explorer_data_fabric_profile_item_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_fabric_profile_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_fabric_profile_item", GateCode.CODE_SU],
    ["get_get_table_explorer_data_fabric_profile", GateCode.CODE_SU],
  ],
);
