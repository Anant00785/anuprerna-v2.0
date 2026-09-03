/**
 * src/commerce/artisanpayment/controller/artisanpayment.controller.gates.spec.ts
 *
 * Authorization regression tests for ArtisanPaymentController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ArtisanPaymentController } from "./artisanpayment.controller.js";

describeGates(
  "ArtisanPaymentController",
  ArtisanPaymentController as never,
  [
    ["getPaymentRecords", GateCode.CODE_SU],
    ["getPaymentRecordById", GateCode.CODE_SU],
    ["getRecordsByArtisan", GateCode.CODE_SU],
    ["createPaymentRecord", GateCode.CODE_SU],
    ["updateStatus", GateCode.CODE_SU],
    ["getIncentiveConfigs", GateCode.CODE_SU],
  ],
  [],
);
