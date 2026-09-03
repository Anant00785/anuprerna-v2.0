import { describe, it, expect } from "vitest";
import { SearchController } from "./search.controller.js";
import type { SearchService } from "../service/search.service.js";

// The merge into this file was mostly Swagger decoration (@ApiOperation/@ApiParam/
// @ApiExcludeEndpoint additions). The endpoints below are tested because they carry real
// logic: input validation via validateSearchTerm, and divergent error-handling between
// routes. The remaining routes (runLuceneReindexing, aiBlogSearch, aiStorySearch,
// reindexVector, reindexVector/blog, reindexVector/story) are static handlers with no
// branch and no external call — they unconditionally return a hardcoded literal — so per
// docs/TESTING.md §6 ("test what is worth protecting... writing 80 is noise") they are not
// given individual tests.

function makeController(searchService: Partial<SearchService>) {
  return new SearchController(searchService as SearchService);
}

describe("SearchController#searchProduct (legacy /get/search/result/:keyword)", () => {
  it("returns a validation error without calling the service for an empty keyword", async () => {
    let called = false;
    const controller = makeController({
      searchProduct: async () => {
        called = true;
        return [];
      },
    });
    const res = await controller.searchProduct("   ");
    expect(res).toEqual({ success: false, message: "Search term cannot be empty." });
    expect(called).toBe(false);
  });

  it("returns productPreviewList from the service on success", async () => {
    const controller = makeController({
      searchProduct: async (keyword) => {
        expect(keyword).toBe("silk");
        return [{ id: 1n } as never];
      },
    });
    const res = await controller.searchProduct("silk");
    expect(res).toEqual({ success: true, message: "", productPreviewList: [{ id: 1n }] });
  });

  // Was: "swallows a service error into an empty productPreviewList". A failed
  // search index is NOT "no matches" — it must reach the client as a 5xx and the
  // logs, not as a 200 that lies. Nest turns the rejection into a 500.
  it("propagates a service error instead of answering 200 with an empty productPreviewList", async () => {
    const controller = makeController({
      searchProduct: async () => {
        throw new Error("index down");
      },
    });
    await expect(controller.searchProduct("silk")).rejects.toThrow("index down");
  });
});

describe("SearchController#searchProductV2 (/get/v2/search/result/:keyword)", () => {
  it("returns a validation error without calling the service for a keyword >= 300 chars", async () => {
    let called = false;
    const controller = makeController({
      searchProductV2: async () => {
        called = true;
        return { product: { resultSet: [], relatedResultSet: [] } };
      },
    });
    const res = await controller.searchProductV2("a".repeat(300));
    expect(res).toEqual({ success: false, message: "Search term must be less than 300 characters." });
    expect(called).toBe(false);
  });

  it("returns the entity envelope from the service on success", async () => {
    const payload = { product: { resultSet: [{ id: 1n } as never], relatedResultSet: [] } };
    const controller = makeController({ searchProductV2: async () => payload });
    const res = await controller.searchProductV2("silk");
    expect(res).toEqual({ success: true, message: "", entity: payload });
  });

  it("BUG (inconsistent with v1): has no try/catch, so a service error propagates as a rejected promise instead of a JSON error envelope", async () => {
    // apps/api/src/commerce/search/controller/search.controller.ts:31-36 — searchProduct (v1)
    // and aiSearch both catch and return `keyedResponse("entityList", [])`; searchProductV2
    // has no try/catch at all, so on a thrown error the handler rejects and Nest returns a
    // 500 with no envelope, unlike its sibling routes. Pinning as-is; not adding a catch.
    const controller = makeController({
      searchProductV2: async () => {
        throw new Error("index down");
      },
    });
    await expect(controller.searchProductV2("silk")).rejects.toThrow("index down");
  });
});

describe("SearchController#aiSearch (/search/ai/:keyword)", () => {
  // Was: "...and swallows errors into the legacy empty searchResult shape".
  // Same reasoning: a broken vector search must not present as zero results.
  it("validates, delegates to searchService.searchProductV2, and propagates service errors", async () => {
    const badKeyword = await makeController({}).aiSearch("");
    expect(badKeyword).toEqual({ success: false, message: "Search term cannot be empty." });

    const payload = { product: { resultSet: [{ id: 2n } as never], relatedResultSet: [] } };
    const okController = makeController({ searchProductV2: async () => payload as never });
    expect(await okController.aiSearch("cotton")).toEqual({ success: true, message: "", searchResult: payload });

    const throwingController = makeController({
      searchProductV2: async () => {
        throw new Error("boom");
      },
    });
    await expect(throwingController.aiSearch("cotton")).rejects.toThrow("boom");
  });
});
