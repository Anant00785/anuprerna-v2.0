/**
 * src/commerce/whatsapp/controller/whatsapp.controller.gates.spec.ts
 *
 * Authorization regression tests for WhatsappController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { WhatsappController } from "./whatsapp.controller.js";

describeGates(
  "WhatsappController",
  WhatsappController as never,
  [
    ["optIn", GateCode.CODE_CU],
    ["optOut", GateCode.CODE_CU],
    ["dismiss", GateCode.CODE_CU],
    ["getStatus", GateCode.CODE_SU],
    ["getHistoryData", GateCode.CODE_SU],
    ["getHistoryDataById", GateCode.CODE_SU],
  ],
  [],
);
