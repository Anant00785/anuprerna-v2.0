/**
 * src/commerce/profile/controller/size-profile.controller.gates.spec.ts
 *
 * Authorization regression tests for SizeProfileController.
 *
 * Loom gates EVERY route on this controller at CODE_SU (each Java handler runs
 * through getEntity/postEntity with CODE_SU). The read + table-explorer routes
 * here were left ungated by the gate-coverage pass — an unauthenticated read of
 * admin catalogue configuration — and are gated now to match. No storefront or
 * CMS caller reaches them anonymously: the storefront gets this data embedded in
 * the product payload, and the CMS is session-gated in front of every route.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SizeProfileController } from "./size-profile.controller.js";

describeGates(
  "SizeProfileController",
  SizeProfileController as never,
  [
    ["getSizeProfileList", GateCode.CODE_SU],
    ["getSizeProfile", GateCode.CODE_SU],
    ["addSizeProfile", GateCode.CODE_SU],
    ["updateSizeProfile", GateCode.CODE_SU],
    ["deleteSizeProfile", GateCode.CODE_SU],
    ["exploreSizeProfile", GateCode.CODE_SU],
    ["exploreSizeProfileById", GateCode.CODE_SU],
    ["exploreSizeProfileGuide", GateCode.CODE_SU],
    ["exploreSizeProfileOption", GateCode.CODE_SU],
  ],
  [],
);
