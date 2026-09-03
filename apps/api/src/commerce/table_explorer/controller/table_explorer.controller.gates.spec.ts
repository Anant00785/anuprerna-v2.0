/**
 * src/commerce/table_explorer/controller/table_explorer.controller.gates.spec.ts
 *
 * Authorization regression tests for TableExplorerController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { TableExplorerController } from "./table_explorer.controller.js";

describeGates(
  "TableExplorerController",
  TableExplorerController as never,
  [
    ["getTableData", GateCode.CODE_SU],
    ["getTableRowById", GateCode.CODE_SU],
  ],
  [],
);
