/**
 * CategoryRepository — top of the storefront filter/nav hierarchy
 * (category -> segment -> sub_category -> product). Covers the plain CRUD
 * surface and asserts a DB failure on any read propagates instead of
 * emptying the category filter silently.
 */
import { describe, it, expect, vi } from "vitest";
import { CategoryRepository } from "./category.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

function selectDb(rows: unknown[]) {
  const where = vi.fn(() => Promise.resolve(rows));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { select };
}

describe("CategoryRepository.findById / findAll", () => {
  it("findById: null for a missing row, the row otherwise", async () => {
    await expect(new CategoryRepository(selectDb([]) as never).findById(1)).resolves.toBeNull();
    const row = { id: 1n, name: "Sarees" };
    await expect(new CategoryRepository(selectDb([row]) as never).findById(1)).resolves.toEqual(row);
  });

  it("findById: a query failure propagates", async () => {
    const select = vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) }));
    await expect(new CategoryRepository({ select } as never).findById(1)).rejects.toThrow(BOOM);
  });

  it("findAll: an empty table is still [], a failure propagates", async () => {
    const emptyDb = { select: vi.fn(() => ({ from: () => Promise.resolve([]) })) };
    await expect(new CategoryRepository(emptyDb as never).findAll()).resolves.toEqual([]);

    const failDb = { select: vi.fn(() => ({ from: () => Promise.reject(BOOM) })) };
    await expect(new CategoryRepository(failDb as never).findAll()).rejects.toThrow(BOOM);
  });
});

describe("CategoryRepository native-query reads", () => {
  it("findByNameIgnoreCase: null for no match, a failure propagates", async () => {
    const ok = new CategoryRepository({ execute: vi.fn(() => Promise.resolve([])) } as never);
    await expect(ok.findByNameIgnoreCase("sarees")).resolves.toBeNull();

    const bad = new CategoryRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(bad.findByNameIgnoreCase("sarees")).rejects.toThrow(BOOM);
  });

  it("countSegmentsByCategoryId: propagates a query failure instead of reporting 0 segments", async () => {
    const select = vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) }));
    await expect(new CategoryRepository({ select } as never).countSegmentsByCategoryId(1)).rejects.toThrow(BOOM);
  });

  it("retrieveCategory: maps the paginated column set, a failure propagates", async () => {
    const row = {
      id: 1, version: 2, name: "Sarees", icon: "icon.svg", meta_title: "T", meta_description: "D",
      social_image: "s.jpg", time_of_creation: 1000,
    };
    const ok = new CategoryRepository({ execute: vi.fn(() => Promise.resolve([row])) } as never);
    await expect(ok.retrieveCategory(10, 0)).resolves.toEqual([
      { id: 1, version: 2, name: "Sarees", icon: "icon.svg", metaTitle: "T", metaDescription: "D", socialImage: "s.jpg", timeOfCreation: 1000 },
    ]);

    const bad = new CategoryRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(bad.retrieveCategory(10, 0)).rejects.toThrow(BOOM);
  });
});
