/**
 * src/commerce/misc/misc.controller.gates.spec.ts
 *
 * Authorization regression tests for MiscController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { MiscController } from "./misc.controller.js";

describeGates(
  "MiscController",
  MiscController as never,
  [],
  // Both are PUBLIC: Loom's MiscController.sendContactUsEmail() has no
  // getEntity/postEntity gate, and the storefront /contact form posts anonymously.
  ["sendContactUs", "submitContactUs"],
);
