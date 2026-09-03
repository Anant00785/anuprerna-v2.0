/**
 * Regression suite for the WELCOME15 fabrication: the apply-voucher endpoint
 * used to compute `cartTotal || 2500`, apply a hardcoded 15%, and return
 * success without touching the database. These tests pin the ported Loom
 * DiscountDAOController.applyVoucher semantics — every approval must come from
 * a real discount row, and a missing cart total is a rejection, never a guess.
 */
import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { BadRequestException } from "@nestjs/common";
import { DiscountService } from "./discount.service.js";
import { ApplyVoucherDiscountDto, DiscountController } from "./discount.controller.js";
import type { Database } from "../../database/database.module.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";

const DAY = 24 * 60 * 60 * 1000;

function activeDiscount(overrides: Record<string, unknown> = {}) {
  return {
    id: 7n,
    couponCode: "REAL10",
    discountPercentage: 10,
    minimumOrderValue: 1000,
    active: true,
    startDate: Date.now() - DAY,
    endDate: Date.now() + DAY,
    usageType: "MULTIPLE",
    ...overrides,
  };
}

/** db whose 1st select resolves discountRows, 2nd resolves orderRows. */
function makeDb(discountRows: unknown[], orderRows: unknown[] = []) {
  let call = 0;
  const select = vi.fn(() => {
    const n = call++;
    return {
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(n === 0 ? discountRows : orderRows),
        }),
      }),
    };
  });
  return { db: { select, execute: vi.fn() } as never as Database, select };
}

function service(discountRows: unknown[], orderRows: unknown[] = []) {
  const { db } = makeDb(discountRows, orderRows);
  return new DiscountService(db);
}

describe("DiscountService.applyVoucher (Loom DiscountDAOController.applyVoucher)", () => {
  it("returns 1 for a coupon that does not exist — no invented approval", async () => {
    await expect(service([]).applyVoucher(42, "WELCOME15", 2500)).resolves.toBe(1);
  });

  it("returns 2 when the cart is below the minimum order value", async () => {
    await expect(service([activeDiscount()]).applyVoucher(42, "REAL10", 999)).resolves.toBe(2);
  });

  it("returns 2 for a genuine 0 cart value below the minimum — 0 is never replaced by a fallback total", async () => {
    // With `cartTotal || 2500`, a 0 cart used to sail past a 1000 minimum.
    await expect(service([activeDiscount()]).applyVoucher(42, "REAL10", 0)).resolves.toBe(2);
  });

  it("returns 3 for an inactive coupon", async () => {
    await expect(service([activeDiscount({ active: false })]).applyVoucher(42, "REAL10", 2500)).resolves.toBe(3);
  });

  it("returns 4 for an expired coupon", async () => {
    const d = activeDiscount({ startDate: Date.now() - 10 * DAY, endDate: Date.now() - 5 * DAY });
    await expect(service([d]).applyVoucher(42, "REAL10", 2500)).resolves.toBe(4);
  });

  it("returns 5 when a SINGLE-use coupon was already applied to one of the tenant's orders", async () => {
    const d = activeDiscount({ usageType: "SINGLE" });
    await expect(service([d], [{ id: 9n }]).applyVoucher(42, "REAL10", 2500)).resolves.toBe(5);
  });

  it("returns 0 only when every database check passes", async () => {
    const d = activeDiscount({ usageType: "SINGLE" });
    await expect(service([d], []).applyVoucher(42, "REAL10", 2500)).resolves.toBe(0);
  });

  it("propagates a database error instead of approving anyway", async () => {
    const db = {
      select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.reject(new Error("db down")) }) }) }),
      execute: vi.fn(),
    } as never as Database;
    await expect(new DiscountService(db).applyVoucher(42, "REAL10", 2500)).rejects.toThrow("db down");
  });
});

describe("ApplyVoucherDiscountDto", () => {
  const dto = (v: Record<string, unknown>) => validate(plainToInstance(ApplyVoucherDiscountDto, v));

  it("rejects a missing cartTotal — it must never default to 2500", async () => {
    const errors = await dto({ voucherCode: "WELCOME15" });
    expect(errors.some((e) => e.property === "cartTotal")).toBe(true);
  });

  it("rejects a 0 cartTotal (Loom validator: cartValue > 0)", async () => {
    const errors = await dto({ voucherCode: "WELCOME15", cartTotal: 0 });
    expect(errors.some((e) => e.property === "cartTotal")).toBe(true);
  });

  it("rejects a missing or too-short voucher code", async () => {
    expect((await dto({ cartTotal: 100 })).some((e) => e.property === "voucherCode")).toBe(true);
    expect((await dto({ voucherCode: "AB", cartTotal: 100 })).some((e) => e.property === "voucherCode")).toBe(true);
  });

  it("accepts a well-formed request", async () => {
    await expect(dto({ voucherCode: "REAL10", cartTotal: 2500 })).resolves.toEqual([]);
  });
});

describe("DiscountController voucher handlers", () => {
  const tenant: AuthenticatedTenant = { id: 42, uid: "U1", email: "c@x.in", roles: ["ROLE_CUSTOMER"] };
  const body = plainToInstance(ApplyVoucherDiscountDto, { voucherCode: "REAL10", cartTotal: 2500 });

  function controller(code: number) {
    const svc = { applyVoucher: vi.fn().mockResolvedValue(code) };
    return { ctrl: new DiscountController(svc as never), svc };
  }

  it("rejects when no authenticated tenant is attached", async () => {
    const { ctrl } = controller(0);
    await expect(ctrl.applyVoucherDiscountPost(undefined, body)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("maps a database-backed approval to success with NO fabricated amounts in the payload", async () => {
    const { ctrl, svc } = controller(0);
    const res = await ctrl.applyVoucherDiscountPost(tenant, body);
    expect(res).toEqual({ success: true, message: "voucher applied!" });
    expect(svc.applyVoucher).toHaveBeenCalledWith(42, "REAL10", 2500);
  });

  it("maps an invalid code to a failure — never `success: true` for an unknown coupon", async () => {
    const { ctrl } = controller(1);
    await expect(ctrl.applyVoucherDiscountPatch(tenant, body)).resolves.toEqual({
      success: false,
      message: "invalid voucher code!",
    });
  });
});
