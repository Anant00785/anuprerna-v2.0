import { describe, it, expect } from "vitest";
import { mapFabricFilterPreviewRow, mapFinishedFilterPreviewRow } from "./filter.mapper.js";

describe("mapFabricFilterPreviewRow", () => {
  it("maps a fully populated row, coercing snake_case DB columns to camelCase fields", () => {
    const row = {
      id: 1, gsm: 120, product_id: 2, sku: "SKU1", name: "Fabric",
      price: 100, hero_image: "h.jpg", hover_image: "v.jpg", slug: "fabric",
      unit: "METER", material: "Cotton", color: "Red", pattern: "Solid",
      quantity: 5, is_main_product: true, segment_category: "seg", sub_category: "sub",
      category: "cat", special_status: "NEW", volume_discount: 10,
      volume_discount_minimum_order_quantity: 3, consumed_fabric: 2,
      minimum_order_quantity: 1, finish_profile_item_list: [{ a: 1 }],
      max_discount_product_price: 90, max_discount_product_discount: 5,
      made_to_order_fabric_quantity: 4, external_quantity: 0, total_quantity: 9,
      product_group: "fabric",
    };
    const out = mapFabricFilterPreviewRow(row);
    expect(out.id).toBe(1n);
    expect(out.productId).toBe(2n);
    expect(out.isMainProduct).toBe(true);
    expect(out.finishProfileItemList).toEqual([{ a: 1 }]);
    expect(out.productGroup).toBe("fabric");
  });

  it("defaults missing/undefined fields to zero-values instead of throwing", () => {
    const out = mapFabricFilterPreviewRow({});
    expect(out.id).toBe(0n);
    expect(out.gsm).toBe(0);
    expect(out.sku).toBe("");
    expect(out.isMainProduct).toBe(false);
    expect(out.finishProfileItemList).toBeNull();
  });
});

describe("mapFinishedFilterPreviewRow", () => {
  it("maps a fully populated row", () => {
    const row = { id: 5, sku: "SKU2", name: "Finished", price: 200, size_profile_id: 7 };
    const out = mapFinishedFilterPreviewRow(row);
    expect(out.id).toBe(5n);
    expect(out.sizeProfileId).toBe(7n);
    expect(out.price).toBe(200);
  });

  it("defaults missing fields to zero-values", () => {
    const out = mapFinishedFilterPreviewRow({});
    expect(out.id).toBe(0n);
    expect(out.sizeProfileId).toBe(0n);
    expect(out.madeToOrderFabricDiscount).toBeNull();
  });
});
