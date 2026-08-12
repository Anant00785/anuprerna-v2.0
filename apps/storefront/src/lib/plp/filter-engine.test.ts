import { describe, it, expect } from "vitest";
import {
  calculateProductPrice,
  prepareFilterControls,
  filterProducts,
  sortProducts,
  getActiveFilterChips,
  clearAllFilters,
  FABRIC_FILTER_KEYS,
} from "./filter-engine";
import { PLPProduct, PLPMetadataInfo, FilterControls } from "@/types/domain/plp";

function makeProduct(overrides: Partial<PLPProduct> = {}): PLPProduct {
  return {
    id: 1,
    product_id: 1,
    sku: "SKU-1",
    name: "Product 1",
    price: 100,
    hero_image: "img.jpg",
    slug: "product-1",
    unit: "mtr",
    total_quantity: 10,
    segment_category: "Sarees",
    sub_category: "Silk",
    category: "fabric",
    product_group: "fabric",
    calculatedPrice: 100,
    ...overrides,
  };
}

const metadata = {
  colors: [{ id: 1, name: "Red" }] as PLPMetadataInfo[],
  materials: [{ id: 2, name: "Cotton" }] as PLPMetadataInfo[],
  patterns: [{ id: 3, name: "Striped" }] as PLPMetadataInfo[],
};

describe("calculateProductPrice", () => {
  it("sets calculatedPrice from price, no discount fields untouched", () => {
    const result = calculateProductPrice(makeProduct({ price: 200 }));
    expect(result.calculatedPrice).toBe(200);
    expect(result.calculatedDiscountedPrice).toBeUndefined();
  });

  // Regression guard. Commit 9361c3b replaced this computation with a literal
  // `undefined`, so no discount could render on the PLP; restored 2026-08-12.
  // If this fails again, the calculation has been removed a second time.
  it("computes discounted price when max_discount fields present", () => {
    const result = calculateProductPrice(
      makeProduct({ price: 200, max_discount_product_price: 200, max_discount_product_discount: 25 })
    );
    expect(result.calculatedDiscountedPrice).toBe(150);
  });

  it("returns no discounted price when max_discount_product_price is absent", () => {
    const result = calculateProductPrice(makeProduct({ price: 200, max_discount_product_discount: 25 }));
    expect(result.calculatedDiscountedPrice).toBeUndefined();
  });

  it("treats a missing discount percentage as zero, not as a free product", () => {
    const result = calculateProductPrice(makeProduct({ price: 200, max_discount_product_price: 200 }));
    expect(result.calculatedDiscountedPrice).toBe(200);
  });

  it("defaults price-less product to calculatedPrice 0", () => {
    const result = calculateProductPrice(makeProduct({ price: undefined as unknown as number }));
    expect(result.calculatedPrice).toBe(0);
  });
});

describe("prepareFilterControls", () => {
  const products = [
    makeProduct({ id: 1, color: "1", material: "2", pattern: "3", segment_category: "Sarees", sub_category: "Silk", calculatedPrice: 100, gsm: 80, total_quantity: 5 }),
    makeProduct({ id: 2, color: "1,4", material: "2", pattern: "3", segment_category: "Sarees", sub_category: "Cotton", calculatedPrice: 300, gsm: 120, total_quantity: 0 }),
  ];

  it("builds a toggle cohort with a single inactive option", () => {
    const controls = prepareFilterControls(FABRIC_FILTER_KEYS, products, metadata);
    const toggle = controls.cohorts.find((c) => c.key.key === "inStock");
    expect(toggle?.cohort?.options).toHaveLength(1);
    expect(toggle?.cohort?.options[0].active).toBe(false);
  });

  it("groups sub-category options under their parent segment", () => {
    const controls = prepareFilterControls(FABRIC_FILTER_KEYS, products, metadata);
    const sub = controls.cohorts.find((c) => c.key.key === "segment_category");
    expect(sub?.cohort?.options).toHaveLength(1);
    expect(sub?.cohort?.options[0].value).toBe("Sarees");
    expect(sub?.cohort?.options[0].subOptions?.map((o) => o.value).sort()).toEqual(["Cotton", "Silk"]);
  });

  it("splits csv values, dedupes, and resolves display names from metadata", () => {
    const controls = prepareFilterControls(FABRIC_FILTER_KEYS, products, metadata);
    const color = controls.cohorts.find((c) => c.key.key === "color");
    const values = color?.cohort?.options.map((o) => o.value).sort();
    expect(values).toEqual(["1", "4"]);
    const red = color?.cohort?.options.find((o) => o.value === "1");
    expect(red?.displayName).toBe("Red");
  });

  it("falls back to the raw id as displayName when metadata has no match", () => {
    const controls = prepareFilterControls(FABRIC_FILTER_KEYS, products, metadata);
    const color = controls.cohorts.find((c) => c.key.key === "color");
    const unknown = color?.cohort?.options.find((o) => o.value === "4");
    expect(unknown?.displayName).toBe("4");
  });

  it("computes range min/max from actual product values", () => {
    const controls = prepareFilterControls(FABRIC_FILTER_KEYS, products, metadata);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice");
    expect(price?.rangeCohort?.min).toBe(100);
    expect(price?.rangeCohort?.max).toBe(300);
    expect(price?.rangeCohort?.value1).toBe(100);
    expect(price?.rangeCohort?.value2).toBe(300);
  });

  it("defaults range min/max to 0/1000 when no products supplied", () => {
    const controls = prepareFilterControls(FABRIC_FILTER_KEYS, [], metadata);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice");
    expect(price?.rangeCohort?.min).toBe(0);
    expect(price?.rangeCohort?.max).toBe(1000);
  });

  it("skips the hidden 'category' default filter key", () => {
    const controls = prepareFilterControls(FABRIC_FILTER_KEYS, products, metadata);
    expect(controls.cohorts.find((c) => c.key.key === "category")).toBeUndefined();
  });
});

// Helper to build a ready-to-filter FilterControls from products, then flip options active.
function controlsFor(products: PLPProduct[]): FilterControls {
  return prepareFilterControls(FABRIC_FILTER_KEYS, products, metadata);
}

function activateOption(controls: FilterControls, filterKey: string, value: string) {
  const group = controls.cohorts.find((c) => c.key.key === filterKey);
  const opt = group?.cohort?.options.find((o) => o.value === value);
  if (opt) opt.active = true;
}

describe("filterProducts", () => {
  const products = [
    makeProduct({ id: 1, color: "1", material: "2", pattern: "3", segment_category: "Sarees", sub_category: "Silk", calculatedPrice: 100, total_quantity: 5 }),
    makeProduct({ id: 2, color: "4", material: "5", pattern: "6", segment_category: "Sarees", sub_category: "Cotton", calculatedPrice: 300, total_quantity: 0 }),
    makeProduct({ id: 3, color: "1,4", material: "2", pattern: "6", segment_category: "Stoles", sub_category: "Wool", calculatedPrice: 500, total_quantity: 0 }),
  ];

  it("returns every product unchanged when no filters are active", () => {
    const controls = controlsFor(products);
    expect(filterProducts(products, controls)).toHaveLength(3);
  });

  it("filters by a single active csv option (color)", () => {
    const controls = controlsFor(products);
    activateOption(controls, "color", "4");
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id).sort()).toEqual([2, 3]);
  });

  it("filters by sub-category (segment_category -> sub_category)", () => {
    const controls = controlsFor(products);
    const sub = controls.cohorts.find((c) => c.key.key === "segment_category");
    sub?.cohort?.options[0].subOptions?.forEach((s) => {
      if (s.value === "Silk") s.active = true;
    });
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it("filters inStock toggle to products with quantity > 0", () => {
    const controls = controlsFor(products);
    const toggle = controls.cohorts.find((c) => c.key.key === "inStock");
    toggle!.cohort!.options[0].active = true;
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it("treats size_profile_option_list quantity as in-stock even when total_quantity is 0", () => {
    const withSizeStock = [
      makeProduct({ id: 4, total_quantity: 0, size_profile_option_list: [{ quantity: 2 }] }),
    ];
    const controls = controlsFor(withSizeStock);
    const toggle = controls.cohorts.find((c) => c.key.key === "inStock");
    toggle!.cohort!.options[0].active = true;
    expect(filterProducts(withSizeStock, controls)).toHaveLength(1);
  });

  it("filters by price range, inclusive of both bounds", () => {
    const controls = controlsFor(products);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    price.rangeCohort!.value1 = 100;
    price.rangeCohort!.value2 = 300;
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id).sort()).toEqual([1, 2]);
  });

  it("excludes a product exactly one unit outside the range bound", () => {
    const controls = controlsFor(products);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    price.rangeCohort!.value1 = 101;
    price.rangeCohort!.value2 = 300;
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id)).not.toContain(1);
  });

  it("does not apply a range filter still at its default bounds", () => {
    const controls = controlsFor(products);
    const result = filterProducts(products, controls);
    expect(result).toHaveLength(3);
  });

  it("combines a csv filter and a range filter with AND semantics", () => {
    const controls = controlsFor(products);
    activateOption(controls, "material", "2");
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    price.rangeCohort!.value1 = 400;
    price.rangeCohort!.value2 = 500;
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id)).toEqual([3]);
  });

  it("returns an empty array when combined filters match nothing", () => {
    const controls = controlsFor(products);
    activateOption(controls, "color", "1");
    activateOption(controls, "material", "5");
    const result = filterProducts(products, controls);
    expect(result).toEqual([]);
  });

  it("matches csv product if it shares any one of multiple active ids", () => {
    const controls = controlsFor(products);
    activateOption(controls, "color", "1");
    activateOption(controls, "color", "4");
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id).sort()).toEqual([1, 2, 3]);
  });
});

describe("sortProducts", () => {
  const products = [
    makeProduct({ id: 1, total_quantity: 0, calculatedPrice: 300 }),
    makeProduct({ id: 2, total_quantity: 5, calculatedPrice: 100 }),
    makeProduct({ id: 3, total_quantity: 0, calculatedPrice: 200 }),
  ];

  it("sorts in-stock products first for 'availability'", () => {
    const result = sortProducts(products, "availability");
    expect(result[0].id).toBe(2);
  });

  it("sorts by descending id for 'new-arrival'", () => {
    const result = sortProducts(products, "new-arrival");
    expect(result.map((p) => p.id)).toEqual([3, 2, 1]);
  });

  it("sorts ascending price for 'low-to-high'", () => {
    const result = sortProducts(products, "low-to-high");
    expect(result.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it("sorts descending price for 'high-to-low'", () => {
    const result = sortProducts(products, "high-to-low");
    expect(result.map((p) => p.id)).toEqual([1, 3, 2]);
  });

  it("returns products unchanged (stable, no reorder) for an unknown sort key", () => {
    const result = sortProducts(products, "not-a-real-option");
    expect(result.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("does not mutate the input array", () => {
    const original = [...products];
    sortProducts(products, "new-arrival");
    expect(products).toEqual(original);
  });
});

describe("getActiveFilterChips", () => {
  const products = [
    makeProduct({ id: 1, color: "1", segment_category: "Sarees", sub_category: "Silk", calculatedPrice: 100 }),
    makeProduct({ id: 2, color: "4", segment_category: "Sarees", sub_category: "Cotton", calculatedPrice: 300 }),
  ];

  it("returns no chips when nothing is active", () => {
    const controls = controlsFor(products);
    expect(getActiveFilterChips(controls)).toEqual([]);
  });

  it("emits a csv chip for an active color option", () => {
    const controls = controlsFor(products);
    activateOption(controls, "color", "1");
    const chips = getActiveFilterChips(controls);
    expect(chips).toHaveLength(1);
    expect(chips[0].type).toBe("csv");
  });

  it("emits a range chip once the range is moved off its default", () => {
    const controls = controlsFor(products);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    price.rangeCohort!.value1 = 150;
    const chips = getActiveFilterChips(controls);
    expect(chips.some((c) => c.type === "range")).toBe(true);
  });

  it("emits a sub chip for an active sub-category option", () => {
    const controls = controlsFor(products);
    const sub = controls.cohorts.find((c) => c.key.key === "segment_category");
    sub!.cohort!.options[0].subOptions![0].active = true;
    const chips = getActiveFilterChips(controls);
    expect(chips.some((c) => c.type === "sub")).toBe(true);
  });
});

describe("clearAllFilters", () => {
  it("resets active options, sub-options, and range bounds back to defaults", () => {
    const products = [makeProduct({ color: "1", segment_category: "Sarees", sub_category: "Silk", calculatedPrice: 100 })];
    const controls = controlsFor(products);
    activateOption(controls, "color", "1");
    const sub = controls.cohorts.find((c) => c.key.key === "segment_category")!;
    sub.cohort!.options[0].subOptions![0].active = true;
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    price.rangeCohort!.value1 = 999;

    const cleared = clearAllFilters(controls);
    expect(getActiveFilterChips(cleared)).toEqual([]);
    const clearedPrice = cleared.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    expect(clearedPrice.rangeCohort!.value1).toBe(clearedPrice.rangeCohort!.defaultMin);
  });
});
