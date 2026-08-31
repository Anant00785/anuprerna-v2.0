import { Suspense } from 'react';
import type { Metadata } from 'next';
import CatalogueShell from '@/components/catalogue/CatalogueShell';
import { getCachedFullCatalogue, getSegmentIconMap } from '@/components/catalogue/loom';
import { EMPTY_FILTER_STATE, type CatalogueFilters, parseLiveSearchParams, type NextSearchParams } from '@/components/catalogue/types';
import { applyFilterSortPage, computeFacets } from '@/components/catalogue/filter-sort';
import JsonLd from '@/components/seo/JsonLd';
import { absUrl, productPath } from '@/lib/seo/config';

// ---------------------------------------------------------------------------
// Category landing — /products/finished?category=home|apparel|accessories
//
// ?category= scopes the product set and controls the hero banner + tile row.
// Without ?category= the full 958-product set is shown (no banner).
// This page is DYNAMIC (not force-static) so searchParams are available
// at request time.
// ---------------------------------------------------------------------------

export const revalidate = 3600;

const PAGE_SIZE = 31;

// ---- Category config -------------------------------------------------------
type FinishedCategory = 'home' | 'apparel' | 'accessories';

// Map URL ?category= value → Loom segment.category.name (verified from API)
const CATEGORY_API_NAME: Record<FinishedCategory, string> = {
  home: 'Home',
  apparel: 'Apparel',
  accessories: 'Accessories',
};

const CATEGORY_H1: Record<FinishedCategory, string> = {
  home: 'Homeware',
  apparel: 'Apparel',
  accessories: 'Accessories',
};

const CATEGORY_DESCRIPTION: Record<FinishedCategory, string> = {
  home: 'Anuprerna offers a variety of handmade and sustainable homewares products. Choose from a Wide Range of Houseware Items. Enjoy ✓ Global Shipping ✓ Bulk Prices',
  apparel: "Women's & Men's Apparel, Elevate your style with Anuprerna's exquisite range of finished apparel. Explore our curated collection for high-quality fabrics. Find your perfect look and shop now!",
  accessories: 'Shop artisanal accessories, Anuprerna - home to your favourite accessories. Shop our exquisite range of scarves, shawls, and more, crafted with traditional techniques and premium quality materials',
};

const CATEGORY_IMAGE: Record<FinishedCategory, string> = {
  home: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/filter/homeware-banner.png',
  apparel: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/filter/apparel-banner.png',
  accessories: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/filter/accessories-banner.png',
};

const CATEGORY_PAGE_TITLE: Record<FinishedCategory, string> = {
  home: 'Homeware | Anuprerna',
  apparel: 'Apparel | Anuprerna',
  accessories: 'Accessories | Anuprerna',
};

// Shop By Category tile definitions per landing category
const CATEGORY_TILES: Record<FinishedCategory, { name: string; slug: string }[]> = {
  home: [
    { name: 'Kitchenware', slug: 'kitchenware' },
    { name: 'Home Linen', slug: 'home-linen' },
    { name: 'Decor', slug: 'decor' },
  ],
  apparel: [
    { name: 'Men', slug: 'men' },
    { name: 'Women', slug: 'women' },
    { name: 'Unisex', slug: 'unisex' },
    { name: 'Kids', slug: 'kids' },
  ],
  accessories: [
    { name: 'Fabric Envelope', slug: 'fabric-envelope' },
    { name: 'Scrunchies', slug: 'scrunchies' },
    { name: 'Scarf', slug: 'scarf' },
    { name: 'Bags', slug: 'bags' },
    { name: 'Wall Art', slug: 'wall-art' },
    { name: 'Unisex', slug: 'unisex' },
  ],
};

// ---------------------------------------------------------------------------
// Dynamic metadata (category-aware)
// ---------------------------------------------------------------------------
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const cat = (category ?? '') as FinishedCategory;
  if (cat && CATEGORY_PAGE_TITLE[cat]) {
    const canonicalPath = '/products/finished?category=' + cat;
    return {
      title: CATEGORY_PAGE_TITLE[cat],
      description: CATEGORY_DESCRIPTION[cat],
      robots: { index: false, follow: false },
      alternates: { canonical: absUrl(canonicalPath) },
      openGraph: {
        title: CATEGORY_PAGE_TITLE[cat],
        description: CATEGORY_DESCRIPTION[cat],
        url: absUrl(canonicalPath),
        images: [CATEGORY_IMAGE[cat]],
      },
    };
  }
  return {
    title: 'Finished Products | Anuprerna',
    description: 'Apparel, homeware and accessories crafted from our handwoven fabrics.',
    robots: { index: false, follow: false },
    alternates: { canonical: absUrl('/products/finished') },
    openGraph: {
      title: 'Finished Products | Anuprerna',
      description: 'Apparel, homeware and accessories crafted from our handwoven fabrics.',
      url: absUrl('/products/finished'),
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function FinishedPage({
  searchParams,
}: {
  searchParams: Promise<NextSearchParams>;
}) {
  const params = await searchParams;
  const rawCat = ((params.category ?? '') as string).toLowerCase() as FinishedCategory;
  const validCat = rawCat && CATEGORY_API_NAME[rawCat] ? rawCat : null;

  // Parse user filter/sort/page from URL search params (live format).
  const parsed = parseLiveSearchParams(params);
  const userFilterState = parsed?.filterState ?? EMPTY_FILTER_STATE;
  const userSort = parsed?.sort ?? 'recommended';
  const userPage = parsed?.page ?? 0;

  const { allProducts, filters } = await getCachedFullCatalogue('finished');

  // Category scope: pre-filter the full catalogue to only the chosen category.
  // The CatalogueShell then applies user filters ON TOP of this scoped set.
  const scopedProducts = validCat
    ? allProducts.filter(
        (p) =>
          (p.categoryName ?? '').toLowerCase() === CATEGORY_API_NAME[validCat].toLowerCase(),
      )
    : allProducts;

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
    segmentLabel: 'Category',
    colors: filters.colors,
    materials: filters.materials,
    patterns: filters.patterns,
    priceRange: filters.priceRange,
    gsmRange: filters.gsmRange,
    availabilityRange: filters.availabilityRange,
  };

  // Hero + tiles data (only when a valid category is in the URL)
  const heroBanner = validCat
    ? {
        h1: CATEGORY_H1[validCat],
        description: CATEGORY_DESCRIPTION[validCat],
        image: CATEGORY_IMAGE[validCat],
      }
    : null;
  // Enrich the Shop-By-Category tiles with backend segment-category icons.
  // Match by (category name + segment name), case-insensitive; fall back to a
  // name-only match. Tiles with no matching icon stay text-only (graceful).
  let categoryTiles = validCat ? CATEGORY_TILES[validCat] : null;
  if (validCat && categoryTiles) {
    const iconMap = await getSegmentIconMap();
    const catKey = CATEGORY_API_NAME[validCat].toLowerCase();
    categoryTiles = categoryTiles.map((t) => {
      const nameKey = t.name.toLowerCase();
      const icon =
        iconMap.byCategoryAndName[catKey + "::" + nameKey] ?? iconMap.byName[nameKey];
      return icon ? { ...t, icon } : t;
    });
  }

  const breadcrumbItems = validCat
    ? [
        { label: 'Home', href: '/' },
        { label: 'Finished', href: '/products/finished' },
        { label: CATEGORY_H1[validCat] },
      ]
    : [{ label: 'Home', href: '/' }, { label: 'Finished' }];

  // --- Structured data (renders in BOTH modes; harmless while noindexed) -----
  const listingTitle = validCat ? CATEGORY_H1[validCat] : 'Finished Products';
  const listingPath = validCat ? '/products/finished?category=' + validCat : '/products/finished';
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
        url: absUrl(productPath('finished', p.slug)),
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
          group="finished"
          initialProducts={initialProducts}
          initialTotal={initialTotal}
          initialFacets={initialFacets}
          filters={catalogueFilters}
          aspect="portrait"
          initialState={userFilterState}
          initialSort={userSort}
          pageSize={PAGE_SIZE}
          heroBanner={heroBanner}
          categoryTiles={categoryTiles}
          breadcrumb={breadcrumbItems}
          lockedCategory={validCat}
        />
      </Suspense>
    </>
  );
}
