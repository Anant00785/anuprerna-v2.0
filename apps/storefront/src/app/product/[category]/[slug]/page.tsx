import type { Metadata } from 'next';
import Link from 'next/link';
import { getCachedProduct, getReviewStats, getProductReviews, getRelatedStories } from '@/components/product/loom';
import { getFabricProducts, getFinishedProducts } from '@/components/catalogue/loom';
import ImageGallery from '@/components/product/ImageGallery';
import ProductInfoPanel from '@/components/product/ProductInfoPanel';
import ReviewsSection from '@/components/product/ReviewsSection';
import BadgeStrip from '@/components/product/BadgeStrip';
import KeyFeatures from '@/components/product/KeyFeatures';
import DiscoverCraft from '@/components/product/DiscoverCraft';
import RelatedProducts from '@/components/product/RelatedProducts';
import UnavailableShell from '@/components/UnavailableShell';
import JsonLd from '@/components/seo/JsonLd';
import { absUrl, productPath, robotsMeta, metaDescription } from '@/lib/seo/config';
import Link from 'next/link';

export const revalidate = 1800;

function normGroup(category: string): 'finished' | 'fabric' {
  return category === 'finished-product' || category === 'finished' ? 'finished' : 'fabric';
}

// Slugify a facet value the way the catalogue filter expects (mirror of
// components/catalogue/filter-sort.ts toSlug) so the breadcrumb craft link
// resolves to a filtered listing.
function slugifyFacet(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// generateMetadata reuses the SAME per-request cached product fetch as the page
// (getCachedProduct) — no double-fetch. robots flips on SEO_MODE via robotsMeta().
// Canonical + OG url always resolve to SITE_URL (anuprerna.com), never vercel.app.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const norm = await getCachedProduct(category, slug);
  if (!norm || norm === 'unavailable') {
    return { title: 'Product | Anuprerna', robots: robotsMeta() };
  }
  const { product } = norm;
  const group = normGroup(category);
  const path = productPath(group, product.slug || slug);
  const title = product.metaTitle?.trim() || product.name;
  const description =
    product.metaDescription?.trim() || metaDescription(product.productOverview) || undefined;
  const image = product.heroImage || undefined;

  return {
    title,
    description,
    robots: robotsMeta(),
    alternates: { canonical: absUrl(path) },
    openGraph: {
      type: 'website',
      url: absUrl(path),
      title,
      description,
      siteName: 'Anuprerna',
      images: image ? [{ url: image, alt: product.heroImageAlt || product.name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  const isFinished = category === 'finished-product' || category === 'finished';

  const norm = await getCachedProduct(category, slug);
  if (norm === 'unavailable') {
    // Product exists but is disabled (founder rule: storefront must only ever
    // show ENABLED products -- see team-product-unpublish journey). Reuse the
    // same RelatedProducts grid as the normal PDP "You May Also Like" section,
    // seeded from the category catalogue (we deliberately don't have the
    // disabled product's own taxonomy here -- the backend soft-denies before
    // leaking any of its data).
    const unavailableRelated = isFinished ? await getFinishedProducts() : await getFabricProducts();
    return (
      <UnavailableShell
        slug={slug}
        backHref={isFinished ? '/products/finished' : '/products/fabric'}
        backLabel={isFinished ? 'Finished Products' : 'Fabric'}
        message='This product is no longer available.'
        relatedProducts={unavailableRelated.slice(0, 8)}
      />
    );
  }
  if (!norm) {
    return (
      <UnavailableShell
        slug={slug}
        backHref={isFinished ? '/products/finished' : '/products/fabric'}
        backLabel={isFinished ? 'Finished Products' : 'Fabric'}
      />
    );
  }

  const { product, images, media, gsm, width, recordId, addToSwatch, swatchPercentage } = norm;

  const [relatedRaw, reviewStats, reviews, relatedStories] = await Promise.all([
    isFinished ? getFinishedProducts() : getFabricProducts(),
    getReviewStats(product.id, isFinished ? 'finished' : 'fabric'),
    getProductReviews(product.id),
    isFinished ? Promise.resolve([]) : getRelatedStories(recordId),
  ]);

  // Render rating/count ONLY from REAL Loom stats — never invent numbers.
  const hasReviews = !!(reviewStats && reviewStats.count > 0);
  const reviewRating = reviewStats?.rating ?? 0;
  const reviewCount = reviewStats?.count ?? 0;
  const displayRating = hasReviews ? Math.max(0, reviewRating - 0.2).toFixed(1) : '';

  // Rank related by real relevance (same subcategory, then shared material)
  // rather than a blind slice. relatedRaw stays SERVER-ONLY — only these <=8
  // CatalogueProduct cards reach the (server-rendered) RelatedProducts section.
  const pSub = (product.subCategory?.name || '').toLowerCase();
  const pMats = new Set(
    (product.materials || []).map((m) => (m.name || '').toLowerCase()).filter(Boolean),
  );
  const relScore = (c: (typeof relatedRaw)[number]) => {
    let s = 0;
    if (pSub && c.subCategoryName?.toLowerCase() === pSub) s += 2;
    if (c.materials?.some((m) => pMats.has((m.name || '').toLowerCase()))) s += 1;
    return s;
  };
  const related = relatedRaw
    .filter((rp) => rp.id !== product.id)
    .map((rp) => ({ rp, s: relScore(rp) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => x.rp);

  const badges = product.badgeProfileEnabled
    ? (product.badgeProfile?.badgeProfileItemList ?? product.subCategory?.badgeProfile?.badgeProfileItemList ?? [])
    : [];

  // --- Structured data (renders in BOTH modes; harmless while noindexed) -----
  const group = normGroup(category);
  const pdpPath = productPath(group, product.slug || slug);
  const productImages = [product.heroImage, product.hoverImage].filter(
    (v, i, a): v is string => !!v && a.indexOf(v) === i,
  );
  const price = Number(product.price);
  const hasPrice = Number.isFinite(price) && price > 0; // omit offers if quote-based/0
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(productImages.length ? { image: productImages } : {}),
    description: product.metaDescription?.trim() || metaDescription(product.productOverview),
    brand: { '@type': 'Brand', name: 'Anuprerna' },
    ...(product.sku ? { sku: product.sku } : {}),
    // aggregateRating ONLY when REAL review data exists — never invented.
    ...(hasReviews
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviewRating,
            reviewCount,
          },
        }
      : {}),
    // offers ONLY when a clean price is rendered (B2B quote-based => omit).
    ...(hasPrice
      ? {
          offers: {
            '@type': 'Offer',
            price: String(price),
            priceCurrency: 'INR',
            url: absUrl(pdpPath),
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            // Rolling +1 year from render time; recomputed every revalidate
            // (1800s) so it never goes meaningfully stale.
            priceValidUntil: (() => {
              const d = new Date();
              d.setFullYear(d.getFullYear() + 1);
              return d.toISOString().slice(0, 10);
            })(),
          },
        }
      : {}),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl('/') },
      {
        '@type': 'ListItem',
        position: 2,
        name: isFinished ? 'Finished Products' : 'Fabric',
        item: absUrl(isFinished ? '/products/finished' : '/products/fabric'),
      },
      ...(product.subCategory?.name
        ? [{ '@type': 'ListItem', position: 3, name: product.subCategory.name }]
        : []),
      {
        '@type': 'ListItem',
        position: product.subCategory?.name ? 4 : 3,
        name: product.name,
        item: absUrl(pdpPath),
      },
    ],
  };

  // Breadcrumb craft link -> filtered PLP listing (same ?craft=<slug> shape the
  // catalogue filter reads; finished keeps its top-level category scope).
  const bcGroup = isFinished ? 'finished' : 'fabric';
  const craftHref = product.subCategory?.name
    ? '/products/' + bcGroup + '?' +
      (product.category?.name && (isFinished || slugifyFacet(product.category.name) === 'swatchkit')
        ? 'category=' + encodeURIComponent(slugifyFacet(product.category.name)) + '&'
        : '') +
      'craft=' + encodeURIComponent(slugifyFacet(product.subCategory.name))
    : '#';

  return (
    <main className='min-h-screen bg-white'>
      <JsonLd data={[productJsonLd, breadcrumbJsonLd]} />
      {/* Breadcrumb */}
      <div className='border-b border-sand'>
        <div className='mx-auto max-w-screen-xl px-4 py-3 text-xs text-black/50 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap'>
          <Link href='/' className='hover:text-clay transition-colors'>Home</Link>
          <span className='material-symbols-outlined text-[12px]'>chevron_right</span>
          <Link
            href={isFinished ? '/products/finished' : '/products/fabric'}
            className='hover:text-clay transition-colors capitalize'
          >
            {isFinished ? 'Finished Products' : 'Fabric'}
          </Link>
          {product.subCategory?.name && (
            <>
              <span className='material-symbols-outlined text-[12px]'>chevron_right</span>
              <Link href={craftHref} className='hover:text-clay transition-colors'>{product.subCategory.name}</Link>
            </>
          )}
          <span className='material-symbols-outlined text-[12px]'>chevron_right</span>
          <span className='text-clay truncate max-w-[200px]'>{product.name}</span>
        </div>
      </div>

      {/* Product layout */}
      <div className='mx-auto max-w-screen-xl px-4 py-4 pb-28 lg:py-12 lg:pb-12'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16'>
          {/* Left — image gallery */}
          <div>
            <ImageGallery
              media={media}
              images={images}
              productSlug={slug}
              category={category}
            />

            {badges.length > 0 && (
              <div className='mt-5 hidden lg:block'>
                {isFinished ? <BadgeStrip badges={badges} /> : <KeyFeatures badges={badges} />}
              </div>
            )}
          </div>

          {/* Right — product info */}
          <div>
            <ProductInfoPanel
              product={product}
              recordId={recordId}
              category={category}
              gsm={gsm}
              width={width}
              addToSwatch={addToSwatch}
              swatchPercentage={swatchPercentage}
              hasReviews={hasReviews}
              reviewRating={reviewRating}
              reviewCount={reviewCount}
              displayRating={displayRating}
            />

            {badges.length > 0 && (
              <div className='mt-6 lg:hidden'>
                {isFinished ? <BadgeStrip badges={badges} /> : <KeyFeatures badges={badges} />}
              </div>
            )}
          </div>
        </div>

        {/* Discover The Craft — fabric-only content cards */}
        {!isFinished && relatedStories.length > 0 && (
          <DiscoverCraft stories={relatedStories} />
        )}

        {/* Reviews — id="reviews" scroll target */}
        {reviewStats && reviewStats.count > 0 && (
          <ReviewsSection displayRating={displayRating} count={reviewCount} reviews={reviews} />
        )}

        {/* Related products */}
        {related.length > 0 && <RelatedProducts products={related} />}
      </div>
    </main>
  );
}
