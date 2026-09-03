/**
 * CartRepository — tenant scoping and the version-checked delete paths.
 *
 * Authority: loom/.../cart/dao/repository/CartItemJpaRepository.java and
 * CartItemDAOController.java. `findCartItemByTenant` is a plain derived
 * finder; `deleteCartItemById` / `deleteAllByTenant` are derived deletes,
 * which Spring Data implements as select-then-remove() per entity, each
 * emitting `DELETE ... WHERE id = ? AND version = ?` (see the long note at
 * the top of cart.repository.ts).
 */
import { describe, it, expect, vi } from "vitest";
import { CartRepository, OptimisticLockError } from "./cart.repository.js";

function selectOnly(rows: unknown[]) {
  const where = vi.fn().mockResolvedValue(rows);
  const db = {
    select: vi.fn(() => ({ from: () => ({ where }) })),
    insert: vi.fn(),
  };
  return { db, where, repo: new CartRepository(db as never) };
}

describe("CartRepository.findByTenantId — tenant scoping", () => {
  it("reads only the given tenant's rows", async () => {
    const { repo, db } = selectOnly([{ id: 1n }]);
    await expect(repo.findByTenantId(42)).resolves.toEqual([{ id: 1n }]);
    expect(db.select).toHaveBeenCalledOnce();
  });

  it("NEVER creates a tenant as a side effect of a read", async () => {
    // Regression: findByTenantId used to call ensureTenantExists, which on a
    // miss INSERTed a guest loom_tenant row plus a ROLE_CUSTOMER grant — an
    // account created by a GET.
    const { repo, db } = selectOnly([]);
    await repo.findByTenantId(42);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("issues exactly one query — no tenant-existence lookup first", async () => {
    // The second lookup was the vector: when it missed, the read fell back to
    // `SELECT id FROM loom_tenant LIMIT 1` and returned THAT tenant's cart.
    const { repo, db } = selectOnly([]);
    await repo.findByTenantId(42);
    expect(db.select).toHaveBeenCalledOnce();
  });

  it.each([0, -1, Number.NaN])(
    "returns [] for the unusable tenant id %p instead of borrowing another tenant",
    async (tid) => {
      const { repo, db } = selectOnly([{ id: 999n }]);
      await expect(repo.findByTenantId(tid)).resolves.toEqual([]);
      expect(db.select).not.toHaveBeenCalled();
    },
  );

  it("returns [] for a tenant with an empty cart", async () => {
    const { repo } = selectOnly([]);
    await expect(repo.findByTenantId(42)).resolves.toEqual([]);
  });

  it("propagates a DB error rather than answering with someone else's cart", async () => {
    const db = {
      select: () => ({ from: () => ({ where: () => Promise.reject(new Error("boom")) }) }),
    };
    await expect(new CartRepository(db as never).findByTenantId(42)).rejects.toThrow("boom");
  });
});

/** A transaction stub whose select/delete results are queued in call order. */
function txDb(selectRows: unknown[][], deleteRows: unknown[][]) {
  const sq = [...selectRows];
  const dq = [...deleteRows];
  const deleted: unknown[] = [];
  const tx = {
    select: () => ({ from: () => ({ where: () => Promise.resolve(sq.shift() ?? []) }) }),
    delete: () => ({
      where: (cond: unknown) => ({
        returning: () => {
          deleted.push(cond);
          return Promise.resolve(dq.shift() ?? []);
        },
      }),
    }),
  };
  const db = { transaction: (fn: (t: unknown) => unknown) => fn(tx) };
  return { db, deleted, repo: new CartRepository(db as never) };
}

describe("CartRepository.deleteById — optimistic locking", () => {
  it("returns 1 when the version-checked delete removed the row", async () => {
    const { repo } = txDb([[{ version: 4n }]], [[{ id: 1n }]]);
    await expect(repo.deleteById(1n)).resolves.toBe(1);
  });

  it("returns 0 for a row that does not exist, without attempting a delete", async () => {
    const { repo, deleted } = txDb([[]], []);
    await expect(repo.deleteById(404n)).resolves.toBe(0);
    expect(deleted).toHaveLength(0);
  });

  it("throws OptimisticLockError when the row changed between select and delete", async () => {
    // Hibernate's behaviour for a version-managed remove() that matches 0 rows.
    const { repo } = txDb([[{ version: 4n }]], [[]]);
    await expect(repo.deleteById(1n)).rejects.toBeInstanceOf(OptimisticLockError);
  });

  it("names the entity and id in the lock error", async () => {
    const { repo } = txDb([[{ version: 4n }]], [[]]);
    await expect(repo.deleteById(7n)).rejects.toThrow(/cart_item id=7/);
  });
});

describe("CartRepository.deleteAllByTenantId", () => {
  it("deletes every row of the tenant and counts them", async () => {
    const { repo } = txDb([[{ id: 1n, version: 1n }, { id: 2n, version: 1n }]], [[{ id: 1n }], [{ id: 2n }]]);
    await expect(repo.deleteAllByTenantId(42)).resolves.toBe(2);
  });

  it("returns 0 for a tenant with an empty cart", async () => {
    const { repo } = txDb([[]], []);
    await expect(repo.deleteAllByTenantId(42)).resolves.toBe(0);
  });

  it("aborts the whole transaction if any row lost its version race", async () => {
    // Partial clears are worse than none: the caller is told the cart is empty.
    const { repo } = txDb([[{ id: 1n, version: 1n }, { id: 2n, version: 1n }]], [[{ id: 1n }], []]);
    await expect(repo.deleteAllByTenantId(42)).rejects.toBeInstanceOf(OptimisticLockError);
  });
});
