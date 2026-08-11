import { describe, it, expect } from "vitest";
import { toInsertValues, toUpdateValues } from "./cart.mapper.js";
import { AddCartItemRequest } from "../dto/cart.dto.js";

function baseInput(overrides: Partial<AddCartItemRequest> = {}): AddCartItemRequest {
  return {
    selectedFinishId: "1,5,12",
    customSize: { width: 10 },
    productGroup: "fabric",
    orderType: "MADE_TO_ORDER",
    quantity: 2.5,
    unit: "METER",
    makingCharge: 15.5,
    clickId: "gclid-123",
    clickIdType: "gclid",
    clickCapturedAt: 1700000000000,
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "summer-sale",
    ...overrides,
  } as AddCartItemRequest;
}

describe("cart.mapper toInsertValues", () => {
  it("maps a fully-populated input onto insert values, stringifying quantity/makingCharge", () => {
    const values = toInsertValues(42, baseInput());
    expect(values.tenantId).toBe(42);
    expect(values.selectedFinishId).toBe("1,5,12");
    expect(values.customSize).toEqual({ width: 10 });
    expect(values.productGroup).toBe("fabric");
    expect(values.orderType).toBe("MADE_TO_ORDER");
    expect(values.quantity).toBe("2.5");
    expect(values.unit).toBe("METER");
    expect(values.makingCharge).toBe("15.5");
    expect(values.clickId).toBe("gclid-123");
    expect(values.utmSource).toBe("google");
    expect(typeof values.lastUpdatedAt).toBe("number");
  });

  it("defaults customSize to {} when absent", () => {
    const values = toInsertValues(1, baseInput({ customSize: undefined }));
    expect(values.customSize).toEqual({});
  });

  it("defaults makingCharge to \"0\" when absent (DB default 0.00)", () => {
    const values = toInsertValues(1, baseInput({ makingCharge: undefined }));
    expect(values.makingCharge).toBe("0");
  });

  it("defaults click/utm attribution fields to null when undefined", () => {
    const values = toInsertValues(1, baseInput({
      clickId: undefined,
      clickIdType: undefined,
      clickCapturedAt: undefined,
      utmSource: undefined,
      utmMedium: undefined,
      utmCampaign: undefined,
    }));
    expect(values.clickId).toBeNull();
    expect(values.clickIdType).toBeNull();
    expect(values.clickCapturedAt).toBeNull();
    expect(values.utmSource).toBeNull();
    expect(values.utmMedium).toBeNull();
    expect(values.utmCampaign).toBeNull();
  });

  it("does not set fabricProductId/finishedProductId/selectedFabricId/selectedSizeOptionId — those are attached separately by CartService after preview lookups", () => {
    const values = toInsertValues(1, baseInput({ fabricProductId: 999, selectedFabricId: 5 }));
    expect(values).not.toHaveProperty("fabricProductId");
    expect(values).not.toHaveProperty("finishedProductId");
    expect(values).not.toHaveProperty("selectedFabricId");
    expect(values).not.toHaveProperty("selectedSizeOptionId");
  });
});

describe("cart.mapper toUpdateValues", () => {
  it("writes only quantity and lastUpdatedAt (source quirk #1: every other field is intentionally left untouched on update)", () => {
    const values = toUpdateValues(9.5);
    expect(Object.keys(values).sort()).toEqual(["lastUpdatedAt", "quantity"]);
    expect(values.quantity).toBe("9.5");
    expect(typeof values.lastUpdatedAt).toBe("number");
  });
});
