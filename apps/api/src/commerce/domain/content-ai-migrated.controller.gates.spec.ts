/**
 * src/commerce/domain/content-ai-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for ContentAiMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { ContentAiMigratedDomainController } from "./content-ai-migrated.controller.js";

describeGates(
  "ContentAiMigratedDomainController",
  ContentAiMigratedDomainController as never,
  [
    ["get_get_table_explorer_data_blog_content_type_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_blog_content_section_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_blog_vector_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_story_content_section_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_story_vector_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_story_content_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_blog_content_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_blog_vector", GateCode.CODE_SU],
    ["get_get_table_explorer_data_story_vector", GateCode.CODE_SU],
    ["get_get_ai_embedding_stats", GateCode.CODE_SU],
    ["post_reindex", GateCode.CODE_SU],
  ],
  [],
);
