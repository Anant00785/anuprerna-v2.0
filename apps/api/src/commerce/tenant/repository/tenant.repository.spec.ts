/**
 * Regression suite for the tenant-1 fallback: getSuperUserProfile /
 * getCustomerProfile / updateCustomerProfile used `BigInt(tenantId || 1)`, so
 * a missing or 0 tenant id read and wrote TENANT 1's data. A bad id must be
 * rejected before any query runs.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { TenantRepository } from "./tenant.repository.js";

/**
 * `rows` answers every select. `extraRows`, when given, answers the SECOND
 * select — getCustomerProfile reads `loom_tenant` and then the `customer`
 * preferences row that carries the wishlist CSV.
 */
function makeDb(rows: unknown[] = [], extraRows?: unknown[]) {
  let selectCount = 0;
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(selectCount === 2 && extraRows ? extraRows : rows),
  };
  const setFn = vi.fn(() => ({ where: () => Promise.resolve() }));
  const onConflictDoUpdate = vi.fn(() => Promise.resolve());
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  return {
    select: vi.fn(() => {
      selectCount += 1;
      return chain;
    }),
    update: vi.fn(() => ({ set: setFn })),
    insert: vi.fn(() => ({ values })),
    _values: values,
    _onConflictDoUpdate: onConflictDoUpdate,
  };
}

const BAD_IDS: unknown[] = [undefined, null, 0, "", "0", -3, "abc", Number.NaN];

describe("TenantRepository tenant-id guard", () => {
  it.each(BAD_IDS)("getSuperUserProfile(%j) rejects without querying — never tenant 1", async (id) => {
    const db = makeDb();
    await expect(new TenantRepository(db).getSuperUserProfile(id)).rejects.toBeInstanceOf(BadRequestException);
    expect(db.select).not.toHaveBeenCalled();
  });

  it.each(BAD_IDS)("getCustomerProfile(%j) rejects without querying", async (id) => {
    const db = makeDb();
    await expect(new TenantRepository(db).getCustomerProfile(id)).rejects.toBeInstanceOf(BadRequestException);
    expect(db.select).not.toHaveBeenCalled();
  });

  it.each(BAD_IDS)("updateCustomerProfile(%j) rejects without writing", async (id) => {
    const db = makeDb();
    await expect(new TenantRepository(db).updateCustomerProfile(id, { name: "X" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(db.update).not.toHaveBeenCalled();
    expect(db.select).not.toHaveBeenCalled();
  });

  it.each(BAD_IDS)("setSelectedCurrency(%j) rejects without writing", async (id) => {
    const db = makeDb();
    await expect(new TenantRepository(db).setSelectedCurrency(id, "USD")).rejects.toBeInstanceOf(BadRequestException);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("setSelectedCurrency upserts the caller's own customer row", async () => {
    const db = makeDb();
    await new TenantRepository(db).setSelectedCurrency(42, "USD");
    expect(db._values).toHaveBeenCalledWith({ tenantId: 42, defaultCurrency: "USD" });
    expect(db._onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ set: { defaultCurrency: "USD" } }),
    );
  });

  it("still reads a real tenant id (numeric string accepted, as before)", async () => {
    const row = { id: 42n, name: "Real Tenant" };
    // No `customer` preferences row — the profile is the tenant row unchanged.
    const db = makeDb([row], []);
    await expect(new TenantRepository(db).getCustomerProfile("42")).resolves.toEqual(row);
  });

  // Regression: the wishlist CSV is written to `customer.wishlist` but this read
  // only ever touched `loom_tenant`, so a saved wishlist never came back and the
  // storefront's wishlist page always rendered "0 Items".
  it("returns the wishlist CSV from the customer preferences row", async () => {
    const tenant = { id: 42n, name: "Real Tenant" };
    const customer = { tenantId: 42, wishlist: "SKU-1,SKU-2", defaultCurrency: "INR" };
    const db = makeDb([tenant], [customer]);

    await expect(new TenantRepository(db).getCustomerProfile(42)).resolves.toEqual({
      id: 42n,
      name: "Real Tenant",
      wishlist: "SKU-1,SKU-2",
      defaultCurrency: "INR",
    });
  });
});
