/**
 * POST /apply/coupon/{code} — the storefront's native coupon route
 * (apps/storefront/src/lib/api/repositories/checkout.repository.ts applyCoupon).
 *
 * This is a MONEY path. The rules these tests pin:
 *   - every approval comes from a real `discount` row; nothing is defaulted,
 *   - an unknown / inactive / expired / already-used code is an explicit
 *     failure envelope, never a silent zero-discount success,
 *   - the caller sends NO body, so a coupon carrying a minimum order value
 *     cannot be evaluated and is refused with that reason stated, not with a
 *     verdict the server never reached,
 *   - a database error propagates; it is never absorbed into a rejection that
 *     looks like a real verdict.
 */
import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { DiscountService } from "./discount.service.js";
import { DiscountController } from "./discount.controller.js";
import type { Database } from "../../database/database.module.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";

const DAY = 24 * 60 * 60 * 1000;
const tenant: AuthenticatedTenant = { id: 42, uid: "U1", email: "c@x.in", roles: ["ROLE_CUSTOMER"] };

function discountRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 7n,
    couponCode: "REAL10",
    discountType: "PERCENTAGE_OFF",
    discountMethod: "MANUAL",
    discountPercentage: 10,
    minimumOrderValue: 0,
    location: "INDIA",
    startDate: Date.now() - DAY,
    endDate: Date.now() + DAY,
    usageType: "MULTIPLE",
    active: true,
    ...overrides,
  };
}

/** db whose 1st select resolves discountRows, 2nd resolves orderRows. */
function makeDb(discountRows: unknown[], orderRows: unknown[] = []) {
  let call = 0;
  return {
    select: vi.fn(() => {
      const n = call++;
      return {
        from: () => ({
          where: () => ({ limit: () => Promise.resolve(n === 0 ? discountRows : orderRows) }),
        }),
      };
    }),
    execute: vi.fn(),
  } as never as Database;
}

function controller(discountRows: unknown[], orderRows: unknown[] = []) {
  return new DiscountController(new DiscountService(makeDb(discountRows, orderRows)));
}

describe("POST /apply/coupon/:code — approvals", () => {
  it("approves a real row and returns ITS percentage under `payload`", async () => {
    const res = await controller([discountRow()]).applyCoupon(tenant, "REAL10", undefined);

    expect(res).toEqual({
      success: true,
      message: "voucher applied!",
      payload: {
        couponCode: "REAL10",
        discountType: "PERCENTAGE_OFF",
        discountMethod: "MANUAL",
        discountPercentage: 10,
        minimumOrderValue: 0,
      },
    });
  });

  it("returns the row's real percentage, not the storefront's 10% fallback", async () => {
    const res = (await controller([discountRow({ discountPercentage: 35 })]).applyCoupon(
      tenant,
      "REAL10",
      undefined,
    )) as unknown as { payload: { discountPercentage: number } };

    expect(res.payload.discountPercentage).toBe(35);
  });

  it("checks the minimum order value when a cartTotal IS supplied", async () => {
    const res = await controller([discountRow({ minimumOrderValue: 1000 })]).applyCoupon(tenant, "REAL10", {
      cartTotal: 2500,
    });
    expect(res).toMatchObject({ success: true, message: "voucher applied!" });
  });
});

describe("POST /apply/coupon/:code — rejections", () => {
  it("rejects an unknown code with no payload, never a zero-discount success", async () => {
    const res = await controller([]).applyCoupon(tenant, "MADEUP", undefined);
    expect(res).toEqual({ success: false, message: "invalid voucher code!" });
    expect(res).not.toHaveProperty("payload");
  });

  it("rejects an inactive coupon", async () => {
    await expect(controller([discountRow({ active: false })]).applyCoupon(tenant, "REAL10", undefined)).resolves.toEqual(
      { success: false, message: "voucher is not applicable!" },
    );
  });

  it("rejects an expired coupon", async () => {
    const expired = discountRow({ startDate: Date.now() - 10 * DAY, endDate: Date.now() - 5 * DAY });
    await expect(controller([expired]).applyCoupon(tenant, "REAL10", undefined)).resolves.toEqual({
      success: false,
      message: "voucher is expired!",
    });
  });

  it("rejects a SINGLE-use coupon the tenant already redeemed", async () => {
    const single = discountRow({ usageType: "SINGLE" });
    await expect(controller([single], [{ id: 9n }]).applyCoupon(tenant, "REAL10", undefined)).resolves.toEqual({
      success: false,
      message: "voucher already used!",
    });
  });

  it("rejects a coupon with a minimum order value when no cart total was sent, and SAYS SO", async () => {
    const res = (await controller([discountRow({ minimumOrderValue: 1000 })]).applyCoupon(
      tenant,
      "REAL10",
      undefined,
    )) as { success: boolean; message: string };

    expect(res.success).toBe(false);
    // Not "minimum order value not satisfied" — the server never saw the cart.
    expect(res.message).toMatch(/cart total not supplied/);
  });

  it("reports a genuine below-minimum cart as below-minimum, not as an unknown cart", async () => {
    const res = (await controller([discountRow({ minimumOrderValue: 1000 })]).applyCoupon(tenant, "REAL10", {
      cartTotal: 999,
    })) as { success: boolean; message: string };

    expect(res.success).toBe(false);
    expect(res.message).toBe("minimum order value not satisfied!");
  });

  it("treats a non-numeric cartTotal as UNKNOWN, not as 0", async () => {
    const res = (await controller([discountRow({ minimumOrderValue: 1000 })]).applyCoupon(tenant, "REAL10", {
      cartTotal: "not-a-number",
    })) as { success: boolean; message: string };

    expect(res.message).toMatch(/cart total not supplied/);
  });
});

describe("POST /apply/coupon/:code — guards", () => {
  it("refuses without an authenticated tenant rather than checking a global usage history", async () => {
    await expect(controller([discountRow()]).applyCoupon(undefined, "REAL10", undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects a code shorter than Loom's 3-character minimum before touching the database", async () => {
    const db = makeDb([discountRow()]);
    const ctrl = new DiscountController(new DiscountService(db));
    await expect(ctrl.applyCoupon(tenant, "AB", undefined)).rejects.toBeInstanceOf(BadRequestException);
    expect((db as unknown as { select: ReturnType<typeof vi.fn> }).select).not.toHaveBeenCalled();
  });

  it("propagates a database failure instead of returning a rejection that reads as a real verdict", async () => {
    const db = {
      select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.reject(new Error("db down")) }) }) }),
      execute: vi.fn(),
    } as never as Database;

    await expect(
      new DiscountController(new DiscountService(db)).applyCoupon(tenant, "REAL10", undefined),
    ).rejects.toThrow("db down");
  });
});
