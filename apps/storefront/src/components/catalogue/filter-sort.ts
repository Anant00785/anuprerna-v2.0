// Pure filter/sort/paginate logic — NO server-only imports.
// Imported by both loom.ts (server) and CatalogueShell (client).
// Replicates live FilterSortService exactly.

import type { CatalogueProduct, CatalogueFacets, FilterState, SortKey } from './types';

function lc(arr: string[]): string[] {
  return arr.map((s) => s.toLowerCase());
}

function toSlug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Canonical facet map key for an option name. The FilterSidebar computes the
// SAME key to look up an option's count. Slug form (lowercase, spaces -> '-')
// so it is URL-safe and stable across the color/material/pattern/craft dims.
export function facetKey(name: string): string {
  return toSlug(name);
}

function tagMatch(filterVal: string, productTag: string): boolean {
  if (filterVal === productTag) return true;
  return filterVal === toSlug(productTag);
}

// ---------------------------------------------------------------------------
// Per-dimension match predicates. SHARED by applyFilterSortPage and
// computeFacets so a facet count is computed with EXACTLY the same semantics as
// the real filter — this is what guarantees facet-count == filtered-total.
// Each takes an already-lowercased selection list; empty list => matches all.
// ---------------------------------------------------------------------------
function craftMatch(craftLc: string[], p: CatalogueProduct): boolean {
  if (!craftLc.length) return true;
  const tags = [(p.subCategoryName ?? "").toLowerCase(), (p.segmentName ?? "").toLowerCase()];
  return craftLc.some((c) => tags.some((t) => tagMatch(c, t)));
}
function colorMatch(colorLc: string[], p: CatalogueProduct): boolean {
  if (!colorLc.length) return true;
  return p.colors.some((c) => colorLc.some((f) => tagMatch(f, c.name.toLowerCase())));
}
function materialMatch(materialLc: string[], p: CatalogueProduct): boolean {
  if (!materialLc.length) return true;
  return p.materials.some((m) => materialLc.some((f) => tagMatch(f, m.name.toLowerCase())));
}
function patternMatch(patternLc: string[], p: CatalogueProduct): boolean {
  if (!patternLc.length) return true;
  return p.patterns.some((pt) => patternLc.some((f) => tagMatch(f, pt.name.toLowerCase())));
}

function inRange(v: number, min: number | null, max: number | null): boolean {
  if (min != null && v < min) return false;
  if (max != null && v > max) return false;
  return true;
}

// The always-on, non-checkbox filters (stock toggle + the three ranges). These
// constrain EVERY facet dimension (they are never a faceted dimension itself).
function restMatch(state: FilterState, p: CatalogueProduct): boolean {
  if (state.stockOnly && p.totalQuantity <= 0) return false;
  if (!inRange(p.calculatedPrice, state.price.min, state.price.max)) return false;
  if (!inRange(p.gsm, state.gsm.min, state.gsm.max)) return false;
  if (!inRange(p.totalQuantity, state.availability.min, state.availability.max)) return false;
  return true;
}

// ---- live FilterSortService tie-breakers ----
function quantitySorting(a: CatalogueProduct, b: CatalogueProduct): number {
  return (b.totalQuantity > 0 ? 1 : 0) - (a.totalQuantity > 0 ? 1 : 0);
}
function mainProductSorting(a: CatalogueProduct, b: CatalogueProduct): number {
  return Number(b.isMainProduct) - Number(a.isMainProduct);
}
function latestSorting(a: CatalogueProduct, b: CatalogueProduct): number {
  return b.id - a.id;
}

function sortByAvailability(arr: CatalogueProduct[]): CatalogueProduct[] {
  return arr.sort((a, b) => {
    const q = quantitySorting(a, b);
    if (q === 0) {
      const m = mainProductSorting(a, b);
      return m === 0 ? latestSorting(a, b) : m;
    }
    return q;
  });
}
function sortByDate(arr: CatalogueProduct[]): CatalogueProduct[] {
  return arr.sort((a, b) => {
    const l = latestSorting(a, b);
    if (l === 0) {
      const m = mainProductSorting(a, b);
      return m === 0 ? quantitySorting(a, b) : m;
    }
    return l;
  });
}
function sortByLowPrice(arr: CatalogueProduct[]): CatalogueProduct[] {
  return arr.sort((a, b) => {
    const p = a.calculatedPrice - b.calculatedPrice;
    if (p === 0) {
      const m = mainProductSorting(a, b);
      return m === 0 ? quantitySorting(a, b) : m;
    }
    return p;
  });
}
function sortByHighPrice(arr: CatalogueProduct[]): CatalogueProduct[] {
  return arr.sort((a, b) => {
    const p = b.calculatedPrice - a.calculatedPrice;
    if (p === 0) {
      const m = mainProductSorting(a, b);
      return m === 0 ? quantitySorting(a, b) : m;
    }
    return p;
  });
}

export function applyFilterSortPage(
  all: CatalogueProduct[],
  state: FilterState,
  sort: SortKey,
  page: number,
  pageSize: number,
): { products: CatalogueProduct[]; total: number } {
  const craft = lc(state.craft);
  const color = lc(state.color);
  const material = lc(state.material);
  const pattern = lc(state.pattern);

  let filtered = all.filter((p) => {
    if (!restMatch(state, p)) return false;
    if (!craftMatch(craft, p)) return false;
    if (!colorMatch(color, p)) return false;
    if (!materialMatch(material, p)) return false;
    if (!patternMatch(pattern, p)) return false;
    return true;
  });

  const copy = [...filtered];
  switch (sort) {
    case 'low-to-high':
      filtered = sortByLowPrice(copy);
      break;
    case 'high-to-low':
      filtered = sortByHighPrice(copy);
      break;
    case 'new-arrival':
      filtered = sortByDate(copy);
      break;
    case 'recommended':
    case 'availability':
    default:
      // "Recommended" = the catalogue's curated/featured order. There is no
      // separate ranking signal in the slim payload, so it reuses the live
      // availability ordering (in-stock -> main-product -> newest).
      filtered = sortByAvailability(copy);
      break;
  }

  const total = filtered.length;
  const start = page * pageSize;
  const products = filtered.slice(start, start + pageSize);
  return { products, total };
}

// ---------------------------------------------------------------------------
// computeFacets — Amazon-style faceted counts.
//
// For EACH checkbox dimension D (craft, color, material, pattern) we count, per
// option of D, how many products match ALL OTHER active filters EXCEPT D's own
// selection. Excluding D's own selection is what lets a user multi-select
// within a dimension (OR semantics) without options in that dimension
// vanishing, AND it guarantees never-zero: an option reported with count N>0
// yields exactly N results when selected.
//
// Efficiency: per-product pass flags for each dimension are computed ONCE; then
// per dimension we build the "all-except-D" set once and loop its options over
// that reduced set. O(products) for the flags + O(options x reducedSet) per
// dimension over an in-memory array (no extra upstream calls).
// ---------------------------------------------------------------------------
interface FacetOptionSource {
  segments: Array<{ optionList?: Array<{ subCategoryName: string }> }>;
  colors: Array<{ name: string }>;
  materials: Array<{ name: string }>;
  patterns: Array<{ name: string }>;
}

export function computeFacets(
  products: CatalogueProduct[],
  state: FilterState,
  source: FacetOptionSource,
): CatalogueFacets {
  const craftSel = lc(state.craft);
  const colorSel = lc(state.color);
  const materialSel = lc(state.material);
  const patternSel = lc(state.pattern);

  const n = products.length;
  const pRest = new Array<boolean>(n);
  const pCraft = new Array<boolean>(n);
  const pColor = new Array<boolean>(n);
  const pMaterial = new Array<boolean>(n);
  const pPattern = new Array<boolean>(n);
  for (let i = 0; i < n; i++) {
    const p = products[i];
    pRest[i] = restMatch(state, p);
    pCraft[i] = craftMatch(craftSel, p);
    pColor[i] = colorMatch(colorSel, p);
    pMaterial[i] = materialMatch(materialSel, p);
    pPattern[i] = patternMatch(patternSel, p);
  }

  // Distinct option lists (leaf subCategoryName for craft).
  const craftOptions = Array.from(
    new Set(
      source.segments.flatMap((s) => (s.optionList ?? []).map((o) => o.subCategoryName)).filter(Boolean),
    ),
  );
  const colorOptions = source.colors.map((c) => c.name);
  const materialOptions = source.materials.map((m) => m.name);
  const patternOptions = source.patterns.map((p) => p.name);

  // Init every option to 0 so zero-count options are explicitly present (the UI
  // relies on this to gray-out/disable an option rather than hide it).
  const craft: Record<string, number> = {};
  const color: Record<string, number> = {};
  const material: Record<string, number> = {};
  const pattern: Record<string, number> = {};
  for (const o of craftOptions) craft[facetKey(o)] = 0;
  for (const o of colorOptions) color[facetKey(o)] = 0;
  for (const o of materialOptions) material[facetKey(o)] = 0;
  for (const o of patternOptions) pattern[facetKey(o)] = 0;

  // craft facet: all filters EXCEPT craft's own selection.
  const baseExceptCraft: CatalogueProduct[] = [];
  for (let i = 0; i < n; i++) if (pRest[i] && pColor[i] && pMaterial[i] && pPattern[i]) baseExceptCraft.push(products[i]);
  for (const o of craftOptions) {
    const f = [o.toLowerCase()];
    let c = 0;
    for (const p of baseExceptCraft) if (craftMatch(f, p)) c++;
    craft[facetKey(o)] = c;
  }

  // color facet: all filters EXCEPT color's own selection.
  const baseExceptColor: CatalogueProduct[] = [];
  for (let i = 0; i < n; i++) if (pRest[i] && pCraft[i] && pMaterial[i] && pPattern[i]) baseExceptColor.push(products[i]);
  for (const o of colorOptions) {
    const f = [o.toLowerCase()];
    let c = 0;
    for (const p of baseExceptColor) if (colorMatch(f, p)) c++;
    color[facetKey(o)] = c;
  }

  // material facet: all filters EXCEPT material's own selection.
  const baseExceptMaterial: CatalogueProduct[] = [];
  for (let i = 0; i < n; i++) if (pRest[i] && pCraft[i] && pColor[i] && pPattern[i]) baseExceptMaterial.push(products[i]);
  for (const o of materialOptions) {
    const f = [o.toLowerCase()];
    let c = 0;
    for (const p of baseExceptMaterial) if (materialMatch(f, p)) c++;
    material[facetKey(o)] = c;
  }

  // pattern facet: all filters EXCEPT pattern's own selection.
  const baseExceptPattern: CatalogueProduct[] = [];
  for (let i = 0; i < n; i++) if (pRest[i] && pCraft[i] && pColor[i] && pMaterial[i]) baseExceptPattern.push(products[i]);
  for (const o of patternOptions) {
    const f = [o.toLowerCase()];
    let c = 0;
    for (const p of baseExceptPattern) if (patternMatch(f, p)) c++;
    pattern[facetKey(o)] = c;
  }

  return { craft, color, material, pattern };
}
