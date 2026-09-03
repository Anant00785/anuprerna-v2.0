/**
 * src/commerce/domain/finished-product-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for FinishedProductMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { FinishedProductMigratedDomainController } from "./finished-product-migrated.controller.js";

describeGates(
  "FinishedProductMigratedDomainController",
  FinishedProductMigratedDomainController as never,
  [
    ["delete_delete_finished_product_productId", GateCode.CODE_SU],
  ],
  [],
);
