/**
 * src/commerce/product/controller/category.controller.gates.spec.ts
 *
 * Authorization regression tests for CategoryController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CategoryController } from "./category.controller.js";

describeGates(
  "CategoryController",
  CategoryController as never,
  [
    ["getCategory", GateCode.CODE_SU],
    ["createNewCategory", GateCode.CODE_SU],
    ["updateCategory", GateCode.CODE_SU],
    ["getCategoryData", GateCode.CODE_SU],
    ["deleteCategory", GateCode.CODE_SU],
  ],
  ["getCategoryList"],
);
