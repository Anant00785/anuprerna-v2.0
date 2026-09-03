/**
 * src/commerce/product/controller/fabric-product.controller.gates.spec.ts
 *
 * Authorization regression tests for FabricProductController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { FabricProductController } from "./fabric-product.controller.js";

describeGates(
  "FabricProductController",
  FabricProductController as never,
  [
    ["getFabricProductBySlugV2", GateCode.CODE_SU],
    ["getFabricProductData", GateCode.CODE_SU],
    // loom FabricProductController.getFabricOverviewList -> getEntity(..., CODE_SU,
    // UNAUTH_FABRIC_OVERVIEW_LIST_REQUEST). No frontend calls it, so the gate is safe.
    ["getFabricOverviews", GateCode.CODE_SU],
    ["createFabricProduct", GateCode.CODE_SU],
    ["updateFabricProduct", GateCode.CODE_SU],
    ["disableFabricProduct", GateCode.CODE_SU],
    ["triggerZohoWorkflow", GateCode.CODE_SU],
  ],
  ["getFabricProduct", "getFabricProductBySlug", "getFabricFilterPreview", "getFabricFilterPreviewPage", "getFabricFilterPreviewByIds", "getFabricFilterPreviewFiltered"],
);
