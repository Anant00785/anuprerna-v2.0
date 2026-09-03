/**
 * src/commerce/domain/misc-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for MiscMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { MiscMigratedDomainController } from "./misc-migrated.controller.js";

describeGates(
  "MiscMigratedDomainController",
  MiscMigratedDomainController as never,
  [
    ["post_add_color", GateCode.CODE_SU],
    ["patch_update_color", GateCode.CODE_SU],
    ["delete_delete_color_colorId", GateCode.CODE_SU],
    ["get_get_ads_conversion_summary", GateCode.CODE_SU],
    ["get_get_ads_conversion_abandoned_carts", GateCode.CODE_SU],
    ["delete_delete_material_materialId", GateCode.CODE_SU],
    ["delete_delete_pattern_patternId", GateCode.CODE_SU],
    ["get_users_users", GateCode.CODE_SU],
    ["post_users", GateCode.CODE_SU],
  ],
  [],
);
