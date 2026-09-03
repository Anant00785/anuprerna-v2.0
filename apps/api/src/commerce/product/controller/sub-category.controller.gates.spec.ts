/**
 * src/commerce/product/controller/sub-category.controller.gates.spec.ts
 *
 * Authorization regression tests for SubCategoryController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SubCategoryController } from "./sub-category.controller.js";

describeGates(
  "SubCategoryController",
  SubCategoryController as never,
  [
    ["getSubCategoryData", GateCode.CODE_SU],
    ["getSubCategoryDataById", GateCode.CODE_SU],
    ["getSubCategory", GateCode.CODE_SU],
    ["createNewSubCategory", GateCode.CODE_SU],
    ["updateSubCategory", GateCode.CODE_SU],
    ["deleteSubCategory", GateCode.CODE_SU],
  ],
  // getFeaturedSubCategories is PUBLIC: Loom serves
  // GET /get/featured/{categoryName}/sub-category with no getEntity/CODE_* gate.
  ["getFeaturedSubCategories", "getSubCategoryList", "fuzzySearchSubCategories", "getSubCategoryWithRelatedEntities"],
);
