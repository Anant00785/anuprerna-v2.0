/**
 * Every gate below is the one its Java original passes to getEntity/postEntity
 * in workflow/controller/CustomWorkflowController.java:
 *
 *   retrieveWorkflow              CODE_SU
 *   retrieveWorkflowList          CODE_SU
 *   retrieveWorkflowListForArtisan CODE_AR
 *   retrieveOrderWiseWorkflowList CODE_SU
 *   retrieveOrderwiseWorkflow     CODE_CU
 *   addWorkflow                   CODE_SU
 *   updateWorkflow                CODE_SU
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CustomWorkflowController } from "./custom-workflow.controller.js";

describeGates(
  "CustomWorkflowController",
  CustomWorkflowController as never,
  [
    ["getCustomWorkflow", GateCode.CODE_SU],
    ["getCustomWorkflowList", GateCode.CODE_SU],
    ["getArtisanCustomWorkflowList", GateCode.CODE_AR],
    ["getCustomOrderWorkflowList", GateCode.CODE_SU],
    ["getOrderwiseCustomWorkflow", GateCode.CODE_CU],
    ["addCustomWorkflow", GateCode.CODE_SU],
    ["updateCustomWorkflow", GateCode.CODE_SU],
  ],
  [],
);
