/**
 * src/commerce/catalog/controller/catalog-pdf.controller.gates.spec.ts
 *
 * Authorization regression tests for CatalogPdfController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CatalogPdfController } from "./catalog-pdf.controller.js";

describeGates(
  "CatalogPdfController",
  CatalogPdfController as never,
  [
    ["addArtisanCatalogPdfGeneration", GateCode.CODE_AR],
    ["getArtisanCatalogPdfGenerationList", GateCode.CODE_AR],
    ["getArtisanCatalogPdfGeneration", GateCode.CODE_AR],
    ["waitArtisanCatalogPdfGeneration", GateCode.CODE_AR],
    ["addCatalogPdfGenerationByArtisan", GateCode.CODE_SU],
    ["getCatalogPdfGenerationListByArtisan", GateCode.CODE_SU],
    ["getCatalogPdfGeneration", GateCode.CODE_SU],
    ["waitCatalogPdfGeneration", GateCode.CODE_SU],
  ],
  [],
);
