import 'server-only';
import { loomGet } from '@/lib/loom/client';
import type {
  NamedRef,
  CatalogueProduct,
  FilterSegment,
  ColorOption,
  SimpleOption,
} from './types';
import { EMPTY_FILTER_STATE } from './types';
// PDP pricing helpers -- REUSED so a finished MTO card's price folds the SAME
// fabric-consumption term the PDP's computeCustomizedUnitPrice adds (no re-math).
import {
  resolveConsumedFabric,
  defaultFabricUnitPrice,
  computeCustomizedUnitPrice,
} from '../product/pricing';
import type { ProductDetail, SizeProfileOptionItem } from '../product/types';

// ---------------------------------------------------------------------------
// Catalogue route-local Loom helpers.
// The preview-list endpoints return rich nested objects; we project them down
// to the load-bearing CatalogueProduct shape the client components consume.
// All calls are server-side (loomGet is 'server-only'). Types live in ./types.
//
// The live Angular site receives a pre-mapped snake_case DTO (FilterProductPreview)
// whose `gsm`, `calculatedPrice`, `volume_discount`, `is_main_product`,
// `special_status` etc are computed by the backend / a client transform. The demo
// hits the SAME raw endpoint (camelCase) and must replicate that mapping here so
// the auth-aware bulk pricing + range filters work exactly like live.
//
// PERFORMANCE NOTES
// -----------------
// Loom does not support server-side pagination — /get/fabric-preview-list always
// returns the full list (3,277+ products). We cache the full projected set in a
// module-level store (1-hour TTL); all filter/sort/pagination runs server-side
// against that set, so the client receives only ONE page per render.
// ---------------------------------------------------------------------------

export type {
  NamedRef,
  CatalogueProduct,
  FilterSegment,
  ColorOption,
  SimpleOption,
  CatalogueFilters,
} from './types';

const CATALOGUE_REVALIDATE = 3600; // used for small nav/facet endpoints only
const TTL_MS = 60 * 60 * 1000;    // 1-hour in-process TTL for large catalogues

interface MemCacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const memCache: {
  fabric?: MemCacheEntry<CatalogueProduct[]>;
  finished?: MemCacheEntry<CatalogueProduct[]>;
} = {};

interface RawNamed { id: number; name: string; hex?: string; timeOfCreation?: number }
interface RawVdItem { minimumOrderQuantity?: number; discount?: number }
interface RawVdProfile {
  volumeDiscountProfileItemList?: RawVdItem[];
  /** Set by the wrapper when the caller is not entitled to trade pricing: the
   *  ladder is empty and only the MOQ survives. See products/trade-pricing.ts. */
  minimumOrderQuantity?: number | null;
  tradePricingRedacted?: boolean;
}
// Finished size-variant row carried by the preview list: consumedFabric lives on
// the NESTED sizeProfileOption (matches SizeProfileOptionItem), not the wrapper.
interface RawSizeOption { label?: string; sortOrder?: number; consumedFabric?: number }
interface RawSizeItem { sizeProfileOption?: RawSizeOption; quantity?: number; disabled?: boolean }
interface RawProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  unit?: string;
  totalQuantity?: number;
  heroImage?: string;
  hoverImage?: string;
  heroImageAlt?: string;
  hoverImageAlt?: string;
  productGroup?: string;
  disabled?: boolean;
  timeOfCreation?: number;
  mainProductCheck?: boolean;
  specialStatus?: { name?: string } | string | null;
  // segment.name = sub-segment (WOMEN, KITCHENWARE, etc.)
  // segment.category.name = top-level category (Apparel, Home, Accessories)
  segment?: { name?: string; category?: { name?: string } };
  subCategory?: { name?: string };
  category?: { name?: string };
  materials?: RawNamed[];
  colors?: RawNamed[];
  patterns?: RawNamed[];
  volumeDiscountProfile?: RawVdProfile;
  volumeDiscountProfileEnabled?: boolean;
  madeToOrderProfileEnabled?: boolean;
  // Fabric-fold inputs (present on finished-preview rows; mirror the PDP fields).
  madeToOrderProfile?: { consumedFabric?: number };
  madeToOrderFabric?: { price?: number };
  productSizeProfileList?: RawSizeItem[];
}
// The preview-list rows wrap the product; `gsm` and `timeOfCreation` live on the
// WRAPPER (sibling of `product`), not inside product.
interface PreviewRow { product: RawProduct; id?: number; version?: number; gsm?: number; timeOfCreation?: number }
interface PreviewListResponse {
  /** Legacy Loom's envelope key. */
  productPreviewList?: PreviewRow[];
  /** Our own backend's envelope key for the same list. */
  products?: PreviewRow[];
  entity?: PreviewRow[];
}

function projectNamed(list?: RawNamed[]): NamedRef[] {
  return (list ?? []).map((n) => ({ id: n.id, name: n.name, hex: n.hex }));
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v) || 0;
}

// Live: the SELECTED volume-discount profile is the slab with the HIGHEST
// discount (product-bulk-discount sorts by discount desc, takes [0]) — that
// drives the bulk PRICE. The MOQ, however, is the MINIMUM order quantity to
// access bulk pricing at all, i.e. the SMALLEST tier (~25m), NOT the top
// 1000m slab. We return both: `discount` = best slab %, `moq` = min tier qty.
function selectVolumeDiscount(raw: RawProduct): { discount: number; moq: number } {
  if (!raw.volumeDiscountProfileEnabled) return { discount: 0, moq: 0 };
  const items = raw.volumeDiscountProfile?.volumeDiscountProfileItemList ?? [];
  if (items.length === 0) {
    // REDACTED (not entitled): no discount can be shown — that is the gate — but
    // the MOQ badge is a plain fact about how the product is sold and is kept.
    const vdp = raw.volumeDiscountProfile;
    const moq = vdp?.tradePricingRedacted ? (vdp.minimumOrderQuantity ?? 0) : 0;
    return { discount: 0, moq: moq > 0 ? moq : 0 };
  }
  let best: RawVdItem = items[0];
  let minMoq = Infinity;
  for (const it of items) {
    if ((it.discount ?? 0) > (best.discount ?? 0)) best = it;
    const q = it.minimumOrderQuantity ?? 0;
    if (q > 0 && q < minMoq) minMoq = q;
  }
  return {
    discount: best.discount ?? 0,
    moq: Number.isFinite(minMoq) ? minMoq : 0,
  };
}

// ---------------------------------------------------------------------------
// FINISHED made-to-order LISTING/RELATED price -- the fabric-inclusive base the
// PDP shows. Port of the PDP's initial displayed price (ProductInfoPanel):
//   base = product.price + defaultFabricUnitPrice * consumedFabric(defaultSize)
// using selectDefaultSize (first orderable size by sortOrder, else the smallest).
// REUSES the PDP helpers verbatim so listing == PDP == live. Fabric + any non-MTO
// keep calculatedPrice === price (fabric card stays unchanged).
// ---------------------------------------------------------------------------
function computeFinishedCalculatedPrice(raw: RawProduct, group: string, price: number): number {
  if (group !== 'finished' || !raw.madeToOrderProfileEnabled) return price;
  const sizes = raw.productSizeProfileList ?? [];
  let defaultSize: RawSizeItem | null = null;
  if (sizes.length > 0) {
    const sorted = [...sizes].sort(
      (a, b) => (a.sizeProfileOption?.sortOrder ?? 0) - (b.sizeProfileOption?.sortOrder ?? 0),
    );
    defaultSize = sorted.find((sz) => !sz.disabled && (sz.quantity ?? 0) > 0) ?? sorted[0] ?? null;
  }
  const mtoProduct = {
    price,
    productGroup: group,
    madeToOrderProfileEnabled: !!raw.madeToOrderProfileEnabled,
    madeToOrderProfile: raw.madeToOrderProfile,
    madeToOrderFabric: raw.madeToOrderFabric,
  } as unknown as ProductDetail;
  const consumedFabric = resolveConsumedFabric(
    mtoProduct,
    (defaultSize?.sizeProfileOption ?? null) as SizeProfileOptionItem | null,
  );
  const fabricUnitPrice = defaultFabricUnitPrice(mtoProduct, null);
  const priced = computeCustomizedUnitPrice(mtoProduct, {
    fabricUnitPrice,
    consumedFabric,
    finishPrice: 0,
    customSizePrice: 0,
  });
  return priced.unitPrice;
}

/**
 * Legacy Loom wraps each preview row as `{ id, gsm, product: {...} }`; our own
 * backend returns the SAME fields flat on the row, with the product's own id
 * under `productId`. Reading only the nested shape dropped every product on the
 * floor (they all failed the `slug` filter), emptying the catalogue.
 *
 * A row that already carries a nested `product` is returned untouched.
 */
/**
 * A taxonomy field arrives either as a nested `{name}` (legacy Loom) or as a
 * plain string (our own backend). Reading only `.name` yielded '' for every
 * product against our API, which emptied every craft/category facet and made
 * each mega-menu filter link match nothing.
 */
function nameOf(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const n = (v as { name?: unknown }).name;
    if (typeof n === 'string') return n;
  }
  return '';
}

function normalizePreviewRow(row: PreviewRow): PreviewRow {
  if (row && typeof row === 'object' && row.product) return row;
  const flat = row as unknown as Record<string, unknown>;
  return {
    // The WRAPPER id (sibling of the product) — what cart adds send as
    // fabricProductId. The product's own id goes inside `product`.
    id: flat.id as number | undefined,
    version: flat.version as number | undefined,
    gsm: flat.gsm as number | undefined,
    timeOfCreation: flat.timeOfCreation as number | undefined,
    product: { ...flat, id: (flat.productId ?? flat.id) as number } as unknown as RawProduct,
  };
}

function projectProduct(row: PreviewRow, fallbackGroup: string): CatalogueProduct {
  const raw = row.product;
  const price = num(raw.price);
  const group = raw.productGroup ?? fallbackGroup;
  const vd = selectVolumeDiscount(raw);
  // Live _calculateProductPrice: for fabric (+ any non-MTO), calculatedPrice === price.
  // FINISHED made-to-order products fold in the same fabric-consumption term the PDP
  // shows (base = price + defaultFabricUnitPrice * default-size consumedFabric) so the
  // LISTING card + related price equal the PDP == live. The finished-preview rows DO
  // carry madeToOrderFabric.price + productSizeProfileList[].sizeProfileOption.consumedFabric.
  const calculatedPrice = computeFinishedCalculatedPrice(raw, group, price);
  const special =
    typeof raw.specialStatus === 'string'
      ? raw.specialStatus
      : raw.specialStatus?.name ?? '';
  return {
    id: raw.id,
    // recordId = preview-row WRAPPER id (sibling of product), used by the
    // inline card Order-Swatch action (cart add uses fabricProductId).
    recordId: row.id ?? raw.id,
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    sku: raw.sku,
    price,
    unit: raw.unit ?? (group === 'finished' ? 'UNIT' : 'METER'),
    totalQuantity: num(raw.totalQuantity),
    gsm: num(row.gsm),
    heroImage: raw.heroImage ?? '',
    hoverImage: raw.hoverImage ?? raw.heroImage ?? '',
    heroImageAlt: raw.heroImageAlt,
    hoverImageAlt: raw.hoverImageAlt,
    productGroup: group,
    isMainProduct: !!raw.mainProductCheck,
    segmentName: nameOf(raw.segment) || nameOf((raw as { segmentCategory?: unknown }).segmentCategory),
    // categoryName = top-level category from segment.category.name
    // (Apparel | Home | Accessories for finished products)
    categoryName:
      nameOf((raw.segment as { category?: unknown } | undefined)?.category) || nameOf(raw.category),
    subCategoryName: nameOf(raw.subCategory),
    specialStatus: special,
    materials: projectNamed(raw.materials),
    colors: projectNamed(raw.colors),
    patterns: projectNamed(raw.patterns),
    calculatedPrice,
    volumeDiscount: vd.discount,
    // MINIMUM volume-discount tier quantity (e.g. 25m) — the smallest qty that
    // unlocks bulk pricing. Surfaced on the card ONLY for not-in-stock fabric as
    // a "Bulk from {min}m" line; in-stock cards suppress it (retail behaviour).
    // 0/undefined when the product has no volume-discount slab.
    volumeDiscountMinimumOrderQuantity: vd.moq || undefined,
    // MTO-enabled flag — feeds deriveStockStatus so the card's stock word
    // matches the PDP (the preview list strips the MTO fabric qty, but the flag
    // + totalQuantity are enough to classify in-stock vs made-to-order).
    madeToOrderProfileEnabled: !!raw.madeToOrderProfileEnabled,
  };
}

async function fetchPreviewList(path: string, group: string): Promise<CatalogueProduct[]> {
  try {
    const res = await loomGet<PreviewListResponse>(path);
    // Legacy Loom names the list `productPreviewList`; our own backend names it
    // `products`. Reading only the first yielded an EMPTY catalogue against our
    // API, which buildFullCatalogue then (correctly) refused to cache — so the
    // PLP and every catalogue-backed page threw instead of rendering.
    const rows = res?.productPreviewList ?? res?.products ?? res?.entity ?? [];
    return rows
      .map((r) => projectProduct(normalizePreviewRow(r), group))
      .filter((p) => p && p.slug);
  } catch (err) {
    // A swallowed failure here empties the WHOLE catalogue, which surfaces far
    // away as buildFullCatalogue's "refusing to cache" on an unrelated page.
    // Name the endpoint that actually broke.
    console.error('[catalogue] fetchPreviewList failed for ' + path + ':', err);
    return [];
  }
}

export async function getFabricProducts(): Promise<CatalogueProduct[]> {
  const entry = memCache.fabric;
  if (entry && Date.now() - entry.fetchedAt < TTL_MS) return entry.data;
  const data = await fetchPreviewList('/get/fabric-preview-list', 'fabric');
  if (data.length > 0) memCache.fabric = { data, fetchedAt: Date.now() };
  return data;
}

export async function getFinishedProducts(): Promise<CatalogueProduct[]> {
  const entry = memCache.finished;
  if (entry && Date.now() - entry.fetchedAt < TTL_MS) return entry.data;
  const data = await fetchPreviewList('/get/finished-preview-list', 'finished');
  if (data.length > 0) memCache.finished = { data, fetchedAt: Date.now() };
  return data;
}

// ---------------------------------------------------------------------------
// Range bounds derived from the full catalogue (live: filter-control-prep maps
// each product[key] to min/max). Used to seed the slider min/max and Apply boxes.
// ---------------------------------------------------------------------------
function rangeOf(all: CatalogueProduct[], pick: (p: CatalogueProduct) => number): { min: number; max: number } {
  if (all.length === 0) return { min: 0, max: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const p of all) {
    const v = pick(p);
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 0;
  return { min: Math.floor(min), max: Math.ceil(max) };
}

export function computeRanges(all: CatalogueProduct[]): {
  priceRange: { min: number; max: number };
  gsmRange: { min: number; max: number };
  availabilityRange: { min: number; max: number };
} {
  return {
    priceRange: rangeOf(all, (p) => p.calculatedPrice),
    gsmRange: rangeOf(all, (p) => p.gsm),
    availabilityRange: rangeOf(all, (p) => p.totalQuantity),
  };
}

// ---------------------------------------------------------------------------
// Filter + sort + paginate — imported from filter-sort.ts (client-safe, no
// server-only deps) so CatalogueShell can also import it for instant
// client-side operations without a BFF call.
// ---------------------------------------------------------------------------
import { applyFilterSortPage } from './filter-sort';
export { applyFilterSortPage };

// ---------------------------------------------------------------------------
// Nav / facet helpers — small payloads, safe to use Next.js fetch revalidation.
// ---------------------------------------------------------------------------
interface RawNavOption { id: number; subCategoryName: string; subCategoryFeaturedImage?: string }
interface RawNavSegment { id: number; segmentCategoryName: string; optionList?: RawNavOption[] }
interface NavResponse { entity?: RawNavSegment[] }
async function getNav(path: string): Promise<FilterSegment[]> {
  try {
    const res = await loomGet<NavResponse>(path, { revalidate: CATALOGUE_REVALIDATE });
    return (res?.entity ?? []).map((s) => ({
      id: s.id,
      segmentCategoryName: s.segmentCategoryName,
      // Forward subCategoryFeaturedImage (present on finished/apparel; absent on fabric/craft)
      // as icon so FilterSidebar can render a thumbnail next to the sub-option label.
      optionList: (s.optionList ?? []).map((o) => ({
        id: o.id,
        subCategoryName: o.subCategoryName,
        icon: o.subCategoryFeaturedImage || undefined,
      })),
    }));
  } catch {
    return [];
  }
}

export function getFabricCraftNav(): Promise<FilterSegment[]> {
  return getNav('/get/navigation/fabric/craft');
}

export function getFinishedApparelNav(): Promise<FilterSegment[]> {
  return getNav('/get/navigation/finished/apparel');
}

interface ColorResponse { colorList?: ColorOption[] }
export async function getColorList(): Promise<ColorOption[]> {
  try {
    const res = await loomGet<ColorResponse>('/get/color-list', { revalidate: CATALOGUE_REVALIDATE });
    return (res?.colorList ?? []).map((c) => ({ id: c.id, name: c.name, hex: c.hex }));
  } catch {
    return [];
  }
}

interface MaterialResponse { materialList?: SimpleOption[] }
export async function getMaterialList(): Promise<SimpleOption[]> {
  try {
    const res = await loomGet<MaterialResponse>('/get/material-list', { revalidate: CATALOGUE_REVALIDATE });
    return (res?.materialList ?? []).map((m) => ({ id: m.id, name: m.name }));
  } catch {
    return [];
  }
}

interface PatternResponse { patternList?: SimpleOption[] }
export async function getPatternList(): Promise<SimpleOption[]> {
  try {
    const res = await loomGet<PatternResponse>('/get/pattern-list', { revalidate: CATALOGUE_REVALIDATE });
    return (res?.patternList ?? []).map((p) => ({ id: p.id, name: p.name }));
  } catch {
    return [];
  }
}

// SWATCH_PRICE_PERCENTAGE setting — drives the inline card Order-Swatch price
// (swatch price = pct/100 * product.price), mirroring the PDP SwatchButton.
// 0 ⇒ swatches disabled (card action hidden). Fabric-only on the card.
interface SettingItem { attributeName: string; attributeValue: unknown }
export async function getSwatchPercentage(): Promise<number> {
  try {
    const res = await loomGet<{ success?: boolean; settingsList?: SettingItem[] }>(
      '/get/settings-list',
      { revalidate: CATALOGUE_REVALIDATE },
    );
    const item = res?.settingsList?.find((s) => s.attributeName === 'SWATCH_PRICE_PERCENTAGE');
    const v = item ? Number(item.attributeValue) : 0;
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// getCachedInitialPayload — ISR-safe initial-page data for PLP static generation.
// Wraps the small projected RETURN VALUE (one page + facets + total + ranges)
// in unstable_cache so the page can be statically generated + revalidated hourly.
// ---------------------------------------------------------------------------
import { unstable_cache } from 'next/cache';

export interface InitialPagePayload {
  products: CatalogueProduct[];
  total: number;
  filters: {
    segments: FilterSegment[];
    colors: ColorOption[];
    materials: SimpleOption[];
    patterns: SimpleOption[];
    priceRange: { min: number; max: number };
    gsmRange: { min: number; max: number };
    availabilityRange: { min: number; max: number };
  };
}

const PAGE_SIZE_INITIAL = 31; // live filter-paginator pageLength
const DEFAULT_FILTER_STATE = EMPTY_FILTER_STATE;

async function buildInitialPayload(group: 'fabric' | 'finished'): Promise<InitialPagePayload> {
  const [allProducts, segments, colors, materials, patterns] = await Promise.all([
    group === 'fabric' ? getFabricProducts() : getFinishedProducts(),
    group === 'fabric' ? getFabricCraftNav() : getFinishedApparelNav(),
    getColorList(),
    getMaterialList(),
    getPatternList(),
  ]);

  const { products, total } = applyFilterSortPage(
    allProducts,
    DEFAULT_FILTER_STATE,
    'availability',
    0,
    PAGE_SIZE_INITIAL,
  );
  const ranges = computeRanges(allProducts);

  return {
    products,
    total,
    filters: { segments, colors, materials, patterns, ...ranges },
  };
}

export const getCachedInitialPayload = unstable_cache(
  buildInitialPayload,
  ['loom-initial-payload-v4'],
  { revalidate: 3600, tags: ['loom-catalogue'] },
);

// ---------------------------------------------------------------------------
// getCachedFullCatalogue — returns the FULL slim catalogue (all products) plus
// facets + ranges, for client-side filter/sort/pagination in CatalogueShell.
//
// The full array is larger than InitialPagePayload (~3,277 products vs 31) but
// transfers only ONCE on page load (baked into the static HTML as RSC prop),
// eliminating ALL subsequent BFF round-trips for filter/sort/page changes.
//
// Slim fields kept: everything needed for ProductCard rendering + filtering +
// sorting. Fields dropped vs raw Loom: sku, disabled (filtered out before
// cache), timeOfCreation (sort uses id desc, not this),
// volumeDiscountMinimumOrderQuantity (unused in UI).
//
// Cached with unstable_cache, revalidates hourly alongside the page itself.
// ---------------------------------------------------------------------------

export interface FullCataloguePayload {
  /** ALL products (slim projection, no page slice). Use for client-side ops. */
  allProducts: CatalogueProduct[];
  filters: {
    segments: FilterSegment[];
    colors: ColorOption[];
    materials: SimpleOption[];
    patterns: SimpleOption[];
    priceRange: { min: number; max: number };
    gsmRange: { min: number; max: number };
    availabilityRange: { min: number; max: number };
    swatchPercentage?: number;
  };
}

async function buildFullCatalogue(group: 'fabric' | 'finished'): Promise<FullCataloguePayload> {
  const [allProducts, segments, colors, materials, patterns, swatchPercentage] = await Promise.all([
    group === 'fabric' ? getFabricProducts() : getFinishedProducts(),
    group === 'fabric' ? getFabricCraftNav() : getFinishedApparelNav(),
    getColorList(),
    getMaterialList(),
    getPatternList(),
    // Swatches are fabric-only; skip the settings round-trip for finished.
    group === 'fabric' ? getSwatchPercentage() : Promise.resolve(0),
  ]);

  // GUARD: never return an empty catalogue. unstable_cache does NOT persist a
  // thrown result, so throwing here makes it impossible to BAKE an empty array
  // into the cache when the upstream Loom fetch transiently returns nothing.
  if (allProducts.length === 0) {
    throw new Error('buildFullCatalogue: empty product list for group ' + group + ' — refusing to cache');
  }

  const ranges = computeRanges(allProducts);

  return {
    allProducts,
    filters: { segments, colors, materials, patterns, ...ranges, swatchPercentage },
  };
}

const memoryCatalogueCache = new Map<string, { payload: FullCataloguePayload; timestamp: number }>();
const CATALOGUE_TTL_MS = 1000 * 60 * 60; // 1 hour memory cache

// Public accessor: serve from memory cache when valid (fast & bypasses Next.js 2MB limit),
// falling back to buildFullCatalogue when expired or empty.
export async function getCachedFullCatalogue(
  group: 'fabric' | 'finished',
): Promise<FullCataloguePayload> {
  const cachedMem = memoryCatalogueCache.get(group);
  if (cachedMem && Date.now() - cachedMem.timestamp < CATALOGUE_TTL_MS && cachedMem.payload.allProducts.length > 0) {
    return cachedMem.payload;
  }

  try {
    const payload = await buildFullCatalogue(group);
    if (payload.allProducts.length > 0) {
      memoryCatalogueCache.set(group, { payload, timestamp: Date.now() });
      return payload;
    }
  } catch (err) {
    if (cachedMem && cachedMem.payload.allProducts.length > 0) {
      return cachedMem.payload;
    }
    throw err;
  }

  return buildFullCatalogue(group);
}

// ---------------------------------------------------------------------------
// Segment-category ICONS (Shop-By-Category pills on the finished PLP)
// ---------------------------------------------------------------------------
// The backend's segment-category entity carries an illustrated `icon` (S3 URL)
// the owner set per category (envelope, scrunchie, scarf, bag, …). It lives on
// GET /get/segment-list, which is bearer-gated. We mint a token server-side with
// a read-only support account, cache the token (24h) AND the projected
// name→icon map (24h) in module memory, and serve stale-while-revalidate: icons
// are static reference data, so we NEVER fetch admin data per request, and the
// token is NEVER exposed to the client (this whole file is `server-only`).
//
// Key = `${categoryName}::${segmentName}` (both lower-cased) because the segment
// name alone is ambiguous — e.g. Unisex exists under BOTH Apparel and
// Accessories with DIFFERENT icons. A name-only fallback map is also returned
// for callers that don't know the parent category.
// ---------------------------------------------------------------------------

import { authenticateEmail } from '@/lib/loom/endpoints';

interface RawSegmentListItem {
  name?: string;
  icon?: string;
  category?: { name?: string; icon?: string };
}
interface SegmentListResponse {
  success?: boolean;
  segmentList?: RawSegmentListItem[];
}

export interface SegmentIconMap {
  /** keyed by `${categoryName.toLowerCase()}::${segmentName.toLowerCase()}` */
  byCategoryAndName: Record<string, string>;
  /** keyed by `segmentName.toLowerCase()` (last-writer-wins on collisions) */
  byName: Record<string, string>;
}

const SEGMENT_ICON_TTL_MS = 24 * 60 * 60 * 1000; // 24h — static reference data
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;         // 24h service-token cache

let tokenCache: { jwt: string; fetchedAt: number } | null = null;
let iconCache: { data: SegmentIconMap; fetchedAt: number } | null = null;
let inflight: Promise<SegmentIconMap> | null = null;

const EMPTY_ICON_MAP: SegmentIconMap = { byCategoryAndName: {}, byName: {} };

async function getServiceToken(): Promise<string | null> {
  if (tokenCache && Date.now() - tokenCache.fetchedAt < TOKEN_TTL_MS) {
    return tokenCache.jwt;
  }
  const username = process.env.LOOM_SUPPORT_USERNAME;
  const password = process.env.LOOM_SUPPORT_PASSWORD;
  if (!username || !password) return null; // graceful: no creds ⇒ no icons
  const res = await authenticateEmail(username, password);
  if (!res.ok) return null;
  tokenCache = { jwt: res.jwt, fetchedAt: Date.now() };
  return res.jwt;
}

async function buildSegmentIconMap(): Promise<SegmentIconMap> {
  const token = await getServiceToken();
  if (!token) return EMPTY_ICON_MAP;
  const resp = await loomGet<SegmentListResponse>('/get/segment-list', { token });
  const list = resp?.segmentList ?? [];
  const byCategoryAndName: Record<string, string> = {};
  const byName: Record<string, string> = {};
  for (const seg of list) {
    const name = (seg.name ?? '').trim();
    const icon = (seg.icon ?? '').trim();
    if (!name || !icon) continue;
    const catName = (seg.category?.name ?? '').trim().toLowerCase();
    if (catName) byCategoryAndName[`${catName}::${name.toLowerCase()}`] = icon;
    byName[name.toLowerCase()] = icon;
  }
  return { byCategoryAndName, byName };
}

/**
 * Returns the segment→icon map, cached 24h in-process with stale-while-revalidate.
 * On the first miss it builds synchronously; on a stale hit it returns the stale
 * map immediately and refreshes in the background. Never throws — returns an
 * empty map on any failure so the pills degrade gracefully (text-only).
 */
export async function getSegmentIconMap(): Promise<SegmentIconMap> {
  const now = Date.now();
  if (iconCache) {
    const age = now - iconCache.fetchedAt;
    if (age < SEGMENT_ICON_TTL_MS) return iconCache.data;
    // stale — kick a background refresh, return stale immediately.
    if (!inflight) {
      inflight = buildSegmentIconMap()
        .then((m) => {
          if (Object.keys(m.byName).length > 0) iconCache = { data: m, fetchedAt: Date.now() };
          return m;
        })
        .catch(() => iconCache?.data ?? EMPTY_ICON_MAP)
        .finally(() => { inflight = null; });
    }
    return iconCache.data;
  }
  // cold — build synchronously (dedup concurrent callers).
  if (!inflight) {
    inflight = buildSegmentIconMap()
      .then((m) => {
        if (Object.keys(m.byName).length > 0) iconCache = { data: m, fetchedAt: Date.now() };
        return m;
      })
      .catch(() => EMPTY_ICON_MAP)
      .finally(() => { inflight = null; });
  }
  return inflight;
}
