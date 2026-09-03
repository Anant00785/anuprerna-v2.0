/**
 * SubCategoryRepository — the PLP-facing leaf of the filter hierarchy
 * (category -> segment -> sub_category -> product), plus the
 * updateRelatedProducts bulk write that fans profile-FK changes out to
 * every product under a subcategory.
 */
import { describe, it, expect, vi } from "vitest";
import { OptimisticLockError, SubCategoryRepository } from "./subCategory.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("SubCategoryRepository.retrieveEntity", () => {
  it("null for a missing row, the mapped entity otherwise", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([]) }) })) };
    await expect(new SubCategoryRepository(empty as never).retrieveEntity(1n)).resolves.toBeNull();
  });

  it("a query failure propagates", async () => {
    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) })) };
    await expect(new SubCategoryRepository(failing as never).retrieveEntity(1n)).rejects.toThrow(BOOM);
  });
});

describe("SubCategoryRepository.findAllPreviews — storefront filter panel", () => {
  it("an empty table is still [], a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => Promise.resolve([]) })) };
    await expect(new SubCategoryRepository(empty as never).findAllPreviews()).resolves.toEqual([]);

    const failing = { select: vi.fn(() => ({ from: () => Promise.reject(BOOM) })) };
    await expect(new SubCategoryRepository(failing as never).findAllPreviews()).rejects.toThrow(BOOM);
  });
});

describe("SubCategoryRepository.countProductBySubCategoryId", () => {
  it("a query failure propagates instead of reporting 0 products", async () => {
    const select = vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) }));
    await expect(new SubCategoryRepository({ select } as never).countProductBySubCategoryId(1n)).rejects.toThrow(BOOM);
  });
});

function txDb(selectRows: unknown[][], updatedRows: unknown[][]) {
  const sq = [...selectRows];
  const uq = [...updatedRows];
  const tx = {
    select: () => ({ from: () => ({ where: () => Promise.resolve(sq.shift() ?? []) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve(uq.shift() ?? []) }) }) }),
  };
  const db = { transaction: (fn: (t: unknown) => unknown) => fn(tx) };
  return { repo: new SubCategoryRepository(db as never) };
}

describe("SubCategoryRepository.update — optimistic locking", () => {
  it("returns null for a missing subcategory without writing", async () => {
    const { repo } = txDb([[]], []);
    await expect(repo.update(1n, {} as never)).resolves.toBeNull();
  });

  it("throws OptimisticLockError on a version race", async () => {
    const { repo } = txDb([[{ version: 1n }]], [[]]);
    await expect(repo.update(1n, {} as never)).rejects.toBeInstanceOf(OptimisticLockError);
  });
});

describe("SubCategoryRepository.updateRelatedProducts — bulk profile-FK fan-out", () => {
  it("scopes the bulk UPDATE to this subcategory's non-disabled products", async () => {
    const where = vi.fn(() => Promise.resolve());
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    const repo = new SubCategoryRepository({ update } as never);
    await repo.updateRelatedProducts(1n, {
      badgeProfileId: null,
      volumeDiscountProfileId: null,
      madeToOrderProfileId: null,
      fabricProfileId: null,
      customSizeProfileId: null,
      finishProfileId: null,
    });
    expect(update).toHaveBeenCalledOnce();
    expect(where).toHaveBeenCalledOnce();
  });

  it("a write failure propagates rather than silently leaving stale profile FKs on related products", async () => {
    const where = vi.fn(() => Promise.reject(BOOM));
    const update = vi.fn(() => ({ set: () => ({ where }) }));
    const repo = new SubCategoryRepository({ update } as never);
    await expect(
      repo.updateRelatedProducts(1n, {
        badgeProfileId: null,
        volumeDiscountProfileId: null,
        madeToOrderProfileId: null,
        fabricProfileId: null,
        customSizeProfileId: null,
        finishProfileId: null,
      }),
    ).rejects.toThrow(BOOM);
  });
});
