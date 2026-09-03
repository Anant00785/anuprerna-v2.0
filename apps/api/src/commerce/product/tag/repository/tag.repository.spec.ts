import { describe, it, expect, vi } from "vitest";
import { OptimisticLockError, TagRepository } from "./tag.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("TagRepository.findByIds", () => {
  it("returns [] without querying when given no ids", async () => {
    const select = vi.fn();
    const repo = new TagRepository({ select } as never);
    await expect(repo.findByIds([])).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });

  it("a query failure propagates instead of dropping the tag list", async () => {
    const select = vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) }));
    const repo = new TagRepository({ select } as never);
    await expect(repo.findByIds([1n, 2n])).rejects.toThrow(BOOM);
  });
});

describe("TagRepository.findById", () => {
  it("null for a missing tag, the row otherwise", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([]) }) })) };
    await expect(new TagRepository(empty as never).findById(1n)).resolves.toBeNull();
  });

  it("a query failure propagates", async () => {
    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) })) };
    await expect(new TagRepository(failing as never).findById(1n)).rejects.toThrow(BOOM);
  });
});

describe("TagRepository.update — optimistic locking", () => {
  function txDb(selectRows: unknown[][], updatedRows: unknown[][]) {
    const sq = [...selectRows];
    const uq = [...updatedRows];
    const tx = {
      select: () => ({ from: () => ({ where: () => Promise.resolve(sq.shift() ?? []) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve(uq.shift() ?? []) }) }) }),
    };
    return { transaction: (fn: (t: unknown) => unknown) => fn(tx) };
  }

  it("returns null for a missing tag without writing", async () => {
    const repo = new TagRepository(txDb([[]], []) as never);
    await expect(repo.update(1n, { name: "X" })).resolves.toBeNull();
  });

  it("throws OptimisticLockError on a version race", async () => {
    const repo = new TagRepository(txDb([[{ version: 1n }]], [[]]) as never);
    await expect(repo.update(1n, { name: "X" })).rejects.toBeInstanceOf(OptimisticLockError);
  });
});

describe("TagRepository.retrieveTagData — native paginated read", () => {
  it("maps BigInt-friendly columns, a failure propagates", async () => {
    const row = { id: 1, version: 2, name: "Handmade", time_of_creation: 1000 };
    const ok = new TagRepository({ execute: vi.fn(() => Promise.resolve([row])) } as never);
    await expect(ok.retrieveTagData(0, 10)).resolves.toEqual([{ id: 1n, version: 2n, name: "Handmade", timeOfCreation: 1000 }]);

    const bad = new TagRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(bad.retrieveTagData(0, 10)).rejects.toThrow(BOOM);
  });
});
