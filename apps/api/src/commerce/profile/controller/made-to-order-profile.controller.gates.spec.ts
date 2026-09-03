/**
 * src/commerce/profile/controller/made-to-order-profile.controller.gates.spec.ts
 *
 * Authorization regression tests for MadeToOrderProfileController.
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
import { MadeToOrderProfileController } from "./made-to-order-profile.controller.js";

describeGates(
  "MadeToOrderProfileController",
  MadeToOrderProfileController as never,
  [
    ["getMadeToOrderProfileList", GateCode.CODE_SU],
    ["getMadeToOrderProfile", GateCode.CODE_SU],
    ["addMadeToOrderProfile", GateCode.CODE_SU],
    ["updateMadeToOrderProfile", GateCode.CODE_SU],
    ["deleteMadeToOrderProfile", GateCode.CODE_SU],
    ["exploreMadeToOrderProfile", GateCode.CODE_SU],
    ["exploreMadeToOrderProfileById", GateCode.CODE_SU],
  ],
  [],
);
