import { describe, it, expect } from "vitest";
import { toView } from "./product-search-preview.mapper.js";

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1n,
    version: 2n,
    name: "Cotton Saree",
    sku: "SKU1",
    price: "999.00",
    skuGroupId: 4n,
    specialStatusId: null,
    mainProductCheck: false,
    mainProductId: null,
    ...overrides,
  } as any;
}

describe("product-search-preview.mapper toView", () => {
  it("coerces id/version/price/skuGroupId to Number and preserves null FK ids", () => {
    const out = toView(baseRow());
    expect(out).toEqual({
      id: 1,
      version: 2,
      name: "Cotton Saree",
      sku: "SKU1",
      price: 999,
      skuGroupId: 4,
      specialStatusId: null,
      mainProductCheck: false,
      mainProductId: null,
    });
  });

  it("coerces non-null specialStatusId/mainProductId to Number", () => {
    const out = toView(baseRow({ specialStatusId: 9n, mainProductId: 8n }));
    expect(out.specialStatusId).toBe(9);
    expect(out.mainProductId).toBe(8);
  });
});
