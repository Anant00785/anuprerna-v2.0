/**
 * src/commerce/product/controller/product-size-profile.controller.gates.spec.ts
 *
 * Authorization regression tests for ProductSizeProfileController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ProductSizeProfileController } from "./product-size-profile.controller.js";

describeGates(
  "ProductSizeProfileController",
  ProductSizeProfileController as never,
  [
    ["getConsumedFabricForImpact", GateCode.CODE_SU],
    ["getProductSizeProfileBySizeOption", GateCode.CODE_SU],
    ["deleteProductSizeProfileBySizeOption", GateCode.CODE_SU],
    ["getProductSizeProfileData", GateCode.CODE_SU],
    ["getProductSizeProfileDataById", GateCode.CODE_SU],
    ["getProductSizeProfile", GateCode.CODE_SU],
    ["createProductSizeProfile", GateCode.CODE_SU],
    ["updateProductSizeProfile", GateCode.CODE_SU],
    ["deleteProductSizeProfile", GateCode.CODE_SU],
  ],
  [],
);
