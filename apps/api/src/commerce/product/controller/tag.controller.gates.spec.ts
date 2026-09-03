/**
 * src/commerce/product/controller/tag.controller.gates.spec.ts
 *
 * Authorization regression tests for TagController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { TagController } from "./tag.controller.js";

describeGates(
  "TagController",
  TagController as never,
  [
    ["getTagList", GateCode.CODE_SUCU],
    ["getTagsByIds", GateCode.CODE_SUCU],
    ["getTagById", GateCode.CODE_SU],
    ["createNewTag", GateCode.CODE_SU],
    ["updateTag", GateCode.CODE_SU],
    ["getTagData", GateCode.CODE_SU],
    ["getTagDataById", GateCode.CODE_SU],
  ],
  [],
);
