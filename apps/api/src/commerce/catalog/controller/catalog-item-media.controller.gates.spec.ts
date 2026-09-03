/**
 * src/commerce/catalog/controller/catalog-item-media.controller.gates.spec.ts
 *
 * Authorization regression tests for CatalogItemMediaController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CatalogItemMediaController } from "./catalog-item-media.controller.js";

describeGates(
  "CatalogItemMediaController",
  CatalogItemMediaController as never,
  [
    ["addCatalogItemMedia", GateCode.CODE_SU],
    ["deleteCatalogItemMedia", GateCode.CODE_SU],
  ],
  [],
);
