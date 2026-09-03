/**
 * src/commerce/domain/sub-category-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for SubCategoryMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { SubCategoryMigratedDomainController } from "./sub-category-migrated.controller.js";

describeGates(
  "SubCategoryMigratedDomainController",
  SubCategoryMigratedDomainController as never,
  [
    ["get_get_sub_category_list", GateCode.CODE_SU],
  ],
  [],
);
