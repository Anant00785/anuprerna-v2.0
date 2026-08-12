import { describe, it, expect } from "vitest";
import { validateCartItem } from "./cart-item.validator.js";
import { CartItemInput } from "../types/cart.types.js";

// Rules per docs/backend/commerce/02-api-documentation.md row A6 (CartItemValidator):
//  1. productGroup in {fabric,swatch} -> fabricProductId required & non-zero
//  2. productGroup == finished -> finishedProductId required & non-zero
//  3. unit must be a valid UNIT_ENUM
//  4. orderType must be a valid ORDER_TYPE
//  5. quantity >= 0.5

function baseItem(overrides: Partial<CartItemInput> = {}): CartItemInput {
  return {
    fabricProductId: 100,
    selectedFinishId: "",
    customSize: {},
    productGroup: "fabric",
    orderType: "IN_STOCK",
    quantity: 1,
    unit: "METER",
    ...overrides,
  };
}

describe("validateCartItem", () => {
  it("accepts a fully valid fabric item", () => {
    expect(validateCartItem(baseItem())).toBe(true);
  });

  it("accepts a fully valid finished item with finishedProductId set", () => {
    expect(
      validateCartItem(
        baseItem({ productGroup: "finished", fabricProductId: undefined, finishedProductId: 55 })
      )
    ).toBe(true);
  });

  it("rejects productGroup=fabric with no fabricProductId", () => {
    expect(validateCartItem(baseItem({ fabricProductId: undefined }))).toBe(false);
  });

  it("rejects productGroup=fabric with fabricProductId=0", () => {
    expect(validateCartItem(baseItem({ fabricProductId: 0 }))).toBe(false);
  });

  it("rejects productGroup=swatch with fabricProductId null", () => {
    expect(validateCartItem(baseItem({ productGroup: "swatch", fabricProductId: null }))).toBe(false);
  });

  it("accepts productGroup=swatch with a non-zero fabricProductId", () => {
    expect(validateCartItem(baseItem({ productGroup: "swatch", fabricProductId: 7 }))).toBe(true);
  });

  it("rejects productGroup=finished with no finishedProductId", () => {
    expect(
      validateCartItem(baseItem({ productGroup: "finished", fabricProductId: undefined }))
    ).toBe(false);
  });

  it("rejects productGroup=finished with finishedProductId=0", () => {
    expect(
      validateCartItem(baseItem({ productGroup: "finished", fabricProductId: undefined, finishedProductId: 0 }))
    ).toBe(false);
  });

  it("does not require fabric/finished id for any other productGroup value (source has no else/default rejection branch)", () => {
    expect(
      validateCartItem(baseItem({ productGroup: "misc", fabricProductId: undefined, finishedProductId: undefined }))
    ).toBe(true);
  });

  it("rejects an invalid unit", () => {
    expect(validateCartItem(baseItem({ unit: "KG" as unknown as CartItemInput["unit"] }))).toBe(false);
  });

  it("accepts the other valid unit (UNIT)", () => {
    expect(validateCartItem(baseItem({ unit: "UNIT" }))).toBe(true);
  });

  it("rejects an invalid orderType", () => {
    expect(validateCartItem(baseItem({ orderType: "SUBSCRIPTION" as unknown as CartItemInput["orderType"] }))).toBe(false);
  });

  it("accepts every valid orderType (MADE_TO_ORDER, PRE_ORDER)", () => {
    expect(validateCartItem(baseItem({ orderType: "MADE_TO_ORDER" }))).toBe(true);
    expect(validateCartItem(baseItem({ orderType: "PRE_ORDER" }))).toBe(true);
  });

  it("boundary: quantity = 0.5 passes", () => {
    expect(validateCartItem(baseItem({ quantity: 0.5 }))).toBe(true);
  });

  it("boundary: quantity = 0.49 fails", () => {
    expect(validateCartItem(baseItem({ quantity: 0.49 }))).toBe(false);
  });

  it("rejects a negative quantity", () => {
    expect(validateCartItem(baseItem({ quantity: -1 }))).toBe(false);
  });
});
