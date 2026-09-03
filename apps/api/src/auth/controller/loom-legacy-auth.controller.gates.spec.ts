/**
 * src/auth/controller/loom-legacy-auth.controller.gates.spec.ts
 *
 * Authorization regression tests for LoomLegacyAuthController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../types/auth.types.js";
import { LoomLegacyAuthController } from "./loom-legacy-auth.controller.js";

describeGates(
  "LoomLegacyAuthController",
  LoomLegacyAuthController as never,
  [
    ["getAuthorityTokenGet", GateCode.CODE_SUCU],
    ["authorityTokenGet", GateCode.CODE_SUCU],
    ["getAuthorityTokenPost", GateCode.CODE_SUCU],
    ["authorityTokenPost", GateCode.CODE_SUCU],
  ],
  // validateProvider / verifyOtp / confirmVerificationEmail are PUBLIC in Loom
  // (plain @RequestBody handlers, no getEntity/postEntity/CODE_*) and are all
  // PRE-SESSION by construction — verifyOtp even mints the JWT. Gating them is a
  // bootstrap paradox and breaks the anonymous storefront callers.
  ["validateProvider", "verifyOtp", "confirmVerificationEmail", "authenticateEmail", "authenticateSocial", "registerEmail", "customerRegisterEmail", "registerSocial", "customerRegisterSocial", "sendOtp", "resendOtp", "verificationToken", "sendVerificationEmail", "sendPasswordResetEmail", "resetPassword", "checkEmailTenantGet", "checkEmailTenantPost"],
);
