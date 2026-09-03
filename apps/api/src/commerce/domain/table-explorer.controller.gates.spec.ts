/**
 * src/commerce/domain/table-explorer.controller.gates.spec.ts
 *
 * Authorization regression tests for TableExplorerDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { TableExplorerDomainController } from "./table-explorer.controller.js";

describeGates(
  "TableExplorerDomainController",
  TableExplorerDomainController as never,
  [
    ["get_get_data_dump_tenant", GateCode.CODE_SU],
    ["get_get_table_explorer_data_loom_tenant_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_color_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_element_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_authentication_log_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_log_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_verification_token_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_warehouse_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_authentication_log", GateCode.CODE_SU],
    ["get_get_table_explorer_data_color", GateCode.CODE_SU],
    ["get_get_table_explorer_data_cron_job_log_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_cron_job_log", GateCode.CODE_SU],
    ["get_get_table_explorer_data_element", GateCode.CODE_SU],
    ["get_get_table_explorer_data_inventory_adjustment_item", GateCode.CODE_SU],
    ["get_get_table_explorer_data_inventory_adjustment_reason_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_inventory_restock_request_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_log", GateCode.CODE_SU],
    ["get_get_table_explorer_data_loom_tenant", GateCode.CODE_SU],
    ["get_get_table_explorer_data_purchase_order_feedback_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_purchase_order_feedback", GateCode.CODE_SU],
    ["get_get_table_explorer_data_skill_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_skill", GateCode.CODE_SU],
    ["get_get_table_explorer_data_sub_process_element", GateCode.CODE_SU],
    ["get_get_table_explorer_data_verification_token", GateCode.CODE_SU],
    ["get_get_table_explorer_tables", GateCode.CODE_SU],
  ],
  [],
);
