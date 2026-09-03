/**
 * src/commerce/order/controller/custom-order.controller.gates.spec.ts
 *
 * Authorization regression tests for CustomOrderController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CustomOrderController } from "./custom-order.controller.js";

describeGates(
  "CustomOrderController",
  CustomOrderController as never,
  [
    ["createCustomOrder", GateCode.CODE_CU],
    ["getCustomerCustomOrder", GateCode.CODE_CU],
    ["getCustomerCustomOrderList", GateCode.CODE_CU],
    ["getSuperUserCustomOrder", GateCode.CODE_SU],
    ["getSuperUserCustomOrderList", GateCode.CODE_SU],
    ["updateCustomOrder", GateCode.CODE_SU],
    ["cancelCustomOrder", GateCode.CODE_CU],
    ["getCustomOrderFulfillmentList", GateCode.CODE_SU],
    ["deleteCustomOrder", GateCode.CODE_SU],
  ],
  [],
);
