/**
 * src/commerce/product/controller/special-status.controller.gates.spec.ts
 *
 * Authorization regression tests for SpecialStatusController.
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
import { SpecialStatusController } from "./special-status.controller.js";

describeGates(
  "SpecialStatusController",
  SpecialStatusController as never,
  [
    ["createNewSpecialStatus", GateCode.CODE_SU],
    ["updateSpecialStatus", GateCode.CODE_SU],
    ["deleteSpecialStatus", GateCode.CODE_SU],
    ["getSpecialStatusData", GateCode.CODE_SU],
    ["getSpecialStatusDataById", GateCode.CODE_SU],
  ],
  [],
);
