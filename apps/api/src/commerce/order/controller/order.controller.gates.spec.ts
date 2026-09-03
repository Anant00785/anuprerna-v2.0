/**
 * src/commerce/order/controller/order.controller.gates.spec.ts
 *
 * Authorization regression tests for OrderController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { OrderController } from "./order.controller.js";

describeGates(
  "OrderController",
  OrderController as never,
  [
    ["addOrder", GateCode.CODE_CU],
    ["getCustomerOrder", GateCode.CODE_CU],
    ["getCustomerOrderList", GateCode.CODE_CU],
    // Loom OrderController.getCustomerOrderList / getCustomerAllOrderList /
    // getProcessingOrderStatus — all three pass CODE_CU to getEntity /
    // getEntityCustomResponse.
    ["getCustomerOrderListV2", GateCode.CODE_CU],
    ["getCustomerAllOrderList", GateCode.CODE_CU],
    ["getProcessingOrderStatus", GateCode.CODE_CU],
    ["getOrderLoyaltyInfo", GateCode.CODE_CU],
    ["cancelOrder", GateCode.CODE_CU],
    ["getSuperUserOrder", GateCode.CODE_SU],
    ["getSuperUserOrderList", GateCode.CODE_SU],
    ["updateOrder", GateCode.CODE_SU],
    ["deleteOrder", GateCode.CODE_SU],
  ],
  [],
);
