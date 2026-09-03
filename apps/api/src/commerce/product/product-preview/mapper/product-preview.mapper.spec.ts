import { describe, it, expect } from "vitest";
import { toView } from "./product-preview.mapper.js";

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1n,
    version: 2n,
    subCategoryId: 3n,
    name: "Cotton Saree",
    slug: "cotton-saree",
    sku: "SKU1",
    price: "999.00",
    quantity: "10.00",
    externalQuantity: "5.00",
    unit: "METER",
    skuGroupId: 4n,
    specialStatusId: null,
    mainProductCheck: false,
    mainProductId: null,
    tagId: null,
    materialId: "m1",
    colorId: "c1",
    patternId: null,
    heroImage: null,
    hoverImage: null,
    heroImageAlt: "hero alt",
    hoverImageAlt: "hover alt",
    productOverview: "overview",
    productCare: "care",
    metaDescription: "meta",
    productGroup: "fabric",
    madeToOrderProfileId: null,
    madeToOrderProfileEnabled: false,
    madeToOrderFabricId: null,
    sizeProfileId: null,
    sizeProfileEnabled: false,
    volumeDiscountProfileId: null,
    volumeDiscountProfileEnabled: false,
    disabled: false,
    finishProfileId: null,
    finishProfileEnabled: false,
    finishProfileItemId: null,
    customSizeProfileId: null,
    customSizeProfileEnabled: false,
    ...overrides,
  } as any;
}

describe("product-preview.mapper toView", () => {
  it("coerces numeric-string columns to Number and computes totalQuantity as quantity + externalQuantity", () => {
    const out = toView(baseRow());
    expect(out.price).toBe(999);
    expect(out.quantity).toBe(10);
    expect(out.externalQuantity).toBe(5);
    expect(out.totalQuantity).toBe(15);
  });

  it("leaves category/segment null and defaults transient list fields to []", () => {
    const out = toView(baseRow());
    expect(out.category).toBeNull();
    expect(out.segment).toBeNull();
    expect(out.materials).toEqual([]);
    expect(out.colors).toEqual([]);
    expect(out.patterns).toEqual([]);
  });

  it("defaults nullable string fields (tagId/patternId/heroImage/hoverImage) to empty string", () => {
    const out = toView(baseRow());
    expect(out.tagId).toBe("");
    expect(out.patternId).toBe("");
    expect(out.heroImage).toBe("");
    expect(out.hoverImage).toBe("");
  });

  it("preserves null on nullable FK-id fields rather than coercing to 0", () => {
    const out = toView(baseRow());
    expect(out.specialStatusId).toBeNull();
    expect(out.mainProductId).toBeNull();
    expect(out.madeToOrderProfileId).toBeNull();
    expect(out.madeToOrderFabricId).toBeNull();
    expect(out.sizeProfileId).toBeNull();
    expect(out.volumeDiscountProfileId).toBeNull();
    expect(out.finishProfileId).toBeNull();
    expect(out.customSizeProfileId).toBeNull();
  });

  it("coerces a non-null nullable FK-id field to Number", () => {
    const out = toView(baseRow({ specialStatusId: 9n, mainProductId: 8n }));
    expect(out.specialStatusId).toBe(9);
    expect(out.mainProductId).toBe(8);
  });
});
