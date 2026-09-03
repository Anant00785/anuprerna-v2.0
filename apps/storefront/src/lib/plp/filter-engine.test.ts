import { describe, it, expect } from "vitest";
import {
  calculateProductPrice,
  prepareFilterControls,
  filterProducts,
  sortProducts,
  getActiveFilterChips,
  clearAllFilters,
  rangeParamKey,
  serializeRange,
  applyRangeParam,
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
  it("sets calculatedPrice from price for fabric products, no discount fields untouched", () => {
    const result = calculateProductPrice(makeProduct({ price: 200, calculatedPrice: undefined }));
    expect(result.calculatedPrice).toBe(200);
    expect(result.calculatedDiscountedPrice).toBeUndefined();
  });

  // Angular PLP only sets calculatedDiscountedPrice from wholesale program percentileDiscount,
  // not from max_discount fields. So max_discount fields should NOT produce a discounted price.
  it("does NOT compute discounted price from max_discount fields (wholesale-only in Angular)", () => {
    const result = calculateProductPrice(
      makeProduct({ price: 200, calculatedPrice: 200, max_discount_product_price: 200, max_discount_product_discount: 25 })
    );
    expect(result.calculatedDiscountedPrice).toBeUndefined();
  });

  it("preserves API-provided calculatedDiscountedPrice when present", () => {
    const result = calculateProductPrice(makeProduct({ price: 200, calculatedPrice: 200, calculatedDiscountedPrice: 150 }));
    expect(result.calculatedDiscountedPrice).toBe(150);
  });

  it("returns no discounted price when max_discount_product_price is absent", () => {
    const result = calculateProductPrice(makeProduct({ price: 200, calculatedPrice: 200, max_discount_product_discount: 25 }));
    expect(result.calculatedDiscountedPrice).toBeUndefined();
  });

  it("defaults price-less product to calculatedPrice 0", () => {
    const result = calculateProductPrice(makeProduct({ price: undefined as unknown as number, calculatedPrice: undefined }));
    expect(result.calculatedPrice).toBe(0);
  });

  // Angular: selectedFabricPrice = made_to_order_fabric_price || product.price
  // calculatedPrice = product.price + (selectedFabricPrice * consumedFabric)
  it("calculates finished product price as basePrice + (fabricPrice * consumedFabric)", () => {
    const result = calculateProductPrice(
      makeProduct({
        price: 1625,
        made_to_order_fabric_price: 1625,
        calculatedPrice: undefined,
        product_group: "finished",
        size_profile_option_list: [
          { size_profile_option_consumed_fabric: 1.7 } as any,
        ],
      })
    );
    // 1625 + (1625 * 1.7) = 1625 + 2762.5 = 4387.5
    expect(result.calculatedPrice).toBe(4387.5);
  });

  it("uses made_to_order_fabric_price when present for finished product", () => {
    const result = calculateProductPrice(
      makeProduct({
        price: 1700,
        made_to_order_fabric_price: 371,
        made_to_order_profile_consumed_fabric: 0.5,
        calculatedPrice: undefined,
        product_group: "finished",
      } as any)
    );
    // 1700 + (371 * 0.5) = 1700 + 185.5 = 1885.5
    expect(result.calculatedPrice).toBe(1885.5);
  });

  it("falls back to product.price as fabric price when no MTO fabric price for finished product", () => {
    const result = calculateProductPrice(
      makeProduct({
        price: 500,
        calculatedPrice: undefined,
        product_group: "finished",
        // No made_to_order_fabric_price → falls back to product.price (500)
        // Default consumedFabric = 1
      })
    );
    // Angular: 500 + (500 * 1) = 1000
    expect(result.calculatedPrice).toBe(1000);
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

  // Regression: selecting a sub-option used to OR against the whole parent
  // segment, so checking one craft (e.g. "Handloom Jacquard") returned every
  // product under its parent ("Embroidery Technique") — 513 instead of 162 on
  // the live fabric PLP. A sub-option selection must narrow to that sub-option.
  it("narrows to the selected sub-option even when its parent is also active", () => {
    const controls = controlsFor(products);
    const sub = controls.cohorts.find((c) => c.key.key === "segment_category");
    const parent = sub!.cohort!.options.find((o) => o.value === "Sarees")!;
    parent.active = true;
    parent.subOptions?.forEach((s) => {
      s.active = s.value === "Silk";
    });
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it("returns the whole parent segment when a parent is active with no sub-option selected", () => {
    const controls = controlsFor(products);
    const sub = controls.cohorts.find((c) => c.key.key === "segment_category");
    const parent = sub!.cohort!.options.find((o) => o.value === "Sarees")!;
    parent.active = true;
    parent.subOptions?.forEach((s) => {
      s.active = false;
    });
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id).sort()).toEqual([1, 2]);
  });

  it("unions sub-options selected across different parent segments", () => {
    const controls = controlsFor(products);
    const sub = controls.cohorts.find((c) => c.key.key === "segment_category");
    sub!.cohort!.options.forEach((parentOpt) => {
      parentOpt.subOptions?.forEach((s) => {
        if (s.value === "Silk" || s.value === "Wool") s.active = true;
      });
    });
    const result = filterProducts(products, controls);
    expect(result.map((p) => p.id).sort()).toEqual([1, 3]);
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

// ---------------------------------------------------------------------------
// Range <-> URL round trip.
//
// The PLP rebuilds its filter controls from the catalogue on EVERY searchParams
// change. Ranges had no representation in the URL, so that rebuild reset
// value1/value2 to the full bounds: dragging the price slider and then touching
// any other control (a checkbox, sort, a page change) silently dropped the price
// filter, leaving the chip and the visible products disagreeing.
// ---------------------------------------------------------------------------
describe("range URL round trip", () => {
  const products = [
    makeProduct({ id: 1, calculatedPrice: 654 }),
    makeProduct({ id: 2, calculatedPrice: 9729 }),
    makeProduct({ id: 3, calculatedPrice: 16700 }),
  ];

  it("names the price param `price`, not the internal calculatedPrice field", () => {
    expect(rangeParamKey("calculatedPrice")).toBe("price");
    expect(rangeParamKey("gsm")).toBe("gsm");
    expect(rangeParamKey("total_quantity")).toBe("total_quantity");
  });

  it("does not serialise a range still at its full bounds — that is not a filter", () => {
    const controls = controlsFor(products);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    expect(serializeRange(price.rangeCohort!)).toBeNull();
  });

  it("serialises a narrowed range as from-to", () => {
    const controls = controlsFor(products);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    price.rangeCohort!.value1 = 9729;
    expect(serializeRange(price.rangeCohort!)).toBe("9729-16700");
  });

  it("SURVIVES a controls rebuild: the filter still applies after re-preparing from the URL", () => {
    // The user narrows the price range.
    const controls = controlsFor(products);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    price.rangeCohort!.value1 = 9729;
    const serialized = serializeRange(price.rangeCohort!);
    expect(filterProducts(products, controls)).toHaveLength(2);

    // Anything that changes searchParams rebuilds the controls from scratch.
    const rebuilt = controlsFor(products);
    const rebuiltPrice = rebuilt.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    applyRangeParam(rebuiltPrice.rangeCohort!, serialized);

    expect(rebuiltPrice.rangeCohort!.value1).toBe(9729);
    expect(filterProducts(products, rebuilt)).toHaveLength(2);
  });

  it("clamps an out-of-range URL value to the catalogue bounds", () => {
    const controls = controlsFor(products);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    applyRangeParam(price.rangeCohort!, "-5-999999");
    expect(price.rangeCohort!.value1).toBeGreaterThanOrEqual(price.rangeCohort!.defaultMin);
    expect(price.rangeCohort!.value2).toBeLessThanOrEqual(price.rangeCohort!.defaultMax);
  });

  it("ignores a malformed or inverted URL value rather than filtering everything away", () => {
    const controls = controlsFor(products);
    const price = controls.cohorts.find((c) => c.key.key === "calculatedPrice")!;
    const { value1, value2 } = price.rangeCohort!;

    applyRangeParam(price.rangeCohort!, "abc");
    applyRangeParam(price.rangeCohort!, "");
    applyRangeParam(price.rangeCohort!, null);
    expect(price.rangeCohort!.value1).toBe(value1);
    expect(price.rangeCohort!.value2).toBe(value2);

    // Inverted (to < from) would otherwise select nothing at all.
    applyRangeParam(price.rangeCohort!, "16700-654");
    expect(filterProducts(products, controls)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Mega-menu deep links.
//
// The header links to a SUB-CATEGORY by name (`?craft=handloom-jacquard` for
// fabric, `?sub=...` for finished), but the PLP's URL decoder only ever looked
// for a PARENT-segment key (`?embroidery-technique=...`). Nothing matched, so
// every mega-menu link landed on "Showing 0 Products" with the products sitting
// right there in the feed. This pins the sub-option matching the decoder relies
// on: slug-insensitive, and scoped to the sub-options, not the parents.
// ---------------------------------------------------------------------------
describe("sub-category deep link matching", () => {
  const products = [
    makeProduct({ id: 1, segment_category: "EMBROIDERY TECHNIQUE", sub_category: "HANDLOOM JACQUARD" }),
    makeProduct({ id: 2, segment_category: "EMBROIDERY TECHNIQUE", sub_category: "HANDLOOM JACQUARD" }),
    makeProduct({ id: 3, segment_category: "EMBROIDERY TECHNIQUE", sub_category: "KANTHA EMBROIDERY" }),
    makeProduct({ id: 4, segment_category: "DYED PLAIN WEAVES", sub_category: "HANDWOVEN LINEN" }),
  ];

  /** The decoder's matching rule, as ProductListingPage applies it. */
  const activateSub = (controls: FilterControls, slugValue: string) => {
    const wanted = slugValue.split(",").map((v) => v.trim().toLowerCase().replace(/[\s-]+/g, ""));
    controls.cohorts.forEach((g) => {
      if (g.key.type !== "sub" || !g.cohort) return;
      g.cohort.options.forEach((p) =>
        p.subOptions?.forEach((sub) => {
          if (wanted.includes(sub.value.toLowerCase().replace(/[\s-]+/g, ""))) sub.active = true;
        })
      );
    });
  };

  it("a hyphenated slug selects the matching sub-category and nothing else", () => {
    const controls = controlsFor(products);
    activateSub(controls, "handloom-jacquard");
    const out = filterProducts(products, controls);
    expect(out).toHaveLength(2);
    expect(out.every((p) => p.sub_category === "HANDLOOM JACQUARD")).toBe(true);
  });

  it("does NOT widen to the whole parent segment", () => {
    const controls = controlsFor(products);
    activateSub(controls, "kantha-embroidery");
    // 3 products share the EMBROIDERY TECHNIQUE parent; only 1 is Kantha.
    expect(filterProducts(products, controls)).toHaveLength(1);
  });

  it("an unknown slug activates nothing rather than emptying the grid", () => {
    const controls = controlsFor(products);
    activateSub(controls, "no-such-craft");
    expect(filterProducts(products, controls)).toHaveLength(products.length);
  });
});
