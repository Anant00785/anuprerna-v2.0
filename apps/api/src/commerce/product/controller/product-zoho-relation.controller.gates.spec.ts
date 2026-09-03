/**
 * src/commerce/product/controller/product-zoho-relation.controller.gates.spec.ts
 *
 * Authorization regression tests for ProductZohoRelationController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ProductZohoRelationController } from "./product-zoho-relation.controller.js";

describeGates(
  "ProductZohoRelationController",
  ProductZohoRelationController as never,
  [
    ["getProductZohoRelation", GateCode.CODE_SU],
    ["createProductZohoRelation", GateCode.CODE_SU],
    ["updateProductZohoRelation", GateCode.CODE_SU],
    ["deleteProductZohoRelation", GateCode.CODE_SU],
    ["getByProductAndSku", GateCode.CODE_SU],
    ["getByZohoItemIdAndSku", GateCode.CODE_SU],
    ["getByZohoItemId", GateCode.CODE_SU],
    ["getActiveWithActiveProduct", GateCode.CODE_SU],
    ["getStreamAllByFinishedProduct", GateCode.CODE_SU],
    ["getStreamAllByFabricProduct", GateCode.CODE_SU],
    ["getProductZohoRelationData", GateCode.CODE_SU],
    ["getProductZohoRelationDataById", GateCode.CODE_SU],
  ],
  [],
);
