// Pure types shared between server helpers (loom.ts) and client components.
// No 'server-only' import here so client components can import the types safely.

export interface NamedRef {
  id: number;
  name: string;
  hex?: string;
}

export interface CatalogueProduct {
  id: number;
  /** Loom preview-row wrapper id (record id) — needed for the inline card
   *  Order-Swatch action (cart add uses fabricProductId = recordId). */
  recordId?: number;
  name: string;
  slug: string;
  /** Used by the inline card Order-Swatch action (cart add body.sku). */
  sku?: string;
  price: number;
  unit: string;
  totalQuantity: number;
  gsm: number;
  heroImage: string;
  hoverImage: string;
  heroImageAlt?: string;
  hoverImageAlt?: string;
  productGroup: string;
  /** Always false in the catalogue list (disabled products are filtered out). */
  disabled?: boolean;
  isMainProduct: boolean;
  segmentName: string;
  subCategoryName: string;
  /** Not used in catalogue display/filter — optional to keep payload slim. */
  categoryName?: string;
  specialStatus: string;
  materials: NamedRef[];
  colors: NamedRef[];
  patterns: NamedRef[];
  /** Not used for sorting (sort uses id desc) — optional to keep payload slim. */
  timeOfCreation?: number;
  // ----- AUTH-AWARE PRICING (mirrors live FilterProductPreview DTO) -----
  // For fabric, calculatedPrice === price (live _calculateProductPrice).
  calculatedPrice: number;
  // Max-slab volume-discount percentage (live picks the highest-discount slab).
  volumeDiscount: number;
  // The minimum-order-quantity of that selected (max-discount) slab.
  // Surfaced on the card as an MOQ badge (#13). 0/absent => no slab MOQ.
  volumeDiscountMinimumOrderQuantity?: number;
  // Wholesale-member discounted retail price (live calculatedDiscountedPrice).
  // Present/non-zero only when the customer's wholesale program supplies a
  // percentileDiscount; absent for logged-out / non-members.
  // ----- STOCK STATE (so the PLP card derives the SAME in-stock vs
  // made-to-order word the PDP shows; see deriveStockStatus). The preview list
  // carries the MTO-enabled flag but STRIPS the fabric quantity, which is enough
  // for the state classification. -----
  madeToOrderProfileEnabled?: boolean;
  calculatedDiscountedPrice?: number;
}

export interface FilterSegment {
  id: number;
  segmentCategoryName: string;
  optionList: Array<{ id: number; subCategoryName: string; icon?: string }>;
}
export interface ColorOption { id: number; name: string; hex: string }
export interface SimpleOption { id: number; name: string }

export interface CatalogueFilters {
  segments: FilterSegment[];
  segmentLabel: string;
  colors: ColorOption[];
  materials: SimpleOption[];
  patterns: SimpleOption[];
  // Range bounds derived server-side from the full catalogue (live: filter-control-prep).
  priceRange: { min: number; max: number };
  gsmRange: { min: number; max: number };
  availabilityRange: { min: number; max: number };
  /** SWATCH_PRICE_PERCENTAGE (e.g. 3 ⇒ swatch = 3% of price). 0 ⇒ swatches
   *  disabled (hide the inline card Order-Swatch action). Fabric only. */
  swatchPercentage?: number;
}

// ---------------------------------------------------------------------------
// Amazon-style faceted filter COUNTS. For each checkbox dimension, a map of
// option-slug -> number of products that option would yield GIVEN the current
// selection in every OTHER dimension (the "exclude own dimension" rule that
// lets a user multi-select within one facet without options vanishing and
// guarantees an option shown with count N>0 always yields N results).
// Keyed by facetKey(optionName) (see filter-sort.ts). Lean: slug->count only.
// ---------------------------------------------------------------------------
export interface CatalogueFacets {
  craft: Record<string, number>;
  color: Record<string, number>;
  material: Record<string, number>;
  pattern: Record<string, number>;
}

export const EMPTY_FACETS: CatalogueFacets = { craft: {}, color: {}, material: {}, pattern: {} };

// A single range selection. null => unset (use the full bound).
export interface RangeSelection {
  min: number | null;
  max: number | null;
}

// Active filter selections (client state, also serialised to URL query params).
export interface FilterState {
  craft: string[];      // subCategoryName values (fabric) OR segmentCategoryName (finished)
  color: string[];      // color names
  material: string[];   // material names
  pattern: string[];    // pattern names
  stockOnly: boolean;
  price: RangeSelection;
  gsm: RangeSelection;
  availability: RangeSelection;
}

// Sort keys: Recommended (default — curated/featured order, same underlying
// ranking as availability since there is no separate ranking signal), By
// Availability, New Arrival, Price Low->High, Price High->Low.
export type SortKey = 'recommended' | 'availability' | 'new-arrival' | 'low-to-high' | 'high-to-low';

// Raw URL search params -> FilterState (comma-separated lists). Pure, reusable
// by both fabric/finished/filter server pages.
export interface RawCatalogueParams {
  craft?: string;
  color?: string;
  material?: string;
  pattern?: string;
  stock?: string;
  sort?: string;
  category?: string;
  'price-min'?: string;
  'price-max'?: string;
  'gsm-min'?: string;
  'gsm-max'?: string;
  'avail-min'?: string;
  'avail-max'?: string;
}

function splitParam(v?: string): string[] {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

function num(v?: string): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseFilterState(params: RawCatalogueParams): FilterState {
  return {
    craft: splitParam(params.craft),
    color: splitParam(params.color),
    material: splitParam(params.material),
    pattern: splitParam(params.pattern),
    stockOnly: params.stock === '1' || params.stock === 'true',
    price: { min: num(params['price-min']), max: num(params['price-max']) },
    gsm: { min: num(params['gsm-min']), max: num(params['gsm-max']) },
    availability: { min: num(params['avail-min']), max: num(params['avail-max']) },
  };
}

export function parseSortKey(v?: string): SortKey {
  const allowed: SortKey[] = ['recommended', 'availability', 'new-arrival', 'low-to-high', 'high-to-low'];
  return allowed.includes(v as SortKey) ? (v as SortKey) : 'recommended';
}

export const EMPTY_FILTER_STATE: FilterState = {
  craft: [],
  color: [],
  material: [],
  pattern: [],
  stockOnly: false,
  price: { min: null, max: null },
  gsm: { min: null, max: null },
  availability: { min: null, max: null },
};

// ---------------------------------------------------------------------------
// Server-side live URL parser — mirrors hydrateLiveParams in CatalogueShell
// but importable from server components (no client-only deps).
// ---------------------------------------------------------------------------

/** Parse a live-format range string like "min-2000,max-5000" → RangeSelection. */
function parseLiveRange(raw: string | null): RangeSelection {
  if (!raw) return { min: null, max: null };
  let mn: number | null = null;
  let mx: number | null = null;
  for (const part of raw.split(',').map((s) => s.trim())) {
    if (part.startsWith('min-')) { const n = Number(part.slice(4)); if (Number.isFinite(n)) mn = n; }
    else if (part.startsWith('max-')) { const n = Number(part.slice(4)); if (Number.isFinite(n)) mx = n; }
  }
  return { min: mn, max: mx };
}

/** Next.js 15 App Router awaited searchParams shape. */
export type NextSearchParams = Record<string, string | string[] | undefined>;

/**
 * Parse live-format URL search params (Next.js 15 App Router awaited searchParams)
 * into FilterState + SortKey + 0-based page offset.
 *
 * Accepts both the live format (?calculatedPrice=min-2000,max-5000, ?inStock=true,
 * ?sort-by=low-to-high, ?page=2) and the legacy demo format (?price-min=2000, ?stock=1).
 * Mirrors hydrateLiveParams in CatalogueShell.tsx so the SSR first page and the
 * client re-fetch see exactly the same filter interpretation.
 *
 * Returns null when no relevant filter/sort/page params are present.
 */
export function parseLiveSearchParams(
  params: NextSearchParams,
): { filterState: FilterState; sort: SortKey; page: number } | null {
  const get = (k: string): string | null => {
    const v = params[k];
    if (v == null) return null;
    return Array.isArray(v) ? (v[0] ?? null) : v;
  };
  const csv = (k: string): string[] => {
    const v = get(k);
    return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
  };

  const relevantKeys = [
    'calculatedPrice', 'total_quantity', 'inStock', 'color', 'material', 'pattern',
    'craft', 'sort-by', 'page', 'price-min', 'price-max', 'gsm-min', 'gsm-max',
    'avail-min', 'avail-max', 'stock', 'sort',
  ];
  // GSM: live format uses ?gsm=min-N,max-N (contains a dash), not a bare number.
  const hasGsm = get('gsm') != null && (get('gsm')!.includes('min-') || get('gsm')!.includes('max-'));
  const hasParams = relevantKeys.some((k) => get(k) != null) || hasGsm;
  if (!hasParams) return null;

  // Price range: live ?calculatedPrice=min-2000,max-5000  OR  legacy ?price-min=2000
  const price: RangeSelection = get('calculatedPrice')
    ? parseLiveRange(get('calculatedPrice'))
    : { min: num(get('price-min') ?? undefined), max: num(get('price-max') ?? undefined) };

  // GSM range: live ?gsm=min-100,max-200  OR  legacy ?gsm-min=100
  const rawGsm = get('gsm');
  const gsm: RangeSelection = hasGsm
    ? parseLiveRange(rawGsm)
    : { min: num(get('gsm-min') ?? undefined), max: num(get('gsm-max') ?? undefined) };

  // Availability: live ?total_quantity=min-10,max-50  OR  legacy ?avail-min=10
  const availability: RangeSelection = get('total_quantity')
    ? parseLiveRange(get('total_quantity'))
    : { min: num(get('avail-min') ?? undefined), max: num(get('avail-max') ?? undefined) };

  const stockOnly = get('inStock') === 'true' || get('stock') === '1' || get('stock') === 'true';

  // Sort: live ?sort-by=low-to-high  OR  legacy ?sort=low-to-high
  // Default 'availability' when absent (matches CatalogueShell DEFAULT_SORT).
  const sortRaw = get('sort-by') ?? get('sort') ?? 'availability';
  const sortAllowed: SortKey[] = ['availability', 'new-arrival', 'low-to-high', 'high-to-low', 'recommended'];
  const sort: SortKey = sortAllowed.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : 'availability';

  // Page: 1-based in URL (?page=2 → internal offset 1)
  const rawPage = get('page');
  const page = rawPage ? Math.max(0, (parseInt(rawPage, 10) || 1) - 1) : 0;

  return {
    filterState: {
      craft: csv('craft'),
      color: csv('color'),
      material: csv('material'),
      pattern: csv('pattern'),
      stockOnly,
      price,
      gsm,
      availability,
    },
    sort,
    page,
  };
}
