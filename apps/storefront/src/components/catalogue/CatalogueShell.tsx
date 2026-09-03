'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import FilterSidebar from './FilterSidebar';
import SortBar from './SortBar';
import ProductGrid from './ProductGrid';
import Paginator from './Paginator';
import ActiveFilterChips from './ActiveFilterChips';
import LoginModal from '@/components/auth/LoginModal';
import type { CatalogueProduct, CatalogueFilters, CatalogueFacets, FilterState, RangeSelection, SortKey } from './types';
import { EMPTY_FILTER_STATE, EMPTY_FACETS } from './types';

// ---------------------------------------------------------------------------
// Hero banner data (passed from the server page for category landings)
// ---------------------------------------------------------------------------
interface HeroBannerData {
  h1: string;
  description: string;
  image: string;
}

// Tile data for "Shop By Category" row
interface CategoryTile {
  name: string;
  slug: string;
  /** Illustrated segment-category icon (S3 URL from the backend). Optional —
   *  some tiles/segments have no icon; then the pill is text-only. */
  icon?: string;
}

// Breadcrumb trail item (#15). Last item has no href (current page).
interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface CatalogueShellProps {
  title: string;
  /** The FIRST PAGE of products (server-rendered, no round-trip). */
  initialProducts: CatalogueProduct[];
  /** Total matching count for the initial filter state. */
  initialTotal: number;
  /** Amazon-style facet counts for the initial filter state (SSR). */
  initialFacets?: CatalogueFacets;
  /** Catalogue group used to call the BFF route for filter/sort/page changes. */
  group: 'fabric' | 'finished';
  filters: CatalogueFilters;
  aspect?: 'square' | 'portrait';
  initialState: FilterState;
  initialSort?: SortKey;
  pageSize?: number;
  /** Hero banner data. Present only on category landing pages. */
  heroBanner?: HeroBannerData | null;
  /** Shop By Category tiles. Present only on category landing pages. */
  categoryTiles?: CategoryTile[] | null;
  /** Breadcrumb trail (#15) — e.g. Home > Fabrics. Last item = current page. */
  breadcrumb?: BreadcrumbItem[] | null;
  /** Locked category slug (home|apparel|accessories). When set, the category
   *  param is preserved in all URL updates (clear-all keeps the category scope). */
  lockedCategory?: string | null;
}

const PAGE_SIZE = 31; // live filter-paginator pageLength
const DEFAULT_SORT: SortKey = 'availability';

// ---------------------------------------------------------------------------
// LIVE URL PARAM CONTRACT (matches anuprerna.com Angular filter exactly)
//
//  Ranges  : ?calculatedPrice=min-2000,max-5000  ?gsm=min-100,max-200
//            ?total_quantity=min-10,max-50
//  Stock   : ?inStock=true
//  Csv     : ?color=green,red  ?material=cotton  ?pattern=stripes
//            (lowercased values, comma-separated in one param)
//  Sort    : ?sort-by=availability|new-arrival|low-to-high|high-to-low
//  Page    : ?page=1  (1-based, omitted on page 1 with default sort)
//
// The internal BFF call uses legacy names (price-min, stock, sort) which
// this shell translates internally before calling /api/catalogue/[group].
// ---------------------------------------------------------------------------

function buildLiveQs(state: FilterState, sort: SortKey, page: number, lockedCategory?: string | null): string {
  const params = new URLSearchParams();
  // Preserve the locked category param so clear-all doesn't lose the scope
  if (lockedCategory) params.set('category', lockedCategory);
  // Craft/sub-category — live uses the craft sub-category name lowercased-hyphenated
  // as a key (e.g. ?muga-silk=...) but for simplicity the demo encodes craft
  // as a single craft= param. We keep that for internal BFF use and also write it
  // to the URL here so round-trips still work for demo-native URLs.
  // For live-parity deep-links we do NOT write craft to the live format
  // (sub-type encoding is complex); color/material/pattern are simple CSV.
  if (state.craft.length) params.set('craft', state.craft.map(v => v.toLowerCase().replace(/\s+/g, '-')).join(','));
  if (state.color.length) params.set('color', state.color.map(v => v.toLowerCase().replace(/\s+/g, '-')).join(','));
  if (state.material.length) params.set('material', state.material.map(v => v.toLowerCase().replace(/\s+/g, '-')).join(','));
  if (state.pattern.length) params.set('pattern', state.pattern.map(v => v.toLowerCase().replace(/\s+/g, '-')).join(','));
  if (state.stockOnly) params.set('inStock', 'true');
  // Range params: live format = ?calculatedPrice=min-N,max-N
  if (state.price.min != null || state.price.max != null) {
    const parts: string[] = [];
    if (state.price.min != null) parts.push('min-' + state.price.min);
    if (state.price.max != null) parts.push('max-' + state.price.max);
    params.set('calculatedPrice', parts.join(','));
  }
  if (state.gsm.min != null || state.gsm.max != null) {
    const parts: string[] = [];
    if (state.gsm.min != null) parts.push('min-' + state.gsm.min);
    if (state.gsm.max != null) parts.push('max-' + state.gsm.max);
    params.set('gsm', parts.join(','));
  }
  if (state.availability.min != null || state.availability.max != null) {
    const parts: string[] = [];
    if (state.availability.min != null) parts.push('min-' + state.availability.min);
    if (state.availability.max != null) parts.push('max-' + state.availability.max);
    params.set('total_quantity', parts.join(','));
  }
  // Sort: ?sort-by=availability (live format); omit when default
  if (sort !== DEFAULT_SORT) params.set('sort-by', sort);
  // Page: 1-based, omit page 1
  if (page > 0) params.set('page', String(page + 1));
  return params.toString();
}

/**
 * Parse a live-format range param like "min-2000,max-5000" into { min, max }.
 * Also accepts the old demo format "2000" for a single bound (legacy compat).
 */
function parseLiveRange(raw: string | null): RangeSelection {
  if (!raw) return { min: null, max: null };
  let min: number | null = null;
  let max: number | null = null;
  const parts = raw.split(',').map(s => s.trim());
  for (const part of parts) {
    if (part.startsWith('min-')) {
      const n = Number(part.slice(4));
      if (Number.isFinite(n)) min = n;
    } else if (part.startsWith('max-')) {
      const n = Number(part.slice(4));
      if (Number.isFinite(n)) max = n;
    } else {
      // Legacy single-value fallback (e.g. old ?price-min=2000 is now handled
      // by the price-min branch in hydrateLiveParams; this branch handles a raw number)
      const n = Number(part);
      if (Number.isFinite(n)) min = n;
    }
  }
  return { min, max };
}

function splitCsv(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function num(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Hydrate FilterState from LIVE URL params.
 * Accepts both live format and the old demo format for backward compat.
 */
function hydrateLiveParams(sp: URLSearchParams | null): { state: FilterState; sort: SortKey; page: number } | null {
  if (!sp) return null;
  // Check if any relevant params are present
  const hasParams =
    sp.has('calculatedPrice') || sp.has('gsm') || sp.has('total_quantity') ||
    sp.has('inStock') || sp.has('color') || sp.has('material') || sp.has('pattern') ||
    sp.has('craft') || sp.has('sort-by') || sp.has('page') ||
    // legacy demo params (backward compat)
    sp.has('price-min') || sp.has('price-max') || sp.has('gsm-min') || sp.has('gsm-max') ||
    sp.has('avail-min') || sp.has('avail-max') || sp.has('stock') || sp.has('sort');

  if (!hasParams) return null;

  // Price range: live ?calculatedPrice=min-2000,max-5000 OR legacy ?price-min=2000&price-max=5000
  let price: RangeSelection;
  if (sp.has('calculatedPrice')) {
    price = parseLiveRange(sp.get('calculatedPrice'));
  } else {
    price = { min: num(sp.get('price-min')), max: num(sp.get('price-max')) };
  }

  // GSM range: live ?gsm=min-100,max-200 OR legacy ?gsm-min=100&gsm-max=200
  let gsm: RangeSelection;
  if (sp.has('gsm') && (sp.get('gsm') ?? '').includes('-')) {
    gsm = parseLiveRange(sp.get('gsm'));
  } else {
    gsm = { min: num(sp.get('gsm-min')), max: num(sp.get('gsm-max')) };
  }

  // Availability range: live ?total_quantity=min-10,max-50 OR legacy ?avail-min=10&avail-max=50
  let availability: RangeSelection;
  if (sp.has('total_quantity')) {
    availability = parseLiveRange(sp.get('total_quantity'));
  } else {
    availability = { min: num(sp.get('avail-min')), max: num(sp.get('avail-max')) };
  }

  // Stock: live ?inStock=true OR legacy ?stock=1
  const stockOnly = sp.get('inStock') === 'true' || sp.get('stock') === '1' || sp.get('stock') === 'true';

  // Sort: live ?sort-by=low-to-high OR legacy ?sort=low-to-high
  const sortRaw = sp.get('sort-by') ?? sp.get('sort') ?? 'availability';
  const sortAllowed: SortKey[] = ['availability', 'new-arrival', 'low-to-high', 'high-to-low'];
  const sort: SortKey = sortAllowed.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : 'availability';

  // Page: 1-based
  const page = Math.max(0, (parseInt(sp.get('page') ?? '1', 10) || 1) - 1);

  const state: FilterState = {
    craft: splitCsv(sp.get('craft')),
    color: splitCsv(sp.get('color')),
    material: splitCsv(sp.get('material')),
    pattern: splitCsv(sp.get('pattern')),
    stockOnly,
    price,
    gsm,
    availability,
  };

  return { state, sort, page };
}

/**
 * Normalise raw parsed URL craft/color/material/pattern values back to canonical
 * option names so the matching checkboxes appear checked.
 */
function normaliseFilterState(raw: FilterState, filters?: CatalogueFilters | null): FilterState {
  if (!raw) return EMPTY_FILTER_STATE;
  if (!filters) return raw;

  const segments = Array.isArray(filters.segments) ? filters.segments : [];
  const craftOptions: string[] =
    filters.segmentLabel === 'Category'
      ? segments.map((s) => s?.segmentCategoryName || '').filter(Boolean)
      : Array.from(
          new Set(
            segments.flatMap((s) =>
              Array.isArray(s?.optionList)
                ? s.optionList.map((o) => o?.subCategoryName || '').filter(Boolean)
                : []
            ),
          ),
        );

  const resolve = (values: string[] | undefined, options: string[]): string[] =>
    (values || [])
      .map((v) => {
        if (!v) return '';
        const lv = v.toLowerCase().replace(/-/g, ' ');
        return options.find((o) => (o ?? '').toLowerCase() === lv) ?? v;
      })
      .filter(Boolean);

  const colorNames = Array.isArray(filters.colors) ? filters.colors.map((c) => c?.name || '').filter(Boolean) : [];
  const materialNames = Array.isArray(filters.materials) ? filters.materials.map((m) => m?.name || '').filter(Boolean) : [];
  const patternNames = Array.isArray(filters.patterns) ? filters.patterns.map((p) => p?.name || '').filter(Boolean) : [];

  return {
    ...raw,
    craft: resolve(raw.craft, craftOptions),
    color: resolve(raw.color, colorNames),
    material: resolve(raw.material, materialNames),
    pattern: resolve(raw.pattern, patternNames),
  };
}

/**
 * Build BFF query string (internal API params, separate from live URL contract).
 * The BFF at /api/catalogue/[group] uses legacy param names.
 */
function buildBffQs(
  state: FilterState,
  sort: SortKey,
  page: number,
  pageSize: number,
  lockedCategory?: string | null,
): string {
  const params = new URLSearchParams();
  // Keep the server-side result scoped to the landing category (swatchkit /
  // home / apparel / accessories) — mirrors the page's initial SSR scoping.
  if (lockedCategory) params.set('category', lockedCategory);
  if (state.craft.length) params.set('craft', state.craft.join(','));
  if (state.color.length) params.set('color', state.color.join(','));
  if (state.material.length) params.set('material', state.material.join(','));
  if (state.pattern.length) params.set('pattern', state.pattern.join(','));
  if (state.stockOnly) params.set('stock', '1');
  if (state.price.min != null) params.set('price-min', String(state.price.min));
  if (state.price.max != null) params.set('price-max', String(state.price.max));
  if (state.gsm.min != null) params.set('gsm-min', String(state.gsm.min));
  if (state.gsm.max != null) params.set('gsm-max', String(state.gsm.max));
  if (state.availability.min != null) params.set('avail-min', String(state.availability.min));
  if (state.availability.max != null) params.set('avail-max', String(state.availability.max));
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (page > 0) params.set('page', String(page));
  params.set('size', String(pageSize));
  return params.toString();
}

// ---------------------------------------------------------------------------
// Hero Banner component (category landing only)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Breadcrumb (#15) — Home > Fabrics / Home > Finished > Apparel. Each parent
// level is a link; the current (last) level is plain text. Kept on mobile.
// ---------------------------------------------------------------------------
function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-bark">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label + i} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-clay transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-gray-700' : ''} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span className="text-gray-300">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CategoryHeroBanner({ data }: { data: HeroBannerData }) {
  return (
    <div
      className="w-full flex items-center justify-between gap-4 px-4 md:px-10 py-6 md:py-8 mb-6"
      style={{ backgroundColor: '#f5f5f5' }}
    >
      <div className="flex-1 text-center md:text-left">
        <h1
          className="text-2xl md:text-4xl font-semibold capitalize mb-2"
          style={{ fontFamily: 'DM Serif Display, serif', color: '#3d2c1e' }}
        >
          {data.h1}
        </h1>
        <p className="text-xs md:text-base text-gray-600 max-w-xl">{data.description}</p>
      </div>
      <div className="hidden md:flex justify-end flex-shrink-0 max-h-[250px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image}
          alt={data.h1}
          className="object-contain max-h-[250px] max-w-[220px]"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shop By Category tiles (category landing only, hidden on mobile)
// ---------------------------------------------------------------------------
function CategoryTiles({
  tiles,
  category,
}: {
  tiles: CategoryTile[];
  category: string;
}) {
  return (
    <div className="hidden md:flex items-center gap-4 md:gap-10 px-4 md:px-10 mb-8">
      <h2
        className="text-xl font-semibold whitespace-nowrap"
        style={{ fontFamily: 'DM Serif Display, serif', color: '#3d2c1e' }}
      >
        Shop By Category
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        {tiles.map((tile) => (
          <a
            key={tile.slug}
            href={`/products/finished?category=${category}&${tile.slug.replace(/-/g, '')}=all`}
            className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs capitalize hover:bg-blue-50 transition-colors cursor-pointer"
            style={{ color: '#3d2c1e' }}
          >
            {tile.icon ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={tile.icon}
                alt={tile.name}
                width={24}
                height={24}
                className="h-6 w-6 object-contain flex-shrink-0"
                loading="lazy"
              />
            ) : null}
            {tile.name}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function CatalogueShell({
  title,
  initialProducts,
  initialTotal,
  initialFacets,
  group,
  filters,
  aspect = 'square',
  initialState,
  initialSort = DEFAULT_SORT,
  pageSize = PAGE_SIZE,
  heroBanner,
  categoryTiles,
  breadcrumb,
  lockedCategory,
}: CatalogueShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const didHydrate = useRef(false);

  // Hydrate from URL on initial render
  const hydrated = hydrateLiveParams(searchParams);
  const urlFilterState = hydrated
    ? normaliseFilterState(hydrated.state, filters)
    : initialState;
  const urlSort = hydrated ? hydrated.sort : initialSort;
  const urlPage = hydrated ? hydrated.page : 0;
  const hasUrlFilters = hydrated !== null;

  const [state, setState] = useState<FilterState>(urlFilterState);
  const [sort, setSort] = useState<SortKey>(urlSort);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // First page is SERVER-rendered (initialProducts); every subsequent
  // filter/sort/page change fetches ONE page from /api/catalogue/[group].
  // The full catalogue never ships to the client.
  const [products, setProducts] = useState<CatalogueProduct[]>(
    hasUrlFilters ? [] : initialProducts,
  );
  const [total, setTotal] = useState(hasUrlFilters ? 0 : initialTotal);
  // Latest facet counts (per-option result counts). Updated on every BFF
  // response so the sidebar counts + disabled options track the selection.
  const [facets, setFacets] = useState<CatalogueFacets>(initialFacets ?? EMPTY_FACETS);
  const [page, setPage] = useState(hasUrlFilters ? urlPage : 0);
  const [loading, setLoading] = useState(!!hasUrlFilters);

  const syncUrl = useCallback(
    (next: FilterState, nextSort: SortKey, nextPage: number) => {
      const qs = buildLiveQs(next, nextSort, nextPage, lockedCategory);
      window.history.replaceState(null, '', qs ? pathname + '?' + qs : pathname);
    },
    [pathname, lockedCategory],
  );

  // ---------------------------------------------------------------------------
  // fetchPage: BFF round-trip for every filter/sort/page change. An
  // AbortController stale-guard cancels the in-flight request on rapid filter
  // changes so a slow older response can never overwrite a newer one.
  // ---------------------------------------------------------------------------
  const abortRef = useRef<AbortController | null>(null);
  const fetchPage = useCallback(
    async (nextState: FilterState, nextSort: SortKey, nextPage: number) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const qs = buildBffQs(nextState, nextSort, nextPage, pageSize, lockedCategory);
        const url = `/api/catalogue/${group}?${qs}`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok || ac.signal.aborted) return;
        const data = (await res.json()) as { products: CatalogueProduct[]; total: number; facets?: CatalogueFacets };
        if (ac.signal.aborted) return; // stale — a newer request superseded us
        setProducts(data.products);
        setTotal(data.total);
        if (data.facets) setFacets(data.facets);
        setPage(nextPage);
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return; // superseded — not an error
      } finally {
        // Only the LATEST request may clear the spinner.
        if (abortRef.current === ac) setLoading(false);
      }
    },
    [group, pageSize, lockedCategory],
  );

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    if (hasUrlFilters) {
      fetchPage(urlFilterState, urlSort, urlPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback(
    (next: FilterState) => {
      setState(next);
      syncUrl(next, sort, 0);
      fetchPage(next, sort, 0);
    },
    [sort, syncUrl, fetchPage],
  );

  const onClear = useCallback(() => {
    setState(EMPTY_FILTER_STATE);
    syncUrl(EMPTY_FILTER_STATE, sort, 0);
    fetchPage(EMPTY_FILTER_STATE, sort, 0);
  }, [sort, syncUrl, fetchPage]);

  const onSortChange = useCallback(
    (s: SortKey) => {
      setSort(s);
      syncUrl(state, s, 0);
      fetchPage(state, s, 0);
    },
    [state, syncUrl, fetchPage],
  );

  const onPageChange = useCallback(
    (nextPage: number) => {
      syncUrl(state, sort, nextPage);
      fetchPage(state, sort, nextPage);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [state, sort, syncUrl, fetchPage],
  );

  const activeFilterCount =
    state.craft.length +
    state.color.length +
    state.material.length +
    state.pattern.length +
    (state.stockOnly ? 1 : 0) +
    (state.price.min != null || state.price.max != null ? 1 : 0) +
    (state.gsm.min != null || state.gsm.max != null ? 1 : 0) +
    (state.availability.min != null || state.availability.max != null ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    // pb-20 lg:pb-0 creates bottom room for the mobile sticky bar on small viewports.
    <main className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Category hero banner — only on category landing pages */}
      {heroBanner && <CategoryHeroBanner data={heroBanner} />}

      {/* Shop By Category tiles — only on category landing pages, desktop only */}
      {categoryTiles && lockedCategory && (
        <CategoryTiles tiles={categoryTiles} category={lockedCategory} />
      )}

      {/* No visible H1 — live site has no "Handwoven Fabrics" heading above the grid.
          `title` prop is used for metadata only (see page.tsx). */}
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb (#15) — spans full width above the filter+grid row */}
        {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
        <div className="flex gap-8 items-start">
          {/* Sidebar: self-aligns to the top, sticky while grid scrolls. */}
          <aside className="hidden lg:block w-64 lg:w-72 shrink-0 self-start sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
            <FilterSidebar filters={filters} facets={facets} state={state} onChange={onChange} onClear={onClear} />
          </aside>

          <section className="flex-1 min-w-0">
            <SortBar
              count={total}
              sort={sort}
              onSortChange={onSortChange}
              onOpenFilters={() => setDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
            />
            {/* Active filter chips row — shown below SortBar when any filters are active */}
            <ActiveFilterChips
              state={state}
              filters={filters}
              onRemove={onChange}
              onClearAll={onClear}
            />
            <ProductGrid
              products={products}
              aspect={aspect}
              withSidebar
              loading={loading}
              group={group}
              swatchPercentage={filters.swatchPercentage}
              onLoginClick={() => setLoginOpen(true)}
            />
            {total > pageSize && !loading && (
              <Paginator currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
            )}
          </section>
        </div>
      </div>

      {/* Mobile sticky bottom bar — brown "Filters (N)" bar, visible at mobile, hidden at lg+.
          Shows product count (total) when filters are active. */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex"
        style={{ backgroundColor: '#8d7961' }}
      >
        <button
          type='button'
          onClick={() => setDrawerOpen(true)}
          className='flex-1 flex items-center justify-center gap-2 py-4 text-white font-medium text-sm uppercase tracking-widest'
        >
          <span className='material-symbols-outlined text-[18px]'>tune</span>
          Filters ({total.toLocaleString('en-IN')})
        </button>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm uppercase tracking-widest text-bark font-medium">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-sand text-gray-600"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <FilterSidebar filters={filters} facets={facets} state={state} onChange={onChange} onClear={onClear} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-5 w-full bg-clay text-white text-xs uppercase tracking-widest py-3 rounded"
            >
              Show {total.toLocaleString('en-IN')} products
            </button>
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}
