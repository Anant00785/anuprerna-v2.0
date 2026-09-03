/**
 * NavigationRepository — backs the header nav on every storefront page.
 * findNavMenuCraftMapping has a genuine "no fabric rows yet" fallback to the
 * plain segment/subcategory join; the point tested here is that a DB
 * failure on the first query does NOT silently trigger that fallback path
 * (which would return unrelated data instead of failing loudly).
 */
import { describe, it, expect, vi } from "vitest";
import { NavigationRepository } from "./navigation.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("NavigationRepository.findNavMenuCraftMapping", () => {
  it("uses the primary fabric-scoped rows when present", async () => {
    const primary = [{ segmentCategoryId: 1, segmentCategoryName: "Craft", subCategoryId: 2, subCategoryName: "Weave" }];
    const execute = vi.fn(() => Promise.resolve(primary));
    const repo = new NavigationRepository({ execute } as never);
    await expect(repo.findNavMenuCraftMapping()).resolves.toEqual(primary);
    expect(execute).toHaveBeenCalledOnce();
  });

  it("falls back to the plain join when the fabric-scoped query returns no rows", async () => {
    const execute = vi.fn(() => Promise.resolve([]));
    const orderBy = vi.fn(() => Promise.resolve([{ segmentCategoryId: 3, segmentCategoryName: "S", subCategoryId: 4, subCategoryName: "SC" }]));
    const innerJoin = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ innerJoin }));
    const select = vi.fn(() => ({ from }));
    const repo = new NavigationRepository({ execute, select } as never);
    await expect(repo.findNavMenuCraftMapping()).resolves.toEqual([
      { segmentCategoryId: 3, segmentCategoryName: "S", subCategoryId: 4, subCategoryName: "SC" },
    ]);
  });

  it("a query failure propagates instead of silently falling back to the plain join", async () => {
    const execute = vi.fn(() => Promise.reject(BOOM));
    const select = vi.fn(); // must never be reached
    const repo = new NavigationRepository({ execute, select } as never);
    await expect(repo.findNavMenuCraftMapping()).rejects.toThrow(BOOM);
    expect(select).not.toHaveBeenCalled();
  });
});

describe("NavigationRepository.fetchProductPreviewForNavigation", () => {
  it("empty is still [], a query failure propagates", async () => {
    const okDb = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([]) }) })) };
    await expect(new NavigationRepository(okDb as never).fetchProductPreviewForNavigation("fabric")).resolves.toEqual([]);

    const badDb = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) })) };
    await expect(new NavigationRepository(badDb as never).fetchProductPreviewForNavigation("fabric")).rejects.toThrow(BOOM);
  });
});

describe("NavigationRepository.findNavMenuStoryMapping", () => {
  it("returns [] without querying for an unrecognised story type", async () => {
    const select = vi.fn();
    const repo = new NavigationRepository({ select } as never);
    await expect(repo.findNavMenuStoryMapping("not-a-real-type")).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });
});
