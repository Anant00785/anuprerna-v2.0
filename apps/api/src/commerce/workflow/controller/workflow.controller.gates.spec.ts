/**
 * src/commerce/workflow/controller/workflow.controller.gates.spec.ts
 *
 * Authorization regression tests for WorkflowController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { WorkflowController } from "./workflow.controller.js";

describeGates(
  "WorkflowController",
  WorkflowController as never,
  [
    ["getWorkflowTemplateList", GateCode.CODE_SU],
    ["getWorkflowTemplate", GateCode.CODE_SU],
    ["addWorkflowTemplate", GateCode.CODE_SU],
    ["updateWorkflowTemplate", GateCode.CODE_SU],
    ["deleteWorkflowTemplate", GateCode.CODE_SU],
    ["exploreWorkflowTemplates", GateCode.CODE_SU],
    ["getWorkflowList", GateCode.CODE_SU],
    ["getWorkflow", GateCode.CODE_SU],
    ["addWorkflow", GateCode.CODE_SU],
    ["updateWorkflow", GateCode.CODE_SU],
    ["deleteWorkflow", GateCode.CODE_SU],
  ],
  [],
);
