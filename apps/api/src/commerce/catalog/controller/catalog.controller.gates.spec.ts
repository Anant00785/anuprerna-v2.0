/**
 * src/commerce/catalog/controller/catalog.controller.gates.spec.ts
 *
 * Authorization regression tests for CatalogApiController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CatalogApiController } from "./catalog.controller.js";

describeGates(
  "CatalogApiController",
  CatalogApiController as never,
  [
    ["getCatalog", GateCode.CODE_SU],
    ["getCatalogList", GateCode.CODE_SUCU],
    ["getCatalogListByArtisan", GateCode.CODE_SUCU],
    ["getArtisanCatalog", GateCode.CODE_AR],
    ["getArtisanCatalogList", GateCode.CODE_AR],
    ["getRecentCatalogList", GateCode.CODE_SUCU],
    ["addCatalog", GateCode.CODE_SU],
    ["addArtisanCatalog", GateCode.CODE_AR],
    ["updateCatalog", GateCode.CODE_SU],
    ["updateArtisanCatalog", GateCode.CODE_AR],
    ["deleteCatalog", GateCode.CODE_SU],
    ["deleteArtisanCatalog", GateCode.CODE_AR],
  ],
  [],
);
