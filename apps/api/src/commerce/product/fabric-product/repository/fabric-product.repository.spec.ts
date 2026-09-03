/**
 * FabricProductRepository — backs the fabric PDP + PLP filter preview. The
 * CRUD surface reuses the same version-checked write pattern already proven
 * for Product Core; the native-query reads must propagate a DB failure
 * rather than render an empty PLP.
 */
import { describe, it, expect, vi } from "vitest";
import { OptimisticLockError, FabricProductRepository } from "./fabric-product.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("FabricProductRepository.retrieveEntity / findByProductId", () => {
  it("retrieveEntity: null for a missing row, a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([]) }) })) };
    await expect(new FabricProductRepository(empty as never).retrieveEntity(1n)).resolves.toBeNull();

    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) })) };
    await expect(new FabricProductRepository(failing as never).retrieveEntity(1n)).rejects.toThrow(BOOM);
  });

  it("findByProductId: null for a missing row, a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([]) }) })) };
    await expect(new FabricProductRepository(empty as never).findByProductId(1)).resolves.toBeNull();

    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) })) };
    await expect(new FabricProductRepository(failing as never).findByProductId(1)).rejects.toThrow(BOOM);
  });
});

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
  return { repo: new FabricProductRepository(db as never) };
}

describe("FabricProductRepository.update / deleteById — optimistic locking", () => {
  it("update: returns null for a missing row, throws OptimisticLockError on a version race", async () => {
    await expect(txDb([[]], [], "update").repo.update(1n, {})).resolves.toBeNull();
    await expect(txDb([[{ version: 1n }]], [[]], "update").repo.update(1n, {})).rejects.toBeInstanceOf(OptimisticLockError);
  });

  it("deleteById: returns 0 for a missing row, throws OptimisticLockError on a version race", async () => {
    await expect(txDb([[]], [], "delete").repo.deleteById(1n)).resolves.toBe(0);
    await expect(txDb([[{ version: 1n }]], [[]], "delete").repo.deleteById(1n)).rejects.toBeInstanceOf(OptimisticLockError);
  });
});

describe("FabricProductRepository native-query reads", () => {
  it("findFabricOverviews: empty is still [], a query failure propagates instead of an empty admin table", async () => {
    const ok = new FabricProductRepository({ execute: vi.fn(() => Promise.resolve([])) } as never);
    await expect(ok.findFabricOverviews()).resolves.toEqual([]);

    const bad = new FabricProductRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(bad.findFabricOverviews()).rejects.toThrow(BOOM);
  });

  it("findFabricFilterPreviewByIds: returns [] without querying when given no ids", async () => {
    const execute = vi.fn();
    const repo = new FabricProductRepository({ execute } as never);
    await expect(repo.findFabricFilterPreviewByIds([])).resolves.toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it("findFabricFilterPreviewPage: a query failure propagates instead of an empty storefront PLP", async () => {
    const repo = new FabricProductRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(repo.findFabricFilterPreviewPage(null, null, 20, 0)).rejects.toThrow(BOOM);
  });
});
