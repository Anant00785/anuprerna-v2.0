/**
 * src/auth/controller/auth.controller.gates.spec.ts
 *
 * Authorization regression tests for AuthController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../types/auth.types.js";
import { AuthController } from "./auth.controller.js";

describeGates(
  "AuthController",
  AuthController as never,
  [
    ["getAuthorityToken", GateCode.CODE_SUCU],
  ],
  // validateProvider is PUBLIC — same Loom handler as the legacy-path twin
  // (NverseAuthenticationController.validateProvider, plain @RequestBody, no gate),
  // and it is called before any token exists.
  ["validateProvider", "authenticateWithEmail", "registerUser", "registerUserEmail", "registerUserSocial", "authenticateWithSocial"],
);
