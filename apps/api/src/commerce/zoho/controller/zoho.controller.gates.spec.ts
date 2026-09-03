/**
 * src/commerce/zoho/controller/zoho.controller.gates.spec.ts
 *
 * Authorization regression tests for ZohoController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ZohoController } from "./zoho.controller.js";

describeGates(
  "ZohoController",
  ZohoController as never,
  [
    ["syncAllProducts", GateCode.CODE_SU],
  ],
  ["handleSalesOrderWebhook", "handleBillWebhook", "handleInventoryAdjustmentWebhook", "handlePackageWebhook"],
);
