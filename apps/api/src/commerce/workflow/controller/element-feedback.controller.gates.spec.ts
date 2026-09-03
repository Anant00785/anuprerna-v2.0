/**
 * src/commerce/workflow/controller/element-feedback.controller.gates.spec.ts
 *
 * Authorization regression tests for ElementFeedbackController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ElementFeedbackController } from "./element-feedback.controller.js";

describeGates(
  "ElementFeedbackController",
  ElementFeedbackController as never,
  [
    ["getElementFeedback", GateCode.CODE_CU],
    ["addElementFeedback", GateCode.CODE_SU],
    ["updateElementFeedback", GateCode.CODE_SU],
  ],
  [],
);
