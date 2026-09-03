import { describe, it, expect, vi } from "vitest";
import { CatalogItemMediaRepository } from "./catalog-item-media.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("CatalogItemMediaRepository.findById", () => {
  it("null for a missing row, the row otherwise", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) })) };
    await expect(new CatalogItemMediaRepository(empty as never).findById(1n)).resolves.toBeNull();

    const row = { id: 1n, url: "img.jpg" };
    const found = { select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([row]) }) }) })) };
    await expect(new CatalogItemMediaRepository(found as never).findById(1n)).resolves.toEqual(row);
  });

  it("a query failure propagates instead of a 404-shaped null", async () => {
    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: () => Promise.reject(BOOM) }) }) })) };
    await expect(new CatalogItemMediaRepository(failing as never).findById(1n)).rejects.toThrow(BOOM);
  });
});

describe("CatalogItemMediaRepository.findAll", () => {
  it("empty table is still [], a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ orderBy: () => Promise.resolve([]) }) })) };
    await expect(new CatalogItemMediaRepository(empty as never).findAll()).resolves.toEqual([]);

    const failing = { select: vi.fn(() => ({ from: () => ({ orderBy: () => Promise.reject(BOOM) }) })) };
    await expect(new CatalogItemMediaRepository(failing as never).findAll()).rejects.toThrow(BOOM);
  });
});
