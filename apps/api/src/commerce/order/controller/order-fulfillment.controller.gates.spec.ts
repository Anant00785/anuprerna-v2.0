/**
 * src/commerce/order/controller/order-fulfillment.controller.gates.spec.ts
 *
 * Authorization regression tests for OrderFulfillmentController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { OrderFulfillmentController } from "./order-fulfillment.controller.js";

describeGates(
  "OrderFulfillmentController",
  OrderFulfillmentController as never,
  [
    ["addFulfillment", GateCode.CODE_SU],
    ["updateFulfillment", GateCode.CODE_SU],
    ["getSuperUserFulfillmentList", GateCode.CODE_SU],
    ["getCustomerFulfillmentList", GateCode.CODE_CU],
    ["addOrderReady", GateCode.CODE_SU],
    ["updateOrderReady", GateCode.CODE_SU],
    ["getSuperUserReadyList", GateCode.CODE_SU],
  ],
  [],
);
