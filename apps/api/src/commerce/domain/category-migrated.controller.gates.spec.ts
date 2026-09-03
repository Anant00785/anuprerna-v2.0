/**
 * src/commerce/domain/category-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for CategoryMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { CategoryMigratedDomainController } from "./category-migrated.controller.js";

describeGates(
  "CategoryMigratedDomainController",
  CategoryMigratedDomainController as never,
  [
    ["get_get_category_list", GateCode.CODE_SU],
    ["get_get_table_explorer_data_blog_content_category_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_story_content_category_id", GateCode.CODE_SU],
  ],
  ["get_get_product_preview_list_category"],
);
