/**
 * SearchRepository — the storefront search box (/search) fans out across
 * products/blogs/stories. No tenant scoping applies (catalog is global);
 * the risk here is a DB failure quietly returning an empty result set.
 */
import { describe, it, expect, vi } from "vitest";
import { SearchRepository } from "./search.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

function chainDb(rows: unknown[]) {
  const limit = vi.fn(() => Promise.resolve(rows));
  const where = vi.fn(() => ({ limit }));
  const leftJoin = vi.fn(() => ({ where }));
  const from = vi.fn(() => ({ where, leftJoin }));
  const select = vi.fn(() => ({ from }));
  return { select, limit };
}

function failingChainDb() {
  const limit = vi.fn(() => Promise.reject(BOOM));
  const where = vi.fn(() => ({ limit }));
  const leftJoin = vi.fn(() => ({ where }));
  const from = vi.fn(() => ({ where, leftJoin }));
  const select = vi.fn(() => ({ from }));
  return { select };
}

describe("SearchRepository.searchProducts", () => {
  it("caps results at 150 and maps nullable image/altText fields", async () => {
    const row = {
      id: 1n, sku: "S1", name: "Silk", heroImage: null, hoverImage: null,
      heroImageAltText: null, hoverImageAltText: null, slug: "silk",
      productGroup: "fabric", price: "199.99", unit: "METER", specialStatus: null,
    };
    const { select, limit } = chainDb([row]);
    const repo = new SearchRepository({ select } as never);
    const result = await repo.searchProducts("silk");
    expect(result).toEqual([
      { id: 1n, sku: "S1", name: "Silk", heroImage: "", hoverImage: "", heroImageAltText: "", hoverImageAltText: "",
        slug: "silk", productGroup: "fabric", price: 199.99, specialStatus: null, unit: "METER" },
    ]);
    expect(limit).toHaveBeenCalledWith(150);
  });

  it("no matches is still [], a query failure propagates instead of an empty results page", async () => {
    const ok = new SearchRepository({ select: chainDb([]).select } as never);
    await expect(ok.searchProducts("nonexistent")).resolves.toEqual([]);

    const bad = new SearchRepository({ select: failingChainDb().select } as never);
    await expect(bad.searchProducts("silk")).rejects.toThrow(BOOM);
  });
});

describe("SearchRepository.searchBlogs / searchStories", () => {
  function limitOnlyDb(rows: unknown[] | (() => never)) {
    const limit = vi.fn(() => (typeof rows === "function" ? Promise.reject(BOOM) : Promise.resolve(rows)));
    const where = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    return { select };
  }

  it("searchBlogs: stringifies bigint id, a query failure propagates", async () => {
    const row = { id: 5n, title: "T", description: "D", slug: "s", bannerImageDesktop: "b.jpg", readingTime: 3, timeOfCreation: 1000n };
    const ok = new SearchRepository({ select: limitOnlyDb([row]).select } as never);
    await expect(ok.searchBlogs("x")).resolves.toEqual([{ ...row, id: "5", timeOfCreation: 1000 }]);

    const bad = new SearchRepository({ select: limitOnlyDb(() => { throw BOOM; }).select } as never);
    await expect(bad.searchBlogs("x")).rejects.toThrow(BOOM);
  });

  it("searchStories: no matches is still [], a query failure propagates", async () => {
    const ok = new SearchRepository({ select: limitOnlyDb([]).select } as never);
    await expect(ok.searchStories("x")).resolves.toEqual([]);

    const bad = new SearchRepository({ select: limitOnlyDb(() => { throw BOOM; }).select } as never);
    await expect(bad.searchStories("x")).rejects.toThrow(BOOM);
  });
});
