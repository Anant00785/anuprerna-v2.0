import { NextRequest, NextResponse } from 'next/server';
import { getCachedFullCatalogue, applyFilterSortPage } from '@/components/catalogue/loom';
import { computeFacets } from '@/components/catalogue/filter-sort';
import { parseFilterState, parseSortKey } from '@/components/catalogue/types';

// ---------------------------------------------------------------------------
// BFF route: /api/catalogue/[group]
// Query params: craft, color, material, pattern, stock, sort, page, size,
//               price-min, price-max, gsm-min, gsm-max, avail-min, avail-max,
//               category (scopes to a top-level categoryName: swatchkit for
//               fabric; home|apparel|accessories for finished — same scoping
//               the PLP server pages apply to their initial page).
// Returns: { products: CatalogueProduct[], total, page, pageSize }
//
// Backed by getCachedFullCatalogue (unstable_cache, hourly revalidate) — the
// same store the PLP server pages read, so a page's first SSR render and its
// subsequent client fetches see the same catalogue. This route applies
// filter/sort/pagination entirely server-side; the client never receives more
// than one page (~31 products) per request.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 31; // live filter-paginator pageLength
const MAX_PAGE_SIZE = 96;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ group: string }> },
) {
  const { group } = await params;
  if (group !== 'fabric' && group !== 'finished') {
    return NextResponse.json({ error: 'Unknown group' }, { status: 404 });
  }

  const sp = request.nextUrl.searchParams;
  const filterState = parseFilterState({
    craft: sp.get('craft') ?? undefined,
    color: sp.get('color') ?? undefined,
    material: sp.get('material') ?? undefined,
    pattern: sp.get('pattern') ?? undefined,
    stock: sp.get('stock') ?? undefined,
    'price-min': sp.get('price-min') ?? undefined,
    'price-max': sp.get('price-max') ?? undefined,
    'gsm-min': sp.get('gsm-min') ?? undefined,
    'gsm-max': sp.get('gsm-max') ?? undefined,
    'avail-min': sp.get('avail-min') ?? undefined,
    'avail-max': sp.get('avail-max') ?? undefined,
  });
  const sort = parseSortKey(sp.get('sort') ?? undefined);
  const page = Math.max(0, parseInt(sp.get('page') ?? '0', 10) || 0);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    parseInt(sp.get('size') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE,
  );
  // Category scope (mirrors the PLP pages' scopedProducts): matches the
  // projected categoryName case-insensitively ('swatchkit' -> 'SwatchKit',
  // 'home' -> 'Home', ...). Unknown/absent -> full group catalogue.
  const category = (sp.get('category') ?? '').trim().toLowerCase();

  let all;
  let filters;
  try {
    ({ allProducts: all, filters } = await getCachedFullCatalogue(group));
  } catch {
    // Upstream Loom outage (empty-guard threw on a cold cache).
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
  const scoped = category
    ? all.filter((p) => (p.categoryName ?? '').toLowerCase() === category)
    : group === 'fabric'
      ? all.filter((p) => (p.categoryName ?? '').toLowerCase() !== 'swatchkit')
      : all;
  const { products, total } = applyFilterSortPage(scoped, filterState, sort, page, pageSize);

  // Amazon-style faceted counts: per-option result counts computed over the
  // SAME scoped set + current selection (excluding each dimension's own
  // selection). Lean slug->count maps only — no product data.
  const facets = computeFacets(scoped, filterState, filters);

  return NextResponse.json(
    { products, total, page, pageSize, facets },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
