/**
 * src/commerce/nverse/controller/nverse.controller.gates.spec.ts
 *
 * Authorization regression tests for NVerseController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { NVerseController } from "./nverse.controller.js";

describeGates(
  "NVerseController",
  NVerseController as never,
  [
    ["getVerificationTokens", GateCode.CODE_SU],
    ["getVerificationTokenById", GateCode.CODE_SU],
  ],
  // Deliberately public: these are the token-minting endpoints (Loom's
  // OTPController uses postEntityUnauthorized / a bare @PostMapping), the same
  // shape as the public POST /auth/authenticate. Their safety comes from
  // NVerseService + Msg91OtpService, pinned in nverse.service.spec.ts,
  // msg91-otp.service.spec.ts and commerce.module.spec.ts — not from a gate.
  ["login", "sendOtp", "resendOtp", "verifyOtp", "verifyEmail"],
);
