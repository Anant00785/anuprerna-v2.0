/**
 * src/commerce/inventory/controller/inventory.controller.gates.spec.ts
 *
 * Authorization regression tests for InventoryController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { InventoryController } from "./inventory.controller.js";

describeGates(
  "InventoryController",
  InventoryController as never,
  [
    ["getWarehouseById", GateCode.CODE_SU],
    ["getWarehouse", GateCode.CODE_SU],
    ["addWarehouse", GateCode.CODE_SU],
    ["updateWarehouse", GateCode.CODE_SU],
    ["getReasonById", GateCode.CODE_SU],
    ["getReasons", GateCode.CODE_SU],
    ["addReason", GateCode.CODE_SU],
    ["updateReason", GateCode.CODE_SU],
    ["getAdjustmentById", GateCode.CODE_SU],
    ["getAdjustments", GateCode.CODE_SU],
    ["addAdjustment", GateCode.CODE_SU],
    ["getRestockRequests", GateCode.CODE_SU],
    ["addRestockRequest", GateCode.CODE_SUCU],
    ["updateRestockRequestQuantity", GateCode.CODE_SU],
    ["updateRestockRequestStatus", GateCode.CODE_SU],
    ["deleteRestockRequest", GateCode.CODE_SU],
    ["getTableExplorerWarehouse", GateCode.CODE_SU],
    ["getTableExplorerAdjustment", GateCode.CODE_SU],
    ["getTableExplorerReason", GateCode.CODE_SU],
    ["getTableExplorerRestockRequest", GateCode.CODE_SU],
  ],
  [],
);
