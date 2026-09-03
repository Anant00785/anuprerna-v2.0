/**
 * src/commerce/domain/artisan-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for ArtisanMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { ArtisanMigratedDomainController } from "./artisan-migrated.controller.js";

describeGates(
  "ArtisanMigratedDomainController",
  ArtisanMigratedDomainController as never,
  [
    ["get_get_artisans", GateCode.CODE_SU],
    ["get_get_workers", GateCode.CODE_SU],
    ["get_get_artisan_masterId_workers", GateCode.CODE_SU],
    ["get_get_artisan_artisanId", GateCode.CODE_SU],
    ["post_add_artisan", GateCode.CODE_SU],
    ["patch_update_artisan", GateCode.CODE_SU],
    ["delete_delete_artisan_artisanId", GateCode.CODE_SU],
    ["get_get_artisan_incentive_config", GateCode.CODE_SU],
    ["patch_update_artisan_incentive_config", GateCode.CODE_SU],
    ["get_get_artisan_workflow_dashboard", GateCode.CODE_SU],
    ["get_get_artisan_workflow_workflowId_assigned_element_de", GateCode.CODE_SU],
    ["get_get_artisan_workflow_workflowId_assigned_element_details", GateCode.CODE_SU],
    ["get_get_master_masterId_worker_artisanId_bpm_details", GateCode.CODE_SU],
    ["get_get_master_masterId_worker_artisanId_workflow_workflowId", GateCode.CODE_SU],
    ["get_get_master_masterId_worker_artisanId_workflow_workflowId_assigned_element_details", GateCode.CODE_SU],
    ["get_get_step_element_stepId_artisan_assignments", GateCode.CODE_SU],
    ["patch_update_step_element_artisan_assignments", GateCode.CODE_SU],
    ["get_get_subprocess_element_subProcessId_artisan_assign", GateCode.CODE_SU],
    ["get_get_subprocess_element_subProcessId_artisan_assignments", GateCode.CODE_SU],
    ["patch_update_subprocess_element_artisan_assignments", GateCode.CODE_SU],
    ["get_get_table_explorer_data_artisan_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_artisan", GateCode.CODE_SU],
    ["get_get_table_explorer_data_step_element_artisan_mapping", GateCode.CODE_SU],
    ["get_get_table_explorer_data_subprocess_element_artisan_mapping", GateCode.CODE_SU],
    ["get_get_table_explorer_data_workflow_artisan_mapping", GateCode.CODE_SU],
    ["post_add_skill", GateCode.CODE_SU],
    ["post_update_skill", GateCode.CODE_SU],
    ["delete_delete_skill", GateCode.CODE_SU],
  ],
  [],
);
