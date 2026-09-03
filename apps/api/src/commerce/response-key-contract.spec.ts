/**
 * Response-KEY contract, per path.
 *
 * apps/storefront/src/lib/loom/public-route-contract.test.ts guards which routes
 * are gated. Nothing guarded the top-level key each route emits, so a batch of
 * routes shipped emitting `entityList` / `storyContents` / `blogContents` /
 * `settings` while the storefront read `colorList` / `storyContentList` /
 * `blogContentList` / `settingsList` — every one of them rendered EMPTY with no
 * error. Each expectation below was verified against legacy Loom
 * (https://loom-v2.anuprerna.com) with `Origin: https://anuprerna.com`.
 *
 * This is a source-level assertion (no DB / no HTTP): it reads the controller
 * file and checks the keyedResponse(...) call inside the handler for the route.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const HERE = resolve(__dirname);

/** [controller file, route path, expected top-level key] */
const KEY_CONTRACT: ReadonlyArray<readonly [string, string, string]> = [
  ["settings/controller/settings.controller.ts", "get/settings-list", "settingsList"],
  ["color/controller/color.controller.ts", "/get/color-list", "colorList"],

  ["content/story/controller/story.controller.ts", "/get/story-content-list", "storyContentList"],
  ["content/story/controller/story.controller.ts", "/get/story-content-list/csv/:commaSeparatedIDList", "storyContentList"],
  ["content/story/controller/story.controller.ts", "/get/stories/:storyId/recommended", "storyContentList"],
  ["content/story/controller/story.controller.ts", "/get/stories/category/:storyCategoryId", "storyContentList"],
  ["content/story/controller/story.controller.ts", "/get/story/related/product/:productId", "storyContentList"],
  ["content/story/controller/story.controller.ts", "/get/story/product-previews/:storyContentId", "storyProductMapping"],

  ["content/blog/controller/blog.controller.ts", "/get/blog-content-list", "blogContentList"],
  ["content/blog/controller/blog.controller.ts", "/get/blog-content-list/customer", "blogContentList"],
  ["content/blog/controller/blog.controller.ts", "/get/blog-content-list/csv/:commaSeparatedIDList", "blogContentList"],
  ["content/blog/controller/blog.controller.ts", "/get/blogs/:blogId/recommended", "blogContentList"],
  ["content/blog/controller/blog.controller.ts", "/get/blogs/category/:blogCategoryId", "blogContentList"],

  ["search/controller/search.controller.ts", "/get/search/result/:keyword", "productPreviewList"],
  ["search/controller/search.controller.ts", "/search/ai/:keyword", "searchResult"],
  ["search/controller/search.controller.ts", "/search/ai/story/:keyword", "storyContentList"],
  ["search/controller/search.controller.ts", "/search/ai/blog/:keyword", "blogContentList"],
];

/** The first keyedResponse(...) key emitted by the handler declared for `route`. */
function responseKeyFor(file: string, route: string): string | null {
  const src = readFileSync(resolve(HERE, file), "utf8");
  const decorator = src.indexOf(`@Get("${route}")`) >= 0 ? `@Get("${route}")` : `@Get('${route}')`;
  const start = src.indexOf(decorator);
  if (start < 0) return null;
  // Handler body ends where the next route decorator begins.
  const rest = src.slice(start + decorator.length);
  const next = rest.search(/@(?:Get|Post|Put|Patch|Delete)\(/);
  const body = next < 0 ? rest : rest.slice(0, next);
  const m = body.match(/keyedResponse\(\s*["'`]([^"'`]+)["'`]/);
  return m ? m[1] : null;
}

describe("response-key contract (legacy Loom parity)", () => {
  for (const [file, route, key] of KEY_CONTRACT) {
    it(`${route} emits "${key}"`, () => {
      expect(responseKeyFor(file, route)).toBe(key);
    });
  }
});
