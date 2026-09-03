/**
 * src/commerce/product/controller/finished-product.controller.gates.spec.ts
 *
 * Authorization regression tests for FinishedProductController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { FinishedProductController } from "./finished-product.controller.js";

describeGates(
  "FinishedProductController",
  FinishedProductController as never,
  [
    ["createFinishedProduct", GateCode.CODE_SU],
    ["updateFinishedProduct", GateCode.CODE_SU],
    ["disableFinishedProduct", GateCode.CODE_SU],
    ["triggerZohoWorkflow", GateCode.CODE_SU],
    ["getFinishedProductData", GateCode.CODE_SU],
  ],
  ["getFinishedProduct", "getFinishedProductBySlug"],
);
