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

  it("returns entityList from the service on success", async () => {
    const controller = makeController({
      searchProduct: async (keyword) => {
        expect(keyword).toBe("silk");
        return [{ id: 1n } as never];
      },
    });
    const res = await controller.searchProduct("silk");
    expect(res).toEqual({ success: true, message: "", entityList: [{ id: 1n }] });
  });

  it("swallows a service error into an empty entityList rather than propagating it", async () => {
    const controller = makeController({
      searchProduct: async () => {
        throw new Error("index down");
      },
    });
    const res = await controller.searchProduct("silk");
    expect(res).toEqual({ success: true, message: "", entityList: [] });
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
  it("mirrors searchProduct: validates, delegates to searchService.searchProduct, and swallows errors into an empty entityList", async () => {
    const badKeyword = await makeController({}).aiSearch("");
    expect(badKeyword).toEqual({ success: false, message: "Search term cannot be empty." });

    const okController = makeController({ searchProduct: async () => [{ id: 2n } as never] });
    expect(await okController.aiSearch("cotton")).toEqual({ success: true, message: "", entityList: [{ id: 2n }] });

    const throwingController = makeController({
      searchProduct: async () => {
        throw new Error("boom");
      },
    });
    expect(await throwingController.aiSearch("cotton")).toEqual({ success: true, message: "", entityList: [] });
  });
});
