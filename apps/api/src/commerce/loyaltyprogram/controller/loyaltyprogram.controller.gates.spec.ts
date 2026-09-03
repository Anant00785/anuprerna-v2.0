/**
 * src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.gates.spec.ts
 *
 * Authorization regression tests for LoyaltyprogramController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { LoyaltyprogramController } from "./loyaltyprogram.controller.js";

describeGates(
  "LoyaltyprogramController",
  LoyaltyprogramController as never,
  [
    ["getConfig", GateCode.CODE_SU],
    ["updateConfig", GateCode.CODE_SU],
    ["getCustomerInfo", GateCode.CODE_CU],
    // loom LoyaltyProgramInfoController.getCustomerLoyaltyOrderList ->
    // getEntity(..., CODE_CU, UNAUTH_ORDER_LIST_REQUEST).
    ["getCustomerLoyaltyOrderList", GateCode.CODE_CU],
    ["exploreConfig", GateCode.CODE_SU],
    ["exploreConfigById", GateCode.CODE_SU],
    ["exploreAuditLog", GateCode.CODE_SU],
    ["exploreAuditLogById", GateCode.CODE_SU],
  ],
  [],
);
