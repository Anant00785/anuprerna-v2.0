/**
 * SegmentRepository — mirrors CategoryRepository's shape one level down the
 * filter hierarchy. Same coverage focus: empty vs missing vs failure.
 */
import { describe, it, expect, vi } from "vitest";
import { SegmentRepository } from "./segment.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("SegmentRepository.findById / findAll", () => {
  it("findById: null for a missing row, the row otherwise", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([]) }) })) };
    await expect(new SegmentRepository(empty as never).findById(1)).resolves.toBeNull();

    const row = { id: 1n, name: "Silk" };
    const found = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([row]) }) })) };
    await expect(new SegmentRepository(found as never).findById(1)).resolves.toEqual(row);
  });

  it("findById: a query failure propagates", async () => {
    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) })) };
    await expect(new SegmentRepository(failing as never).findById(1)).rejects.toThrow(BOOM);
  });

  it("findAll: an empty table is still [], a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => Promise.resolve([]) })) };
    await expect(new SegmentRepository(empty as never).findAll()).resolves.toEqual([]);

    const failing = { select: vi.fn(() => ({ from: () => Promise.reject(BOOM) })) };
    await expect(new SegmentRepository(failing as never).findAll()).rejects.toThrow(BOOM);
  });
});

describe("SegmentRepository.findSegmentPreviewByCategory — storefront filter panel", () => {
  it("maps the joined preview rows", async () => {
    const row = {
      categoryId: 1, categoryName: "Sarees", segmentId: 2, name: "Silk", icon: "i.svg",
      metaTitle: "T", metaDescription: "D", socialImage: "s.jpg",
    };
    const repo = new SegmentRepository({ execute: vi.fn(() => Promise.resolve([row])) } as never);
    await expect(repo.findSegmentPreviewByCategory("Sarees")).resolves.toEqual([row]);
  });

  it("a query failure propagates instead of an empty filter panel", async () => {
    const repo = new SegmentRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(repo.findSegmentPreviewByCategory("Sarees")).rejects.toThrow(BOOM);
  });
});

describe("SegmentRepository.countSubCategoryBySegmentId", () => {
  it("a query failure propagates instead of reporting 0 subcategories", async () => {
    const select = vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) }));
    await expect(new SegmentRepository({ select } as never).countSubCategoryBySegmentId(1)).rejects.toThrow(BOOM);
  });
});
