import { describe, it, expect, vi } from "vitest";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { CartRepository, type InsertCartItemValues } from "./cart.repository.js";
import type { Database } from "../../../database/database.module.js";

/**
 * A cart row carries NO price: `cart_item` has no price column, and the line
 * total is derived at read time from the product behind fabric_product_id /
 * finished_product_id. Two ways that used to produce a silently broken cart:
 *
 *   1. An unknown tenant id CREATED a guest_<ts>_<rand>@anuprerna.com tenant and
 *      filed the item under it — the customer saw an empty cart and looked
 *      logged out, and production gained a junk tenant per click (15 found).
 *   2. A product id that resolved to nothing was written as a NULL FK and the
 *      insert SUCCEEDED — an unpriceable row that renders "INR 0.00" and would
 *      carry a zero line into checkout (6 such rows found in production).
 *
 * Both now fail loudly instead.
 */

/** Chainable fake matching the exact Drizzle chains `insert` uses. */
function makeDb(opts: {
  tenantExists?: boolean;
  fabricById?: boolean;
  fabricByProductId?: boolean;
  finishedById?: boolean;
  finishedByProductId?: boolean;
}) {
  const inserted: unknown[] = [];
  let call = 0;

  // Order of selects in insert(): tenant, [fabric byId, fabric byProductId],
  // [finished byId, finished byProductId], [selectedFabric], [sizeOption].
  const results: boolean[] = [];
  results.push(opts.tenantExists ?? true);

  const db = {
    _inserted: inserted,
    _queue: results,
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => {
            const idx = call++;
            const hit = db._queue[idx];
            return Promise.resolve(hit ? [{ id: 999n }] : []);
          },
        }),
      }),
    }),
    insert: () => ({
      values: (v: unknown) => ({
        returning: () => {
          inserted.push(v);
          return Promise.resolve([{ id: 1n }]);
        },
      }),
    }),
  };
  return db;
}

const base = (over: Partial<InsertCartItemValues> = {}): InsertCartItemValues =>
  ({
    tenantId: 162936311,
    lastUpdatedAt: Date.now(),
    selectedFinishId: "",
    customSize: null,
    productGroup: "finished",
    orderType: "IN_STOCK",
    quantity: "1",
    unit: "UNIT",
    makingCharge: "0",
    ...over,
  }) as InsertCartItemValues;

describe("CartRepository.insert — data integrity", () => {
  it("REJECTS an unknown tenant instead of inventing a guest account", async () => {
    const db = makeDb({ tenantExists: false });
    const repo = new CartRepository(db as unknown as Database);

    await expect(repo.insert(base({ finishedProductId: 82926 }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    // Nothing was written — no cart row and, crucially, no loom_tenant row.
    expect(db._inserted).toHaveLength(0);
  });

  it("REJECTS tenantId 0 rather than treating it as a new guest", async () => {
    const db = makeDb({ tenantExists: false });
    const repo = new CartRepository(db as unknown as Database);
    await expect(repo.insert(base({ tenantId: 0, finishedProductId: 1 }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("REJECTS a finished product id that resolves to nothing — the INR 0.00 row", async () => {
    // tenant ok, finished byId miss, finished byProductId miss
    const db = makeDb({ tenantExists: true });
    db._queue.push(false, false);
    const repo = new CartRepository(db as unknown as Database);

    await expect(repo.insert(base({ finishedProductId: 99999999 }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(db._inserted).toHaveLength(0);
  });

  it("REJECTS a fabric product id that resolves to nothing", async () => {
    const db = makeDb({ tenantExists: true });
    db._queue.push(false, false);
    const repo = new CartRepository(db as unknown as Database);

    await expect(
      repo.insert(base({ productGroup: "fabric", fabricProductId: 99999999 })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("REJECTS an item referencing no product at all", async () => {
    const db = makeDb({ tenantExists: true });
    const repo = new CartRepository(db as unknown as Database);

    await expect(repo.insert(base())).rejects.toBeInstanceOf(BadRequestException);
    expect(db._inserted).toHaveLength(0);
  });

  it("INSERTS normally when the tenant and product both resolve", async () => {
    const db = makeDb({ tenantExists: true });
    db._queue.push(true); // finished byId hit
    const repo = new CartRepository(db as unknown as Database);

    await expect(repo.insert(base({ finishedProductId: 82926 }))).resolves.toBeDefined();
    expect(db._inserted).toHaveLength(1);
    expect(db._inserted[0]).toMatchObject({ finishedProductId: 999, tenantId: 999 });
  });

  it("resolves a product id given as the underlying product_id (second lookup)", async () => {
    const db = makeDb({ tenantExists: true });
    db._queue.push(false, true); // byId miss, byProductId hit
    const repo = new CartRepository(db as unknown as Database);

    await expect(repo.insert(base({ finishedProductId: 82925 }))).resolves.toBeDefined();
    expect(db._inserted).toHaveLength(1);
  });
});
