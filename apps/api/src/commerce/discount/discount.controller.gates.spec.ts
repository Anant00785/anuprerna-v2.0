/**
 * src/commerce/discount/discount.controller.gates.spec.ts
 *
 * Authorization regression tests for DiscountController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { DiscountController } from "./discount.controller.js";

describeGates(
  "DiscountController",
  DiscountController as never,
  [
    ["applyVoucherDiscountPost", GateCode.CODE_CU],
    ["applyVoucherDiscountPatch", GateCode.CODE_CU],
  ],
  [],
);
