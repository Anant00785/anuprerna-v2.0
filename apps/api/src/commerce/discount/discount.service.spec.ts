/**
 * DiscountService — money path, registered in discount.module.ts and injected
 * by discount.controller.ts, so everything here ships.
 *
 * There is no Discount DAO in the Java original (`grep -ril discount
 * loom/src/main/java` finds no discount DAO controller); the `discount` table
 * is read directly. So the authority for this class is the table shape plus the
 * rule that a money-bearing route must never invent a discount.
 */
import { describe, it, expect, vi } from "vitest";
import { DiscountService } from "./discount.service.js";
import type { Database } from "../../database/database.module.js";

function make(rows: unknown[] | Error, generic: unknown[] = []) {
  const select = vi.fn(() => ({
    from: () => ({
      limit: () => (rows instanceof Error ? Promise.reject(rows) : Promise.resolve(rows)),
    }),
  }));
  // `execute` backs CommerceDataService's generic commerce_discount fallback.
  const execute = vi.fn().mockResolvedValue(generic);
  const db = { select, execute } as unknown as Database;
  return { db, execute, service: new DiscountService(db) };
}

describe("DiscountService.getAll", () => {
  it("maps the discount table onto the response shape the clients read", async () => {
    const { service } = make([
      {
        id: 3,
        couponCode: "SUMMER10",
        discountPercentage: "10.00",
        discountType: "PERCENTAGE",
        discountMethod: "COUPON",
        minimumOrderValue: "2000.00",
        location: "IN",
        active: true,
      },
    ]);
    await expect(service.getAll()).resolves.toEqual([
      {
        id: "3",
        name: "SUMMER10",
        couponCode: "SUMMER10",
        discountPercentage: "10.00",
        discountType: "PERCENTAGE",
        discountMethod: "COUPON",
        minimumOrderValue: "2000.00",
        location: "IN",
        active: true,
      },
    ]);
  });

  it("carries an inactive coupon through as active:false rather than hiding it", async () => {
    const { service } = make([{ id: 3, couponCode: "OLD", active: false }]);
    const [row] = (await service.getAll()) as { active: boolean }[];
    expect(row.active).toBe(false);
  });

  it("treats a null `active` as false, not as an enabled coupon", async () => {
    // Boolean(null) === false. Pinned because the failure direction matters:
    // a NULL must never read as a live discount.
    const { service } = make([{ id: 3, couponCode: "X", active: null }]);
    const [row] = (await service.getAll()) as { active: boolean }[];
    expect(row.active).toBe(false);
  });

  it("returns [] for an empty discount table — it does NOT invent a coupon", async () => {
    // Regression: this used to return a fabricated
    //   { couponCode: "WELCOME15", discountPercentage: 15, minimumOrderValue: 1000 }
    // whenever the table was empty, i.e. a 15%-off coupon served from a live
    // route as though it were real configuration.
    const { service } = make([]);
    await expect(service.getAll()).resolves.toEqual([]);
  });

  it("returns [] when the discount table read throws, instead of a seed coupon", async () => {
    const { service } = make(new Error("relation \"discount\" does not exist"));
    await expect(service.getAll()).resolves.toEqual([]);
  });

  it("falls through to the generic commerce_discount table on a read failure", async () => {
    const generic = [{ id: 1, name: "MANUAL", payload: {} }];
    const { service, execute } = make(new Error("boom"), generic);
    await expect(service.getAll()).resolves.toEqual(generic);
    expect(execute).toHaveBeenCalled();
  });
});
