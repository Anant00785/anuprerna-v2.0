/**
 * src/commerce/domain/catalog-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for CatalogMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { CatalogMigratedDomainController } from "./catalog-migrated.controller.js";

describeGates(
  "CatalogMigratedDomainController",
  CatalogMigratedDomainController as never,
  [
    ["delete_delete_artisan_catalog_item_catalogItemId", GateCode.CODE_SU],
    ["get_get_table_explorer_data_catalog_item_media_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_catalog_item_media", GateCode.CODE_SU],
    ["get_get_table_explorer_data_catalog_item", GateCode.CODE_SU],
    ["get_get_table_explorer_data_catalog_pdf", GateCode.CODE_SU],
    ["get_get_table_explorer_data_catalog", GateCode.CODE_SU],
  ],
  [],
);
