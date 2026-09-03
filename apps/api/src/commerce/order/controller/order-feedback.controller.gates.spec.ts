/**
 * src/commerce/order/controller/order-feedback.controller.gates.spec.ts
 *
 * Authorization regression tests for OrderFeedbackController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { OrderFeedbackController } from "./order-feedback.controller.js";

describeGates(
  "OrderFeedbackController",
  OrderFeedbackController as never,
  [
    ["addFeedback", GateCode.CODE_CU],
    ["updateFeedbackQ1", GateCode.CODE_CU],
    ["updateFeedbackQ2", GateCode.CODE_CU],
    ["updateFeedbackQ3", GateCode.CODE_CU],
    ["getFeedbackByOrder", GateCode.CODE_SUCU],
    ["getFeedbackById", GateCode.CODE_SU],
    ["getFeedbackList", GateCode.CODE_SU],
  ],
  [],
);
