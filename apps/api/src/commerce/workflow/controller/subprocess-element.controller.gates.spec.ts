/**
 * src/commerce/workflow/controller/subprocess-element.controller.gates.spec.ts
 *
 * Authorization regression tests for SubProcessElementController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SubProcessElementController } from "./subprocess-element.controller.js";

describeGates(
  "SubProcessElementController",
  SubProcessElementController as never,
  [
    ["updateSubProcessElement", GateCode.CODE_SU],
  ],
  [],
);
