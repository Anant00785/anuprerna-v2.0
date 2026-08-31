import { Suspense } from 'react';
import type { Metadata } from 'next';
import CatalogueShell from '@/components/catalogue/CatalogueShell';
import { getCachedFullCatalogue } from '@/components/catalogue/loom';
import { EMPTY_FILTER_STATE, type CatalogueFilters, parseLiveSearchParams, type NextSearchParams } from '@/components/catalogue/types';
import { applyFilterSortPage, computeFacets } from '@/components/catalogue/filter-sort';
import JsonLd from '@/components/seo/JsonLd';
import { absUrl, productPath } from '@/lib/seo/config';

// ---------------------------------------------------------------------------
// Fabric PLP — /products/fabric
//
// ?category=swatchkit scopes the product set to swatch-kit products and shows
// a hero banner. Without ?category= the full fabric catalogue is shown.
// This page is DYNAMIC (not force-static) so searchParams are available at
// request time when a category is present.
// ---------------------------------------------------------------------------

export const revalidate = 3600;

const PAGE_SIZE = 31;

// ---- Swatch-kit category config -------------------------------------------
// The Loom API returns segment.category.name = 'SwatchKit' for swatch products.
// This maps to the projected categoryName field in CatalogueProduct.
const SWATCHKIT_CATEGORY_API_NAME = 'SwatchKit';

const SWATCHKIT_H1 = 'Swatchkits';
const SWATCHKIT_DESCRIPTION =
  "Explore Anuprerna fabric swatch kits featuring Jamdani, natural dye, silk, and other artisanal fabrics. Perfect for previewing sustainable, handwoven textiles.";
const SWATCHKIT_IMAGE =
  'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/filter/swatchkit-banner.png';

// ---------------------------------------------------------------------------
// Dynamic metadata (category-aware)
// ---------------------------------------------------------------------------
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const isSwatchkit = (category ?? '').toLowerCase() === 'swatchkit';
  const canonicalUrl = absUrl(isSwatchkit ? '/products/fabric?category=swatchkit' : '/products/fabric');
  if (isSwatchkit) {
    return {
      title: 'Swatchkits | Anuprerna',
      description: SWATCHKIT_DESCRIPTION,
      robots: { index: false, follow: false },
      alternates: { canonical: canonicalUrl },
      openGraph: { url: canonicalUrl },
    };
  }
  return {
    title: 'Handwoven Fabrics | Anuprerna',
    description: 'Browse handwoven artisanal fabrics by craft, material, colour and pattern.',
    robots: { index: false, follow: false },
    alternates: { canonical: canonicalUrl },
    openGraph: { url: canonicalUrl },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function FabricPage({
  searchParams,
}: {
  searchParams: Promise<NextSearchParams>;
}) {
  const params = await searchParams;
  const isSwatchkit = ((params.category ?? '') as string).toLowerCase() === 'swatchkit';

  // Parse user filter/sort/page from URL search params (live format).
  // This powers correct SSR for filtered/paginated deep-links and shared URLs:
  // the server renders the ALREADY-FILTERED first page instead of the full catalogue.
  const parsed = parseLiveSearchParams(params);
  const userFilterState = parsed?.filterState ?? EMPTY_FILTER_STATE;
  const userSort = parsed?.sort ?? 'recommended';
  const userPage = parsed?.page ?? 0;

  const { allProducts, filters } = await getCachedFullCatalogue('fabric');

  // Category scope: when ?category=swatchkit, filter to only swatch-kit products.
  // The CatalogueShell applies user filters ON TOP of this scoped set.
  // Without a category param the full fabric catalogue is used (no change in behaviour).
  const scopedProducts = isSwatchkit
    ? allProducts.filter(
        (p) =>
          (p.categoryName ?? '').toLowerCase() === SWATCHKIT_CATEGORY_API_NAME.toLowerCase(),
      )
    : allProducts.filter(
        (p) =>
          (p.categoryName ?? '').toLowerCase() !== SWATCHKIT_CATEGORY_API_NAME.toLowerCase(),
      );

  // Apply user filter state + sort + page offset SERVER-SIDE so the SSR HTML
  // already reflects the correct filtered/paginated result (SEO, sharing, no-JS).
  const { products: initialProducts, total: initialTotal } = applyFilterSortPage(
    scopedProducts,
    userFilterState,
    userSort,
    userPage,
    PAGE_SIZE,
  );

  // Amazon-style faceted counts for the SSR first paint (no count-less flash).
  const initialFacets = computeFacets(scopedProducts, userFilterState, filters);

  const catalogueFilters: CatalogueFilters = {
    segments: filters.segments,
    segmentLabel: 'Craft',
    colors: filters.colors,
    materials: filters.materials,
    patterns: filters.patterns,
    priceRange: filters.priceRange,
    gsmRange: filters.gsmRange,
    availabilityRange: filters.availabilityRange,
    // Pass the SWATCH_PRICE_PERCENTAGE through so ProductCard can render the
    // per-card Order-Swatch button. getCachedFullCatalogue fetches it from
    // /get/settings-list; omitting it here was the root cause of the button
    // not rendering (canSwatch = false when swatchPercentage is undefined).
    swatchPercentage: filters.swatchPercentage,
  };

  // Hero banner: only when ?category=swatchkit
  const heroBanner = isSwatchkit
    ? {
        h1: SWATCHKIT_H1,
        description: SWATCHKIT_DESCRIPTION,
        image: SWATCHKIT_IMAGE,
      }
    : null;

  const breadcrumbItems = isSwatchkit
    ? [
        { label: 'Home', href: '/' },
        { label: 'Fabrics', href: '/products/fabric' },
        { label: 'Swatchkits' },
      ]
    : [{ label: 'Home', href: '/' }, { label: 'Fabrics' }];

  // --- Structured data (renders in BOTH modes; harmless while noindexed) -----
  const listingPath = isSwatchkit ? '/products/fabric?category=swatchkit' : '/products/fabric';
  const listingTitle = isSwatchkit ? SWATCHKIT_H1 : 'Handwoven Fabrics';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absUrl(item.href) } : {}),
    })),
  };
  // ItemList reflects the SSR first page only (initialProducts) — the real,
  // already-rendered set, not the full catalogue behind client-side paging.
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: listingTitle,
    url: absUrl(listingPath),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: initialProducts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absUrl(productPath('fabric', p.slug)),
        name: p.name,
      })),
    },
  };

  return (
    <>
      <JsonLd data={[collectionPageJsonLd, breadcrumbJsonLd]} />
      <Suspense fallback={<div className="min-h-screen" />}>
        <CatalogueShell
          title={listingTitle}
          group="fabric"
          initialProducts={initialProducts}
          initialTotal={initialTotal}
          initialFacets={initialFacets}
          filters={catalogueFilters}
          aspect="square"
          initialState={userFilterState}
          initialSort={userSort}
          pageSize={PAGE_SIZE}
          heroBanner={heroBanner}
          breadcrumb={breadcrumbItems}
          lockedCategory={isSwatchkit ? 'swatchkit' : null}
        />
      </Suspense>
    </>
  );
}
