import CatalogueShell from '@/components/catalogue/CatalogueShell';
import {
  getFabricProducts,
  getFinishedProducts,
  getFabricCraftNav,
  getFinishedApparelNav,
  getColorList,
  getMaterialList,
  getPatternList,
  applyFilterSortPage,
  computeRanges,
} from '@/components/catalogue/loom';
import {
  parseFilterState,
  parseSortKey,
  type CatalogueFilters,
  type RawCatalogueParams,
} from '@/components/catalogue/types';

export const revalidate = 3600;

export const metadata = {
  title: 'Filter Catalogue | Anuprerna',
  description: 'Refined product filtering across the Anuprerna catalogue.',
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 31; // live filter-paginator pageLength

// /filter?category=fabric|finished (defaults to fabric). Also accepts the same
// craft/color/material/pattern/stock/sort/range params as the dedicated pages.
export default async function FilterPage({
  searchParams,
}: {
  searchParams: Promise<RawCatalogueParams>;
}) {
  const params = await searchParams;
  const isFinished = (params.category ?? 'fabric').toLowerCase() === 'finished';
  const filterState = parseFilterState(params);
  const sort = parseSortKey(params.sort);
  const group: 'fabric' | 'finished' = isFinished ? 'finished' : 'fabric';

  const [allProducts, segments, colors, materials, patterns] = await Promise.all([
    isFinished ? getFinishedProducts() : getFabricProducts(),
    isFinished ? getFinishedApparelNav() : getFabricCraftNav(),
    getColorList(),
    getMaterialList(),
    getPatternList(),
  ]);

  const { products: initialProducts, total: initialTotal } = applyFilterSortPage(
    allProducts,
    filterState,
    sort,
    0,
    PAGE_SIZE,
  );
  const ranges = computeRanges(allProducts);

  const filters: CatalogueFilters = {
    segments,
    segmentLabel: isFinished ? 'Category' : 'Craft',
    colors,
    materials,
    patterns,
    priceRange: ranges.priceRange,
    gsmRange: ranges.gsmRange,
    availabilityRange: ranges.availabilityRange,
  };

  return (
    <CatalogueShell
      title={isFinished ? 'Finished Products' : 'Handwoven Fabrics'}
      group={group}
      initialProducts={initialProducts}
      initialTotal={initialTotal}
      filters={filters}
      aspect={isFinished ? 'portrait' : 'square'}
      initialState={filterState}
      initialSort={sort}
      pageSize={PAGE_SIZE}
    />
  );
}
