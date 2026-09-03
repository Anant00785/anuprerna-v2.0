/**
 * src/commerce/domain/workflow-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for WorkflowMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { WorkflowMigratedDomainController } from "./workflow-migrated.controller.js";

describeGates(
  "WorkflowMigratedDomainController",
  WorkflowMigratedDomainController as never,
  [
    ["post_add_step_element_template", GateCode.CODE_SU],
    ["patch_update_step_element_template", GateCode.CODE_SU],
    ["delete_delete_step_element_template_templateId", GateCode.CODE_SU],
    ["post_add_subprocess_element_template", GateCode.CODE_SU],
    ["patch_update_subprocess_element_template", GateCode.CODE_SU],
    ["delete_delete_subprocess_element_template_templateId", GateCode.CODE_SU],
    ["get_get_element_feedback", GateCode.CODE_SU],
    ["patch_update_element_feedback_admin", GateCode.CODE_SU],
    ["get_get_table_explorer_data_element_template_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_step_element_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_step_element_template_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_element_feedback_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_workflow_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_workflow_template_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_workflow_custom_order_mapping_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_element_feedback", GateCode.CODE_SU],
    ["get_get_table_explorer_data_element_template", GateCode.CODE_SU],
    ["get_get_table_explorer_data_step_element_template", GateCode.CODE_SU],
    ["get_get_table_explorer_data_step_element", GateCode.CODE_SU],
    ["get_get_table_explorer_data_subprocess_element_template", GateCode.CODE_SU],
    ["get_get_table_explorer_data_workflow_custom_order_mapping", GateCode.CODE_SU],
    ["get_get_table_explorer_data_workflow", GateCode.CODE_SU],
  ],
  [],
);
