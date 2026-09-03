/**
 * src/commerce/product/controller/sku-group.controller.gates.spec.ts
 *
 * Authorization regression tests for SkuGroupController.
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
import { SkuGroupController } from "./sku-group.controller.js";

describeGates(
  "SkuGroupController",
  SkuGroupController as never,
  [
    ["createNewSkuGroup", GateCode.CODE_SU],
    ["updateSkuGroup", GateCode.CODE_SU],
    ["deleteSkuGroup", GateCode.CODE_SU],
    ["getSkuGroupData", GateCode.CODE_SU],
    ["getSkuGroupDataById", GateCode.CODE_SU],
  ],
  [],
);
