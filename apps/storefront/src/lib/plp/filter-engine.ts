import {
  PLPProduct,
  PLPMetadataInfo,
  FilterKey,
  FilterOption,
  FilterRangeOption,
  FilterControlGroup,
  FilterControls,
  FilterActiveChip,
} from "@/types/domain/plp";

export const FABRIC_FILTER_KEYS: FilterKey[] = [
  { key: "category", subKey: "category", name: "Hidden Category", type: "default" },
  { key: "inStock", name: "SHOW IN-STOCK ONLY", type: "toggle" },
  { key: "segment_category", subKey: "sub_category", name: "Craft", type: "sub" },
  { key: "color", name: "Color", type: "csv" },
  { key: "material", name: "Material", type: "csv" },
  { key: "pattern", name: "Pattern", type: "csv" },
  { key: "calculatedPrice", name: "Price", type: "range" },
  { key: "gsm", name: "GSM", type: "range" },
  { key: "total_quantity", name: "Availability", type: "range" },
];

export const FINISHED_FILTER_KEYS: FilterKey[] = [
  { key: "category", subKey: "category", name: "Hidden Category", type: "default" },
  { key: "inStock", name: "SHOW IN-STOCK ONLY", type: "toggle" },
  { key: "segment_category", subKey: "sub_category", name: "Category", type: "sub" },
  { key: "color", name: "Color", type: "csv" },
  { key: "material", name: "Material", type: "csv" },
  { key: "pattern", name: "Pattern", type: "csv" },
  { key: "calculatedPrice", name: "Price", type: "range" },
];

/**
 * Calculate product price and price with discount
 */
export function calculateProductPrice(product: PLPProduct): PLPProduct {
  const calcPrice = product.price || 0;
  return {
    ...product,
    calculatedPrice: calcPrice,
    // Restored 2026-08-12. Commit 9361c3b had replaced this with a literal
    // `undefined`, which meant no discount could ever render on the PLP even
    // though max_discount_* still populate and FilterProductPreview still has
    // the branch to display one. Covered by filter-engine.test.ts.
    calculatedDiscountedPrice: product.max_discount_product_price
      ? Math.round(calcPrice * (1 - (product.max_discount_product_discount || 0) / 100))
      : undefined,
  };
}

/**
 * Build filter control cohorts from product list
 */
export function prepareFilterControls(
  keys: FilterKey[],
  products: PLPProduct[],
  metadata: {
    colors: PLPMetadataInfo[];
    materials: PLPMetadataInfo[];
    patterns: PLPMetadataInfo[];
  }
): FilterControls {
  const cohorts: FilterControlGroup[] = [];

  for (const filterKey of keys) {
    if (filterKey.type === "toggle") {
      cohorts.push({
        title: filterKey.name,
        key: filterKey,
        cohort: {
          options: [{ key: 0, value: filterKey.name, active: false }],
        },
      });
    } else if (filterKey.type === "sub") {
      // Group by segment_category -> sub_category
      const optionsMap = new Map<string, Set<string>>();
      products.forEach((p) => {
        const seg = p.segment_category;
        const sub = p.sub_category;
        if (seg) {
          if (!optionsMap.has(seg)) {
            optionsMap.set(seg, new Set());
          }
          if (sub) {
            optionsMap.get(seg)!.add(sub);
          }
        }
      });

      const options: FilterOption[] = Array.from(optionsMap.entries()).map(
        ([segName, subSet], index) => ({
          key: index,
          value: segName,
          active: false,
          subOptions: Array.from(subSet).map((subName, subIdx) => ({
            key: subIdx,
            value: subName,
            active: false,
          })),
        })
      );

      cohorts.push({
        title: filterKey.name,
        key: filterKey,
        cohort: { options },
      });
    } else if (filterKey.type === "csv") {
      // Extract unique csv IDs
      const rawValues: string[] = [];
      products.forEach((p) => {
        const val = (p as any)[filterKey.key];
        if (val) rawValues.push(val);
      });
      const uniqueIds = Array.from(new Set(rawValues.join(",").split(","))).filter(Boolean);

      let metaList: PLPMetadataInfo[] = [];
      if (filterKey.key === "color") metaList = metadata.colors;
      else if (filterKey.key === "material") metaList = metadata.materials;
      else if (filterKey.key === "pattern") metaList = metadata.patterns;

      const options: FilterOption[] = uniqueIds.map((idStr, idx) => {
        const found = metaList.find((m) => String(m.id) === String(idStr));
        return {
          key: idx,
          value: idStr,
          displayName: found ? found.name : idStr,
          hex: found?.hex,
          active: false,
        };
      });

      cohorts.push({
        title: filterKey.name,
        key: filterKey,
        cohort: { options },
      });
    } else if (filterKey.type === "range") {
      const nums = products
        .map((p) => Number((p as any)[filterKey.key]) || 0)
        .filter((n) => !isNaN(n));

      const max = nums.length > 0 ? Math.max(...nums) : 1000;
      const min = nums.length > 0 ? Math.min(...nums) : 0;

      const rangeCohort: FilterRangeOption = {
        active: false,
        defaultMax: max,
        defaultMin: min,
        key: 1,
        max: max,
        min: min,
        minGap: 1,
        value1: min,
        value2: max,
      };

      cohorts.push({
        title: filterKey.name,
        key: filterKey,
        rangeCohort,
      });
    } else if (filterKey.type === "default" && filterKey.key !== "category") {
      const values = Array.from(
        new Set(products.map((p) => (p as any)[filterKey.key]).filter(Boolean))
      );
      const options: FilterOption[] = values.map((val, idx) => ({
        key: idx,
        value: String(val),
        active: false,
      }));
      cohorts.push({
        title: filterKey.name,
        key: filterKey,
        cohort: { options },
      });
    }
  }

  return { keys, cohorts };
}

/**
 * Filter products based on controls state
 */
export function filterProducts(
  products: PLPProduct[],
  controls: FilterControls
): PLPProduct[] {
  let result = [...products];

  controls.cohorts.forEach((group) => {
    const { key } = group;

    // Range Filter
    if (group.rangeCohort) {
      const { value1, value2, defaultMin, defaultMax } = group.rangeCohort;
      if (value1 > defaultMin || value2 < defaultMax) {
        result = result.filter((p) => {
          const val = Number((p as any)[key.key]) || 0;
          return val >= value1 && val <= value2;
        });
      }
    }

    if (!group.cohort) return;

    if (key.type === "toggle" && key.key === "inStock") {
      if (group.cohort.options[0]?.active) {
        result = result.filter((p) => {
          const hasQuantity = p.total_quantity > 0 || (p.quantity || 0) > 0;
          const hasSizeQty = (p.size_profile_option_list || []).some((s) => s.quantity > 0);
          const hasMto = (p.made_to_order_fabric_quantity || 0) > 0;
          return hasQuantity || hasSizeQty || hasMto;
        });
      }
    } else if (key.type === "sub") {
      const activeSubValues: string[] = [];
      group.cohort.options.forEach((parentOpt) => {
        if (parentOpt.subOptions) {
          parentOpt.subOptions.forEach((subOpt) => {
            if (subOpt.active) activeSubValues.push(subOpt.value.toLowerCase());
          });
        }
      });

      if (activeSubValues.length > 0) {
        result = result.filter((p) =>
          activeSubValues.includes((p.sub_category || "").toLowerCase())
        );
      }
    } else if (key.type === "csv") {
      const activeIds = group.cohort.options
        .filter((opt) => opt.active)
        .map((opt) => String(opt.value));

      if (activeIds.length > 0) {
        result = result.filter((p) => {
          const csvVal = (p as any)[key.key] || "";
          const productCsvSet = new Set(String(csvVal).split(","));
          return activeIds.some((id) => productCsvSet.has(id));
        });
      }
    } else if (key.type === "default" && key.key !== "category") {
      const activeValues = group.cohort.options
        .filter((opt) => opt.active)
        .map((opt) => opt.value.toLowerCase());

      if (activeValues.length > 0) {
        result = result.filter((p) =>
          activeValues.includes(String((p as any)[key.key] || "").toLowerCase())
        );
      }
    }
  });

  return result;
}

/**
 * Sort products according to selected sort option
 */
export function sortProducts(products: PLPProduct[], sortOption: string): PLPProduct[] {
  const copy = [...products];

  switch (sortOption) {
    case "availability":
      return copy.sort((a, b) => {
        const aInStock = a.total_quantity > 0 ? 1 : 0;
        const bInStock = b.total_quantity > 0 ? 1 : 0;
        return bInStock - aInStock;
      });

    case "new-arrival":
      return copy.sort((a, b) => (b.id || 0) - (a.id || 0));

    case "low-to-high":
      return copy.sort((a, b) => (a.calculatedPrice || a.price || 0) - (b.calculatedPrice || b.price || 0));

    case "high-to-low":
      return copy.sort((a, b) => (b.calculatedPrice || b.price || 0) - (a.calculatedPrice || a.price || 0));

    default:
      return copy;
  }
}

/**
 * Get active chips for pill display
 */
export function getActiveFilterChips(controls: FilterControls): FilterActiveChip[] {
  const chips: FilterActiveChip[] = [];

  controls.cohorts.forEach((group) => {
    if (group.rangeCohort) {
      const r = group.rangeCohort;
      if (r.value1 > r.defaultMin || r.value2 < r.defaultMax) {
        chips.push({
          name: group.title,
          type: "range",
          range: r,
        });
      }
    }

    if (!group.cohort) return;

    if (group.key.type === "sub") {
      group.cohort.options.forEach((parentOpt) => {
        if (parentOpt.subOptions) {
          parentOpt.subOptions.forEach((subOpt) => {
            if (subOpt.active) {
              chips.push({
                name: group.title,
                type: "sub",
                option: subOpt,
              });
            }
          });
        }
      });
    } else if (group.key.type === "csv" || group.key.type === "default") {
      group.cohort.options.forEach((opt) => {
        if (opt.active) {
          chips.push({
            name: group.title,
            type: group.key.type,
            option: opt,
          });
        }
      });
    }
  });

  return chips;
}

/**
 * Clear all filters in controls
 */
export function clearAllFilters(controls: FilterControls): FilterControls {
  const updatedCohorts = controls.cohorts.map((group) => {
    const copy = { ...group };

    if (copy.cohort) {
      copy.cohort = {
        options: copy.cohort.options.map((opt) => {
          const optCopy = { ...opt, active: false };
          if (optCopy.subOptions) {
            optCopy.subOptions = optCopy.subOptions.map((sub) => ({ ...sub, active: false }));
          }
          return optCopy;
        }),
      };
    }

    if (copy.rangeCohort) {
      copy.rangeCohort = {
        ...copy.rangeCohort,
        active: false,
        value1: copy.rangeCohort.defaultMin,
        value2: copy.rangeCohort.defaultMax,
      };
    }

    return copy;
  });

  return { ...controls, cohorts: updatedCohorts };
}
