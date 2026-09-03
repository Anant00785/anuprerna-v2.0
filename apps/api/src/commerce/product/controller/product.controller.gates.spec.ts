/**
 * src/commerce/product/controller/product.controller.gates.spec.ts
 *
 * Authorization regression tests for ProductController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ProductController } from "./product.controller.js";

describeGates(
  "ProductController",
  ProductController as never,
  [
    ["getProductGists", GateCode.CODE_SU],
    ["createProduct", GateCode.CODE_SU],
    ["updateProduct", GateCode.CODE_SU],
    ["deleteProduct", GateCode.CODE_SU],
    ["getProductData", GateCode.CODE_SU],
    ["getProductDataById", GateCode.CODE_SU],
  ],
  ["getProductById", "getProductBySlug", "getProductByBackwardCompatibleLink", "getProductsBySubCategoryId", "getNavMenuCraftMapping", "getNavMenuMaterialMapping", "getNavMenuPatternMapping", "getNavMenuColorMapping", "getNavMenuFinishedMapping", "getRelatedProducts", "getProduct"],
);
