import { describe, it, expect, vi } from "vitest";
import { OptimisticLockError, SpecialStatusRepository } from "./special-status.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("SpecialStatusRepository.findAll / retrieveEntity", () => {
  it("findAll: an empty table is still [], a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => Promise.resolve([]) })) };
    await expect(new SpecialStatusRepository(empty as never).findAll()).resolves.toEqual([]);

    const failing = { select: vi.fn(() => ({ from: () => Promise.reject(BOOM) })) };
    await expect(new SpecialStatusRepository(failing as never).findAll()).rejects.toThrow(BOOM);
  });

  it("retrieveEntity: null for a missing row, a failure propagates", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve([]) }) })) };
    await expect(new SpecialStatusRepository(empty as never).retrieveEntity(1n)).resolves.toBeNull();

    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.reject(BOOM) }) })) };
    await expect(new SpecialStatusRepository(failing as never).retrieveEntity(1n)).rejects.toThrow(BOOM);
  });
});

describe("SpecialStatusRepository.update — optimistic locking", () => {
  function txDb(selectRows: unknown[][], updatedRows: unknown[][]) {
    const sq = [...selectRows];
    const uq = [...updatedRows];
    const tx = {
      select: () => ({ from: () => ({ where: () => Promise.resolve(sq.shift() ?? []) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve(uq.shift() ?? []) }) }) }),
    };
    return { transaction: (fn: (t: unknown) => unknown) => fn(tx) };
  }

  it("returns null for a missing row without writing", async () => {
    const repo = new SpecialStatusRepository(txDb([[]], []) as never);
    await expect(repo.update(1n, { name: "X" })).resolves.toBeNull();
  });

  it("throws OptimisticLockError on a version race", async () => {
    const repo = new SpecialStatusRepository(txDb([[{ version: 1n }]], [[]]) as never);
    await expect(repo.update(1n, { name: "X" })).rejects.toBeInstanceOf(OptimisticLockError);
  });
});

describe("SpecialStatusRepository.retrieveSpecialStatusDataById", () => {
  it("null for a missing id, a query failure propagates", async () => {
    const ok = new SpecialStatusRepository({ execute: vi.fn(() => Promise.resolve([])) } as never);
    await expect(ok.retrieveSpecialStatusDataById(1n)).resolves.toBeNull();

    const bad = new SpecialStatusRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(bad.retrieveSpecialStatusDataById(1n)).rejects.toThrow(BOOM);
  });
});
