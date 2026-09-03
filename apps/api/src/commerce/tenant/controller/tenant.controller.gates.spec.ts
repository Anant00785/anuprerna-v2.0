/**
 * src/commerce/tenant/controller/tenant.controller.gates.spec.ts
 *
 * Authorization regression tests for TenantController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { TenantController } from "./tenant.controller.js";

describeGates(
  "TenantController",
  TenantController as never,
  [
    ["getSuperUserProfile", GateCode.CODE_SU],
    ["getTenantProfile", GateCode.CODE_SU],
    ["getCustomerProfile", GateCode.CODE_CU],
    ["updateCustomerProfile", GateCode.CODE_CU],
    ["getUserRoles", GateCode.CODE_SU],
    ["getUserRoleById", GateCode.CODE_SU],
  ],
  [],
);
