/**
 * src/commerce/catalog/controller/catalog-item.controller.gates.spec.ts
 *
 * Authorization regression tests for CatalogItemController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CatalogItemController } from "./catalog-item.controller.js";

describeGates(
  "CatalogItemController",
  CatalogItemController as never,
  [
    ["getCatalogItem", GateCode.CODE_SU],
    ["getCatalogItemList", GateCode.CODE_SUCU],
    ["getArtisanCatalogItem", GateCode.CODE_AR],
    ["addCatalogItem", GateCode.CODE_SU],
    ["addArtisanCatalogItem", GateCode.CODE_AR],
    ["updateCatalogItem", GateCode.CODE_SU],
    ["updateArtisanCatalogItem", GateCode.CODE_AR],
    ["deleteCatalogItem", GateCode.CODE_SU],
    ["deleteArtisanCatalogItemMedia", GateCode.CODE_AR],
  ],
  [],
);
