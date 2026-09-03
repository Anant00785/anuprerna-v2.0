/**
 * src/commerce/seo/controller/seo.controller.gates.spec.ts
 *
 * Authorization regression tests for SeoController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SeoController } from "./seo.controller.js";

describeGates(
  "SeoController",
  SeoController as never,
  [
    ["getProductSeoList", GateCode.CODE_SU],
    ["getArticleSeoList", GateCode.CODE_SU],
    ["getProductImageGallerySEOData", GateCode.CODE_SU],
    ["updateGalleryImages", GateCode.CODE_SUCU],
  ],
  ["getFilterSeo", "getProductImageSitemapData", "getEnabledProductImageSitemapData"],
);
