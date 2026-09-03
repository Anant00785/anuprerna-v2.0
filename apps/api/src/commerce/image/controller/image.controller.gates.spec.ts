/**
 * src/commerce/image/controller/image.controller.gates.spec.ts
 *
 * Authorization regression tests for ImageController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ImageController } from "./image.controller.js";

describeGates(
  "ImageController",
  ImageController as never,
  [
    ["uploadImage", GateCode.CODE_SU],
    ["deleteImage", GateCode.CODE_SU],
  ],
  [],
);
