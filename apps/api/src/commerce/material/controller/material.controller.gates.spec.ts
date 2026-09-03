/**
 * src/commerce/material/controller/material.controller.gates.spec.ts
 *
 * Authorization regression tests for MaterialController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { MaterialController } from "./material.controller.js";

describeGates(
  "MaterialController",
  MaterialController as never,
  [
    ["add", GateCode.CODE_SU],
    ["update", GateCode.CODE_SU],
    ["delete", GateCode.CODE_SU],
    ["getTableExplorerData", GateCode.CODE_SU],
    ["getTableExplorerDataById", GateCode.CODE_SU],
  ],
  ["getList"],
);
