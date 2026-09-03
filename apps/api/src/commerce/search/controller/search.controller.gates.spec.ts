/**
 * src/commerce/search/controller/search.controller.gates.spec.ts
 *
 * Authorization regression tests for SearchController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SearchController } from "./search.controller.js";

describeGates(
  "SearchController",
  SearchController as never,
  [
    ["runLuceneReindexing", GateCode.CODE_SU],
    ["reindexVector", GateCode.CODE_SU],
    ["reindexBlogVector", GateCode.CODE_SU],
    ["reindexStoryVector", GateCode.CODE_SU],
  ],
  ["searchProduct", "searchProductV2", "aiBlogSearch", "aiStorySearch", "aiSearch"],
);
