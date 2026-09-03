/**
 * src/commerce/domain/loyalty-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for LoyaltyMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { LoyaltyMigratedDomainController } from "./loyalty-migrated.controller.js";

describeGates(
  "LoyaltyMigratedDomainController",
  LoyaltyMigratedDomainController as never,
  [
    ["post_enable_loyalty_program", GateCode.CODE_SU],
  ],
  [],
);
