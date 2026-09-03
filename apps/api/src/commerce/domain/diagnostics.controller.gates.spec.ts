/**
 * src/commerce/domain/diagnostics.controller.gates.spec.ts
 *
 * Authorization regression tests for DiagnosticsDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { DiagnosticsDomainController } from "./diagnostics.controller.js";

describeGates(
  "DiagnosticsDomainController",
  DiagnosticsDomainController as never,
  [
    ["get_get_diagnostics_app", GateCode.CODE_SU],
    ["get_get_diagnostics_host", GateCode.CODE_SU],
    ["get_get_diagnostics_summary", GateCode.CODE_SU],
    ["get_get_diagnostics_ping", GateCode.CODE_SU],
    ["get_get_diagnostics_thread_dump", GateCode.CODE_SU],
  ],
  [],
);
