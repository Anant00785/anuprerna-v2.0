/**
 * src/commerce/transmission/tracking.controller.gates.spec.ts
 *
 * Authorization regression tests for TrackingController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { TrackingController } from "./tracking.controller.js";

describeGates(
  "TrackingController",
  TrackingController as never,
  [
    // Re-gated: customer order tracking, scoped to the caller's own orders.
    // /track/all stays super-user only — it is the one cross-tenant view.
    ["trackByOrderId", GateCode.CODE_CU],
    ["trackByAwb", GateCode.CODE_CU],
    ["trackByBatch", GateCode.CODE_CU],
    ["getAllTracking", GateCode.CODE_SU],
  ],
  [],
);
