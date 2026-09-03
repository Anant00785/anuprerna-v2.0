import { describe, it, expect } from "vitest";
import { generateSlug, toInsertValues, toUpdateValues } from "./product.mapper.js";
import { ProductInput } from "../types/product.types.js";

function baseInput(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    subCategoryId: 1,
    name: "Cotton Saree",
    sku: "  SKU1  ",
    skuGroupId: 2,
    price: 999,
    unit: "METER" as any,
    mainProductCheck: false,
    productOverview: "overview",
    productCare: "care",
    materialId: "m1",
    colorId: "c1",
    productGroup: "fabric" as any,
    productVideo: "",
    ...overrides,
  } as ProductInput;
}

describe("generateSlug", () => {
  it("lowercases, strips non-alphanumerics to hyphens, and collapses/trims them", () => {
    expect(generateSlug("  Cotton Saree!! 100% ")).toBe("cotton-saree-100");
  });

  it("collapses consecutive separators into one hyphen", () => {
    expect(generateSlug("A -- B")).toBe("a-b");
  });
});

describe("product.mapper toInsertValues", () => {
  it("trims sku, regenerates slug from name, and defaults optional fields", () => {
    const values = toInsertValues(baseInput());
    expect(values.sku).toBe("SKU1");
    expect(values.slug).toBe("cotton-saree");
    expect(values.tagId).toBe("");
    expect(values.badgeProfileId).toBeNull();
    expect(values.badgeProfileEnabled).toBe(false);
    expect(values.discount).toBe("0");
    expect(values.quantity).toBe("0");
    expect(values.externalQuantity).toBe("0");
    expect(values.price).toBe("999");
  });

  it("nulls mainProductId when mainProductCheck is true, even if a mainProductId was supplied", () => {
    const values = toInsertValues(baseInput({ mainProductCheck: true, mainProductId: 42 }));
    expect(values.mainProductId).toBeNull();
  });

  it("passes through mainProductId when mainProductCheck is false", () => {
    const values = toInsertValues(baseInput({ mainProductCheck: false, mainProductId: 42 }));
    expect(values.mainProductId).toBe(42);
  });
});

describe("product.mapper toUpdateValues", () => {
  it("regenerates slug and trims sku when sku is provided", () => {
    const values = toUpdateValues(baseInput({ sku: " SKU2 " }));
    expect(values.slug).toBe("cotton-saree");
    expect(values.sku).toBe("SKU2");
  });

  it("leaves sku as-is (untrimmed, including null) when sku is null/undefined", () => {
    const values = toUpdateValues(baseInput({ sku: undefined as any }));
    expect(values.sku).toBeUndefined();
  });

  it("omits subCategoryId/skuGroupId/specialStatusId from the update set when absent or zero", () => {
    const values = toUpdateValues(baseInput({ subCategoryId: 0, skuGroupId: undefined as any, specialStatusId: undefined }));
    expect(values).not.toHaveProperty("subCategoryId");
    expect(values).not.toHaveProperty("skuGroupId");
    expect(values).not.toHaveProperty("specialStatusId");
  });

  it("includes subCategoryId/skuGroupId/specialStatusId when present and non-zero", () => {
    const values = toUpdateValues(baseInput({ subCategoryId: 5, skuGroupId: 6, specialStatusId: 7 }));
    expect(values.subCategoryId).toBe(5);
    expect(values.skuGroupId).toBe(6);
    expect(values.specialStatusId).toBe(7);
  });

  it("nulls badgeProfileId when disabled, even if an id was supplied", () => {
    const values = toUpdateValues(baseInput({ badgeProfileEnabled: false, badgeProfileId: 10 }));
    expect(values.badgeProfileId).toBeNull();
  });

  it("keeps badgeProfileId when enabled and non-zero", () => {
    const values = toUpdateValues(baseInput({ badgeProfileEnabled: true, badgeProfileId: 10 }));
    expect(values.badgeProfileId).toBe(10);
  });

  it("nulls badgeProfileId when enabled but id is 0", () => {
    const values = toUpdateValues(baseInput({ badgeProfileEnabled: true, badgeProfileId: 0 }));
    expect(values.badgeProfileId).toBeNull();
  });

  it("madeToOrder branch also sets madeToOrderFabricId when enabled, and nulls both when disabled", () => {
    const enabled = toUpdateValues(baseInput({
      madeToOrderProfileEnabled: true, madeToOrderProfileId: 3, madeToOrderFabricId: 4,
    }));
    expect(enabled.madeToOrderProfileId).toBe(3);
    expect(enabled.madeToOrderFabricId).toBe(4);

    const disabled = toUpdateValues(baseInput({
      madeToOrderProfileEnabled: false, madeToOrderProfileId: 3, madeToOrderFabricId: 4,
    }));
    expect(disabled.madeToOrderProfileId).toBeNull();
    expect(disabled.madeToOrderFabricId).toBeNull();
  });

  it("finishProfile branch resets finishProfileItemId to empty string when disabled", () => {
    const disabled = toUpdateValues(baseInput({
      finishProfileEnabled: false, finishProfileId: 3, finishProfileItemId: "item-1",
    }));
    expect(disabled.finishProfileId).toBeNull();
    expect(disabled.finishProfileItemId).toBe("");

    const enabled = toUpdateValues(baseInput({
      finishProfileEnabled: true, finishProfileId: 3, finishProfileItemId: "item-1",
    }));
    expect(enabled.finishProfileId).toBe(3);
    expect(enabled.finishProfileItemId).toBe("item-1");
  });

  it("nulls mainProductId when mainProductCheck is true regardless of supplied mainProductId", () => {
    const values = toUpdateValues(baseInput({ mainProductCheck: true, mainProductId: 42 }));
    expect(values.mainProductId).toBeNull();
  });

  it("never writes productSpecificSizeProfile (no backing column, per source-gap note)", () => {
    const values = toUpdateValues(baseInput({ productSpecificSizeProfile: { foo: "bar" } as any }));
    expect(values).not.toHaveProperty("productSpecificSizeProfile");
  });
});
