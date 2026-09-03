/**
 * src/commerce/faq/controller/faq.controller.gates.spec.ts
 *
 * Authorization regression tests for FaqController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { FaqController } from "./faq.controller.js";

describeGates(
  "FaqController",
  FaqController as never,
  [
    ["getFaqList", GateCode.CODE_SU],
    ["getFaq", GateCode.CODE_SU],
    ["createFaq", GateCode.CODE_SUCU],
    ["updateFaq", GateCode.CODE_SUCU],
    ["getFaqData", GateCode.CODE_SU],
    ["getFaqById", GateCode.CODE_SU],
    ["getFaqQuestionData", GateCode.CODE_SU],
    ["getFaqQuestionById", GateCode.CODE_SU],
  ],
  [],
);
