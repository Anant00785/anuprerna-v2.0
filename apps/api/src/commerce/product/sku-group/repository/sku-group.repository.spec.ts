import { describe, it, expect, vi } from "vitest";
import { OptimisticLockError, SkuGroupRepository } from "./sku-group.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("SkuGroupRepository.findAll / retrieveEntity", () => {
  it("findAll: an empty table is still [], a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => Promise.resolve([]) })) };
    await expect(new SkuGroupRepository(empty as never).findAll()).resolves.toEqual([]);

    const failing = { select: vi.fn(() => ({ from: () => Promise.reject(BOOM) })) };
    await expect(new SkuGroupRepository(failing as never).findAll()).rejects.toThrow(BOOM);
  });

  it("retrieveEntity: null for a missing row, a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([]) }) })) };
    await expect(new SkuGroupRepository(empty as never).retrieveEntity(1n)).resolves.toBeNull();

    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) })) };
    await expect(new SkuGroupRepository(failing as never).retrieveEntity(1n)).rejects.toThrow(BOOM);
  });
});

describe("SkuGroupRepository.update — optimistic locking", () => {
  function txDb(selectRows: unknown[][], updatedRows: unknown[][]) {
    const sq = [...selectRows];
    const uq = [...updatedRows];
    const tx = {
      select: () => ({ from: () => ({ where: () => Promise.resolve(sq.shift() ?? []) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve(uq.shift() ?? []) }) }) }),
    };
    return { transaction: (fn: (t: unknown) => unknown) => fn(tx) };
  }

  it("returns null for a missing sku group without writing", async () => {
    const repo = new SkuGroupRepository(txDb([[]], []) as never);
    await expect(repo.update(1n, { name: "X" })).resolves.toBeNull();
  });

  it("throws OptimisticLockError on a version race", async () => {
    const repo = new SkuGroupRepository(txDb([[{ version: 1n }]], [[]]) as never);
    await expect(repo.update(1n, { name: "X" })).rejects.toBeInstanceOf(OptimisticLockError);
  });

  it("returns the mapped entity when the version-checked write succeeds", async () => {
    const repo = new SkuGroupRepository(
      txDb([[{ version: 1n }]], [[{ id: 1n, version: 2n, name: "X", timeOfCreation: 1000n }]]) as never,
    );
    await expect(repo.update(1n, { name: "X" })).resolves.toEqual({ id: 1, version: 2, name: "X", timeOfCreation: 1000 });
  });
});

describe("SkuGroupRepository.retrieveSkuGroupData — native paginated read", () => {
  it("a query failure propagates instead of an empty admin list", async () => {
    const repo = new SkuGroupRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(repo.retrieveSkuGroupData(10, 0)).rejects.toThrow(BOOM);
  });
});
