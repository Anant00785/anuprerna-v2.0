/**
 * src/commerce/content/blog/controller/blog.controller.gates.spec.ts
 *
 * Authorization regression tests for BlogController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../../common/testing/gate-spec.js";
import { GateCode } from "../../../../auth/types/auth.types.js";
import { BlogController } from "./blog.controller.js";

describeGates(
  "BlogController",
  BlogController as never,
  [
    ["getBlogContentTypes", GateCode.CODE_SUCU],
    ["addBlogContentType", GateCode.CODE_SU],
    ["updateBlogContentType", GateCode.CODE_SU],
    ["getBlogContentCategoryList", GateCode.CODE_SU],
    ["addBlogContentCategory", GateCode.CODE_SU],
    ["updateBlogContentCategory", GateCode.CODE_SU],
    ["addBlogContent", GateCode.CODE_SU],
    ["updateBlogContent", GateCode.CODE_SU],
    ["deleteBlogContent", GateCode.CODE_SU],
    ["addBlogContentSection", GateCode.CODE_SU],
    ["updateBlogContentSection", GateCode.CODE_SU],
    ["deleteBlogContentSection", GateCode.CODE_SU],
    ["getTableExplorerBlogContent", GateCode.CODE_SU],
    ["getTableExplorerBlogContentSection", GateCode.CODE_SU],
    ["getTableExplorerBlogContentCategory", GateCode.CODE_SU],
    ["getTableExplorerBlogContentType", GateCode.CODE_SU],
  ],
  ["getBlogContentList", "getCustomerBlogContentList", "getRecommendedBlogs", "getBlogsByCategory", "getBlogContent", "getBlogContentBySlug", "getBlogContentListCsv"],
);
