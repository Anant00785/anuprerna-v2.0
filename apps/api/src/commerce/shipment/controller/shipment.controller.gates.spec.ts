/**
 * src/commerce/shipment/controller/shipment.controller.gates.spec.ts
 *
 * Authorization regression tests for ShipmentController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ShipmentController } from "./shipment.controller.js";

describeGates(
  "ShipmentController",
  ShipmentController as never,
  [
    ["getShipmentList", GateCode.CODE_SUCU],
    ["getShipment", GateCode.CODE_SUCU],
    ["createShipment", GateCode.CODE_SU],
    ["updateShipment", GateCode.CODE_SU],
    ["deleteShipment", GateCode.CODE_SU],
    ["getShipmentData", GateCode.CODE_SU],
    ["getShipmentDataById", GateCode.CODE_SU],
  ],
  [],
);
