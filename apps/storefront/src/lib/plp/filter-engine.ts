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
 * Calculate product price matching legacy Angular _calculateProductPrice / ProductListPriceCalculationService
 */
export function calculateProductPrice(product: PLPProduct): PLPProduct {
  const productBasePrice = Number(product.price || 0);
  const isFinished =
    product.product_group === "finished" ||
    (product.category && ["accessories", "home", "apparel"].includes(String(product.category).toLowerCase()));

  let calcPrice = productBasePrice;

  if (isFinished) {
    // 1. Selected Fabric Price (per meter):
    // Angular _calculateProductPrice line 206:
    //   selectedMadeToOrderFabricPrice = product.made_to_order_fabric_price
    //     ? product.made_to_order_fabric_price : product.price;
    // Falls back to product.price when no MTO fabric price exists.
    const rawFabricPrice =
      product.made_to_order_fabric_price ??
      (product as any).madeToOrderFabric?.price ??
      (product as any).made_to_order_fabric?.price;

    const selectedFabricPrice =
      rawFabricPrice !== undefined && rawFabricPrice !== null && !isNaN(Number(rawFabricPrice)) && Number(rawFabricPrice) > 0
        ? Number(rawFabricPrice)
        : productBasePrice;

    // 2. Consumed Fabric (matching FilterSortService.getConsumedFabric)
    let consumedFabric = 1;
    if (
      (product as any).product_size_profile_option_list &&
      (product as any).product_size_profile_option_list.length > 0 &&
      (product as any).product_size_profile_option_list[0].consumed_fabric
    ) {
      consumedFabric = Number((product as any).product_size_profile_option_list[0].consumed_fabric);
    } else if (
      product.size_profile_option_list &&
      product.size_profile_option_list.length > 0
    ) {
      const firstOption = product.size_profile_option_list[0] as any;
      if (firstOption.size_profile_option_consumed_fabric) {
        consumedFabric = Number(firstOption.size_profile_option_consumed_fabric);
      } else if (firstOption.consumed_fabric) {
        consumedFabric = Number(firstOption.consumed_fabric);
      } else if (firstOption.consumedFabric) {
        consumedFabric = Number(firstOption.consumedFabric);
      }
    } else if ((product as any).made_to_order_profile_consumed_fabric) {
      consumedFabric = Number((product as any).made_to_order_profile_consumed_fabric);
    } else if ((product as any).madeToOrderProfile?.consumedFabric) {
      consumedFabric = Number((product as any).madeToOrderProfile.consumedFabric);
    } else if (product.consumed_fabric !== undefined && product.consumed_fabric !== null) {
      consumedFabric = Number(product.consumed_fabric);
    }

    if (!consumedFabric || consumedFabric <= 0) consumedFabric = 1;

    // 3. Angular: product.calculatedPrice = product.price + fabricPrice;
    //    where fabricPrice = selectedFabricPrice * consumedFabric
    const fabricTotal = selectedFabricPrice * consumedFabric;
    calcPrice = productBasePrice + fabricTotal;
  }

  // Use API-provided calculatedPrice when available, else our computed value
  const roundedPrice = product.calculatedPrice ? Number(product.calculatedPrice) : Math.round(calcPrice * 100) / 100;

  // Angular PLP only sets calculatedDiscountedPrice from wholesale program percentileDiscount
  // (which requires login + wholesale membership). The max_discount fields are NOT used here.
  // We preserve whatever the API sends but don't compute our own.
  let calculatedDiscountedPrice: number | undefined = undefined;
  if (product.calculatedDiscountedPrice) {
    calculatedDiscountedPrice = Number(product.calculatedDiscountedPrice);
  }

  return {
    ...product,
    calculatedPrice: roundedPrice,
    calculatedDiscountedPrice,
  };
}

/**
 * URL parameter name for a range filter. `calculatedPrice` is an internal field
 * name, so the shopper-facing param is `price`; the others already read well.
 * Shared by the read and write sides of the PLP's URL sync so a range
 * round-trips instead of being silently reset.
 */
export function rangeParamKey(fieldKey: string): string {
  return fieldKey === "calculatedPrice" ? "price" : fieldKey;
}

/**
 * Serialise a range for the URL, or `null` when it is still at full bounds — an
 * un-narrowed range is not a filter and does not belong in the query string.
 */
export function serializeRange(range: FilterRangeOption): string | null {
  const { value1, value2, defaultMin, defaultMax } = range;
  if (value1 > defaultMin || value2 < defaultMax) return `${value1}-${value2}`;
  return null;
}

/**
 * Apply a `from-to` URL value onto a range cohort, clamped to the cohort's
 * catalogue-derived bounds. Bounds themselves are NEVER taken from the URL, so
 * a stale or hand-edited link cannot select an impossible window. A malformed
 * value leaves the range untouched.
 */
export function applyRangeParam(range: FilterRangeOption, raw: string | null | undefined): void {
  if (!raw) return;
  const [from, to] = raw.split("-").map((n) => Number(n));
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return;
  range.value1 = Math.max(range.defaultMin, Math.min(from, range.defaultMax));
  range.value2 = Math.min(range.defaultMax, Math.max(to, range.defaultMin));
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
      // A parent segment only widens the selection to its whole segment when
      // NONE of its own sub-options are selected. Once the shopper picks a
      // specific sub-option, that is the narrower intent and the parent must
      // not pull its siblings back in — selecting "Handloom Jacquard" (162)
      // previously returned all 513 products under "Embroidery Technique",
      // because the parent auto-activates when every sub is ticked and the
      // two lists were OR'd together.
      const activeParents: string[] = [];
      const activeSubValues: string[] = [];
      group.cohort.options.forEach((parentOpt) => {
        const activeSubs = (parentOpt.subOptions || []).filter((subOpt) => subOpt.active);
        activeSubs.forEach((subOpt) => {
          activeSubValues.push(subOpt.value.trim().toLowerCase());
        });
        if (parentOpt.active && activeSubs.length === 0) {
          activeParents.push(parentOpt.value.trim().toLowerCase());
        }
      });

      if (activeParents.length > 0 || activeSubValues.length > 0) {
        result = result.filter((p) => {
          const seg = (p.segment_category || "").trim().toLowerCase();
          const sub = (p.sub_category || "").trim().toLowerCase();
          return activeParents.includes(seg) || activeSubValues.includes(sub);
        });
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
