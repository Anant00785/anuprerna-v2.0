/**
 * src/commerce/impact/controller/impact.controller.gates.spec.ts
 *
 * Authorization regression tests for ImpactController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ImpactController } from "./impact.controller.js";

describeGates(
  "ImpactController",
  ImpactController as never,
  [
    ["getFactors", GateCode.CODE_SUCU],
    ["getFactorById", GateCode.CODE_SUCU],
    ["addFactor", GateCode.CODE_SU],
    ["updateFactor", GateCode.CODE_SU],
    ["deleteFactor", GateCode.CODE_SU],
    ["getProductImpact", GateCode.CODE_SUCU],
    // Loom ImpactFactorController: getCustomOrderImpact is CODE_SUCU (and
    // scopes to the caller's own tenant unless they are SU);
    // getCustomOrderImpactAggregation is CODE_SU.
    ["getCustomOrderImpact", GateCode.CODE_SUCU],
    ["getCustomOrderImpactAggregation", GateCode.CODE_SU],
    // Loom ImpactFactorController.triggerCustomOrderImpact passes CODE_SU:
    // recalculation writes custom_impact_factor rows, so it is never customer-reachable.
    ["triggerCustomOrderImpact", GateCode.CODE_SU],
  ],
  [],
);
