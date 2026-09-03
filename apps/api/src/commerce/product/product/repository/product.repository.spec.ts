/**
 * ProductRepository — the PDP/PLP core: retrieveEntity/findBySlug back every
 * product page, update()/deleteById() carry the same optimistic-locking
 * contract already proven for cart_item, and the execute()-based native
 * queries (findProductGists, nav-menu mappings) must propagate a DB failure
 * rather than render an empty storefront.
 */
import { describe, it, expect, vi } from "vitest";
import { OptimisticLockError, ProductRepository } from "./product.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

function selectDb(rows: unknown[]) {
  const where = vi.fn(() => Promise.resolve(rows));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { select, where, from };
}

function failingSelectDb() {
  const where = vi.fn(() => Promise.reject(BOOM));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { select, where, from };
}

describe("ProductRepository.retrieveEntity / findBySlug", () => {
  it("retrieveEntity: returns null for a missing id, the row otherwise", async () => {
    const missing = new ProductRepository({ select: selectDb([]).select } as never);
    await expect(missing.retrieveEntity(1n)).resolves.toBeNull();

    const row = { id: 1n, name: "Silk" };
    const found = new ProductRepository({ select: selectDb([row]).select } as never);
    await expect(found.retrieveEntity(1n)).resolves.toEqual(row);
  });

  it("retrieveEntity: a query failure propagates instead of a 404-shaped null", async () => {
    const repo = new ProductRepository({ select: failingSelectDb().select } as never);
    await expect(repo.retrieveEntity(1n)).rejects.toThrow(BOOM);
  });

  it("findBySlug: returns null for an unknown slug, the row otherwise", async () => {
    const missing = new ProductRepository({ select: selectDb([]).select } as never);
    await expect(missing.findBySlug("nope")).resolves.toBeNull();

    const row = { id: 2n, slug: "silk-saree" };
    const found = new ProductRepository({ select: selectDb([row]).select } as never);
    await expect(found.findBySlug("silk-saree")).resolves.toEqual(row);
  });

  it("findBySlug: a query failure propagates rather than rendering a 404 PDP", async () => {
    const repo = new ProductRepository({ select: failingSelectDb().select } as never);
    await expect(repo.findBySlug("silk-saree")).rejects.toThrow(BOOM);
  });
});

/** A transaction stub whose select/update|delete results are queued in call order. */
function txDb(selectRows: unknown[][], writeRows: unknown[][], op: "update" | "delete") {
  const sq = [...selectRows];
  const wq = [...writeRows];
  const tx: any = {
    select: () => ({ from: () => ({ where: () => Promise.resolve(sq.shift() ?? []) }) }),
  };
  if (op === "update") {
    tx.update = () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve(wq.shift() ?? []) }) }) });
  } else {
    tx.delete = () => ({ where: () => ({ returning: () => Promise.resolve(wq.shift() ?? []) }) });
  }
  const db = { transaction: (fn: (t: unknown) => unknown) => fn(tx) };
  return { db, repo: new ProductRepository(db as never) };
}

describe("ProductRepository.update — optimistic locking", () => {
  it("returns null for a missing product without attempting a write", async () => {
    const { repo } = txDb([[]], [], "update");
    await expect(repo.update(1n, { name: "X" } as never)).resolves.toBeNull();
  });

  it("returns the updated row when the version-checked write succeeds", async () => {
    const { repo } = txDb([[{ version: 3n }]], [[{ id: 1n, name: "X", version: 4n }]], "update");
    await expect(repo.update(1n, { name: "X" } as never)).resolves.toEqual({ id: 1n, name: "X", version: 4n });
  });

  it("throws OptimisticLockError when the row changed between read and write", async () => {
    const { repo } = txDb([[{ version: 3n }]], [[]], "update");
    await expect(repo.update(1n, { name: "X" } as never)).rejects.toBeInstanceOf(OptimisticLockError);
  });
});

describe("ProductRepository.deleteById — optimistic locking", () => {
  it("returns 0 for a missing product without attempting a delete", async () => {
    const { repo } = txDb([[]], [], "delete");
    await expect(repo.deleteById(1n)).resolves.toBe(0);
  });

  it("returns 1 when the version-checked delete removed the row", async () => {
    const { repo } = txDb([[{ version: 3n }]], [[{ id: 1n }]], "delete");
    await expect(repo.deleteById(1n)).resolves.toBe(1);
  });

  it("throws OptimisticLockError when the row changed between read and delete", async () => {
    const { repo } = txDb([[{ version: 3n }]], [[]], "delete");
    await expect(repo.deleteById(1n)).rejects.toBeInstanceOf(OptimisticLockError);
  });
});

describe("ProductRepository.findProductGists — storefront PLP feed", () => {
  it("maps rows to the gist projection", async () => {
    const row = { id: 1, sku: "S1", name: "Silk", hero_image: "img.jpg", slug: "silk", product_group: "fabric", price: "199.99" };
    const repo = new ProductRepository({ execute: vi.fn(() => Promise.resolve([row])) } as never);
    await expect(repo.findProductGists()).resolves.toEqual([
      { id: 1, sku: "S1", name: "Silk", hero_image: "img.jpg", slug: "silk", product_group: "fabric", price: 199.99 },
    ]);
  });

  it("an empty catalogue is still []", async () => {
    const repo = new ProductRepository({ execute: vi.fn(() => Promise.resolve([])) } as never);
    await expect(repo.findProductGists()).resolves.toEqual([]);
  });

  it("a query failure propagates instead of an empty PLP", async () => {
    const repo = new ProductRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(repo.findProductGists()).rejects.toThrow(BOOM);
  });
});

describe("ProductRepository nav-menu mappings — header on every storefront page", () => {
  it("findNavMenuCraftMapping falls back to the plain segment/subcategory join when the fabric-scoped query is empty", async () => {
    const execute = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([
      { segmentCategoryId: 1, segmentCategoryName: "Craft", subCategoryId: 2, subCategoryName: "Weave" },
    ]);
    const repo = new ProductRepository({ execute } as never);
    await expect(repo.findNavMenuCraftMapping()).resolves.toEqual([
      { segmentCategoryId: 1, segmentCategoryName: "Craft", subCategoryId: 2, subCategoryName: "Weave" },
    ]);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("findNavMenuCraftMapping: a query failure propagates rather than serving an empty nav menu", async () => {
    const repo = new ProductRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(repo.findNavMenuCraftMapping()).rejects.toThrow(BOOM);
  });
});
