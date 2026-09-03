/**
 * src/commerce/content/story/controller/story.controller.gates.spec.ts
 *
 * Authorization regression tests for StoryController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../../common/testing/gate-spec.js";
import { GateCode } from "../../../../auth/types/auth.types.js";
import { StoryController } from "./story.controller.js";

describeGates(
  "StoryController",
  StoryController as never,
  [
    ["getStoryContentCategoryList", GateCode.CODE_SU],
    ["addStoryContentCategory", GateCode.CODE_SU],
    ["updateStoryContentCategory", GateCode.CODE_SU],
    ["addStoryContent", GateCode.CODE_SU],
    ["updateStoryContent", GateCode.CODE_SU],
    ["deleteStoryContent", GateCode.CODE_SU],
    ["addStoryContentSection", GateCode.CODE_SU],
    ["updateStoryContentSection", GateCode.CODE_SU],
    ["deleteStoryContentSection", GateCode.CODE_SU],
    ["addStoryProductMapping", GateCode.CODE_SU],
    ["updateStoryProductMapping", GateCode.CODE_SU],
    ["getTableExplorerStoryContent", GateCode.CODE_SU],
    ["getTableExplorerStoryContentSection", GateCode.CODE_SU],
    ["getTableExplorerStoryContentCategory", GateCode.CODE_SU],
    ["getTableExplorerStoryProductMapping", GateCode.CODE_SU],
  ],
  ["getStoryContentList", "getStoryContent", "getStoryContentBySlug", "getRecommendedStories", "getStoriesByCategory", "getStoryContentListCsv", "getStoryRelatedToProduct", "getProductsRelatedToStory", "getStoryProducts", "getStoryProductPreviews"],
);
