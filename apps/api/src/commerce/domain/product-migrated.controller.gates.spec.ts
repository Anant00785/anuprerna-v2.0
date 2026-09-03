/**
 * src/commerce/domain/product-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for ProductMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { ProductMigratedDomainController } from "./product-migrated.controller.js";

describeGates(
  "ProductMigratedDomainController",
  ProductMigratedDomainController as never,
  [
    ["get_check_unique_product_sku_sku", GateCode.CODE_SUCUAR],
    ["get_check_unique_product_name_name", GateCode.CODE_SUCUAR],
    ["patch_update_bulk_product_price", GateCode.CODE_SU],
    ["get_get_sku_group_list", GateCode.CODE_SUCU],
    ["get_get_special_status_list", GateCode.CODE_SUCU],
    ["get_get_tag_list", GateCode.CODE_SUCU],
    ["get_get_table_explorer_data_product_vector_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_story_product_mapping_id", GateCode.CODE_SU],
    ["post_update_story_product_relation", GateCode.CODE_SU],
    ["get_get_table_explorer_data_product_fabric", GateCode.CODE_SU],
    ["get_get_table_explorer_data_product_finished", GateCode.CODE_SU],
    ["get_get_table_explorer_data_product_vector", GateCode.CODE_SU],
  ],
  ["get_get_product_preview_list_csv_commaSeparatedCSVList", "get_get_related_products_id_csv"],
);
