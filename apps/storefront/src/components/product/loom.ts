import 'server-only';
import { cache } from 'react';
import { loomGet } from '@/lib/loom/client';
import type {
  FabricProductResponse,
  FinishedProductResponse,
  NormalisedProduct,
  ReviewStats,
  ProductReview,
  ProductDetail,
  GalleryMediaItem,
} from './types';
import type { StoryItem } from '@/components/content-list/loom';

// ---------------------------------------------------------------------------
// Product detail route-local Loom helpers.
// Server-only — never import from client components.
// ---------------------------------------------------------------------------

const PDP_REVALIDATE = 1800; // 30 min

// Faithful port of ConstantService.YOUTUBE_VIDEO_REGEX (fabric source).
const YOUTUBE_VIDEO_REGEX =
  /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/shorts\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&]{10,12})/;

function youtubeId(url: string): string | null {
  const m = url.match(YOUTUBE_VIDEO_REGEX);
  if (!m) return null;
  // The source regex can capture up to 12 chars incl. a trailing '?'/'&'; an
  // 11-char YouTube id may pick up the start of the query string — strip it.
  return m[1].replace(/[?&].*$/, '');
}

// ---------------------------------------------------------------------------
// Build the FULL media gallery in the same order as
// product-detail._prepareProductGallery: hero -> video -> hover -> SEO images.
// ---------------------------------------------------------------------------
function buildMedia(product: ProductDetail): GalleryMediaItem[] {
  const media: GalleryMediaItem[] = [];
  const name = product.name;

  if (product.heroImage) {
    media.push({
      src: product.heroImage,
      thumb: product.heroImage,
      alt: product.heroImageAlt || name,
      type: 'image',
    });
  }

  if (product.productVideo) {
    const id = youtubeId(product.productVideo);
    if (id) {
      media.push({
        src: 'https://www.youtube.com/embed/' + id,
        thumb: 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg',
        alt: name + ' — video',
        type: 'youtube',
      });
    }
  }

  if (product.hoverImage && product.hoverImage !== product.heroImage) {
    media.push({
      src: product.hoverImage,
      thumb: product.hoverImage,
      alt: product.hoverImageAlt || name,
      type: 'image',
    });
  }

  const seen = new Set(media.map((m) => m.src));
  for (const seo of product.imageGallerySEOList ?? []) {
    if (seo && !(seo as { deleted?: boolean }).deleted && seo.image && !seen.has(seo.image)) {
      seen.add(seo.image);
      media.push({
        src: seo.image,
        thumb: seo.image,
        alt: seo.altText || name,
        type: 'image',
      });
    }
  }

  return media;
}

// Back-compat image-only list (lightbox / static consumers): images only, hero first.
function imagesFromMedia(media: GalleryMediaItem[]): { src: string; alt: string }[] {
  return media.filter((m) => m.type === 'image').map((m) => ({ src: m.src, alt: m.alt }));
}

// ---------------------------------------------------------------------------
// SWATCH_PRICE_PERCENTAGE setting (cached 30 min, public via Origin: localhost).
// ---------------------------------------------------------------------------
interface SettingItem { attributeName: string; attributeValue: unknown }
async function getSwatchPercentage(): Promise<number> {
  try {
    const res = await loomGet<{ success: boolean; settingsList: SettingItem[] }>(
      '/get/settings-list',
      { revalidate: PDP_REVALIDATE },
    );
    const item = res?.settingsList?.find((s) => s.attributeName === 'SWATCH_PRICE_PERCENTAGE');
    const v = item ? Number(item.attributeValue) : 0;
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

async function fetchFabric(slug: string): Promise<FabricProductResponse | null> {
  // v2 is the primary detail endpoint; fall back to v1 if v2 errors for a given slug
  // (live behaviour — some slugs only resolve on one endpoint).
  try {
    const v2 = await loomGet<FabricProductResponse>('/get/v2/fabric-product/slug/' + slug, { revalidate: PDP_REVALIDATE, tags: ['products'] });
    if (v2?.success && v2.fabricProduct) return v2;
    if (v2?.reason === 'unavailable') return v2; // disabled -- don't fall through to v1
  } catch { /* fall through to v1 */ }
  try {
    const v1 = await loomGet<FabricProductResponse>('/get/fabric-product/slug/' + slug, { revalidate: PDP_REVALIDATE, tags: ['products'] });
    if (v1?.success && v1.fabricProduct) return v1;
    if (v1?.reason === 'unavailable') return v1;
  } catch { /* both failed */ }
  return null;
}

// ---------------------------------------------------------------------------
// Lean the product detail BEFORE it crosses into client components. The raw Loom
// finished-product detail embeds the entire fabric-customization catalogue
// (fabricProfile ~2700 items ≈ 6.7MB) TWICE — top-level AND nested inside
// subCategory — plus other heavy subCategory listing blobs. The PDP renders only
// a small slice, so trimming here drops the finished-PDP payload from ~13MB of
// product data to a few hundred KB with zero visible change.
// ---------------------------------------------------------------------------
const FABRIC_PICKER_MAX = 60;

function leanFabricProfile(
  fp: ProductDetail['fabricProfile'],
  product: ProductDetail,
): ProductDetail['fabricProfile'] {
  const items = fp?.fabricProfileItemList;
  if (!items || items.length === 0) return fp;
  const material = (product.materials?.[0]?.name || '').toLowerCase();
  // Same-material fabrics first (a relevant picker), then cap — the raw list can
  // be the whole catalogue; the UI shows fabricPreview.{heroImage,name,price}.
  const ordered = material
    ? [...items].sort(
        (a, b) =>
          Number((b.fabricPreview.name || '').toLowerCase().includes(material)) -
          Number((a.fabricPreview.name || '').toLowerCase().includes(material)),
      )
    : items;
  const lean = ordered.slice(0, FABRIC_PICKER_MAX).map((f) => ({
    fabricPreview: {
      id: f.fabricPreview.id,
      name: f.fabricPreview.name,
      slug: f.fabricPreview.slug,
      price: f.fabricPreview.price,
      heroImage: f.fabricPreview.heroImage,
    },
  }));
  return { profileName: fp?.profileName, fabricProfileItemList: lean };
}

function leanProductDetail(product: ProductDetail): ProductDetail {
  const sc = product.subCategory;
  return {
    ...product,
    // subCategory: keep only the fields the PDP reads (name / MTO / badges);
    // drop its duplicated 6.7MB fabricProfile + other listing blobs.
    subCategory: sc
      ? {
          name: sc.name,
          slug: sc.slug,
          badgeProfile: sc.badgeProfile,
          madeToOrderProfile: sc.madeToOrderProfile,
        }
      : sc,
    fabricProfile: leanFabricProfile(product.fabricProfile, product),
  };
}

export async function getFabricProduct(slug: string): Promise<NormalisedProduct | null | 'unavailable'> {
  try {
    const [res, swatchPercentage] = await Promise.all([
      fetchFabric(slug),
      getSwatchPercentage(),
    ]);
    if (res?.reason === 'unavailable') return 'unavailable';
    if (!res?.success || !res.fabricProduct) return null;
    const { product, gsm, width, addToSwatch, id } = res.fabricProduct;
    const media = buildMedia(product);
    return {
      product: leanProductDetail({ ...product, addToSwatch }),
      images: imagesFromMedia(media),
      media,
      gsm,
      width,
      addToSwatch,
      recordId: id,
      swatchPercentage,
    };
  } catch {
    return null;
  }
}

export async function getFinishedProduct(slug: string): Promise<NormalisedProduct | null | 'unavailable'> {
  try {
    const [res, swatchPercentage] = await Promise.all([
      loomGet<FinishedProductResponse>('/get/finished-product/slug/' + slug, { revalidate: PDP_REVALIDATE, tags: ['products'] }),
      getSwatchPercentage(),
    ]);
    if (res?.reason === 'unavailable') return 'unavailable';
    if (!res?.success || !res.finishedProduct) return null;
    const { product, id } = res.finishedProduct;
    const media = buildMedia(product);
    return {
      product: leanProductDetail(product),
      images: imagesFromMedia(media),
      media,
      recordId: id,
      swatchPercentage,
    };
  } catch {
    return null;
  }
}

export async function getProduct(
  category: string,
  slug: string,
): Promise<NormalisedProduct | null | 'unavailable'> {
  // Live URL category segment is 'finished-product' / 'fabric-product' (e.g.
  // /product/finished-product/{slug}). Match BOTH the live segment and the short
  // form so the dispatcher never silently falls through to the fabric loader.
  if (category === 'finished-product' || category === 'finished') {
    return getFinishedProduct(slug);
  }
  return getFabricProduct(slug);
}

// ---------------------------------------------------------------------------
// BY-RECORD-ID product detail. The account cart stores fabricProductId /
// finishedProductId (= the fabric/finished RECORD id). Live Loom exposes a
// by-id detail endpoint (/get/{group}-product/{id}) that returns the SAME
// wrapper as the /slug/ endpoint, so the cart-enrich BFF can resolve a line's
// full detail (name, image, finish/size options) even for custom/hidden
// products the preview-list catalogue omits. Reuses the SAME normalization.
// ---------------------------------------------------------------------------
export async function getFabricProductById(id: number): Promise<NormalisedProduct | null> {
  try {
    const res = await loomGet<FabricProductResponse>('/get/fabric-product/' + id, {
      revalidate: PDP_REVALIDATE,
      tags: ['products'],
    });
    if (!res?.success || !res.fabricProduct) return null;
    const { product, gsm, width, addToSwatch, id: recordId } = res.fabricProduct;
    const media = buildMedia(product);
    return {
      product: leanProductDetail({ ...product, addToSwatch }),
      images: imagesFromMedia(media),
      media,
      gsm,
      width,
      addToSwatch,
      recordId,
      swatchPercentage: 0,
    };
  } catch {
    return null;
  }
}

export async function getFinishedProductById(id: number): Promise<NormalisedProduct | null> {
  try {
    const res = await loomGet<FinishedProductResponse>('/get/finished-product/' + id, {
      revalidate: PDP_REVALIDATE,
      tags: ['products'],
    });
    if (!res?.success || !res.finishedProduct) return null;
    const { product, id: recordId } = res.finishedProduct;
    const media = buildMedia(product);
    return {
      product: leanProductDetail(product),
      images: imagesFromMedia(media),
      media,
      recordId,
      swatchPercentage: 0,
    };
  } catch {
    return null;
  }
}

export async function getProductById(
  group: string,
  id: number,
): Promise<NormalisedProduct | null> {
  return group === 'finished' || group === 'finished-product'
    ? getFinishedProductById(id)
    : getFabricProductById(id);
}

export const getCachedProductById = cache(getProductById);

export async function getReviewStats(
  productId: number,
  productGroup: string,
): Promise<ReviewStats | null> {
  try {
    const res = await loomGet<{ success: boolean; reviewStats: ReviewStats }>(
      `/get/review/stats?productId=${productId}&productGroup=${productGroup}`,
      { revalidate: PDP_REVALIDATE },
    );
    return res?.reviewStats ?? null;
  } catch {
    return null;
  }
}

// Real product reviews. Live contract: GET /get/product/review/{productId}
// ?pageNumber=&pageSize= (request-mapper GET_PRODUCT_REVIEW_LIST), response key
// `reviewList`. productGroup is accepted for call-site symmetry with
// getReviewStats; the live endpoint keys off the product id only. Verified live:
// /get/product/review/{product.id} returns real reviews (record id returns []).
// In-process cache for the LEANED review list. Next's fetch cache silently
// skips responses > 2MB, and the raw review endpoint can return ~34MB (each
// review embeds a full product) — so without this every render re-pulls the fat
// payload from Loom (~3-8s). We cache the small leaned result for PDP_REVALIDATE.
const reviewCache = new Map<string, { data: ProductReview[]; at: number }>();
const REVIEW_TTL_MS = PDP_REVALIDATE * 1000;

export async function getProductReviews(
  productId: number,
  _productGroup: string,
  pageSize = 6,
): Promise<ProductReview[]> {
  const cacheKey = `${productId}:${pageSize}`;
  const cached = reviewCache.get(cacheKey);
  if (cached && Date.now() - cached.at < REVIEW_TTL_MS) return cached.data;
  try {
    const res = await loomGet<{ success: boolean; reviewList: ProductReview[] }>(
      `/get/product/review/${productId}?pageNumber=0&pageSize=${pageSize}`,
      { revalidate: PDP_REVALIDATE },
    );
    // Lean each review to ONLY the fields ReviewsSection renders. The raw Loom
    // review embeds a FULL product object (0.6-6MB each) that, across the page's
    // reviews, was ~34MB of dead weight serialized into the RSC payload.
    const list: ProductReview[] = (res?.reviewList ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
      country: r.country,
      rating: r.rating,
      description: r.description,
      link: r.link,
      productImages: r.productImages,
      createdAt: r.createdAt,
    }));
    // newest first (live sorts by createdAt desc)
    const sorted = [...list].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    reviewCache.set(cacheKey, { data: sorted, at: Date.now() });
    return sorted;
  } catch {
    return [];
  }
}


// ---------------------------------------------------------------------------
// "Discover The Craft" content cards (fabric PDP). Returns the craft + cluster
// stories related to a product, mirroring live's fb-product-content-cards
// endpoint /get/story/related/product/{recordId}. Returns [] on any failure so
// the section simply hides (live also renders nothing when empty).
// ---------------------------------------------------------------------------
export async function getRelatedStories(recordId: number): Promise<StoryItem[]> {
  try {
    const res = await loomGet<{ storyContentList?: StoryItem[] }>(
      '/get/story/related/product/' + recordId,
      { revalidate: PDP_REVALIDATE },
    );
    return res?.storyContentList ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Per-request memoised product lookup. React cache() dedupes so the PDP page
// and its generateMetadata share ONE Loom fetch for the same (category, slug)
// within a single request — no double-fetch. (getProduct is already Next-fetch
// cached across requests; this collapses the intra-request pair.)
// ---------------------------------------------------------------------------
export const getCachedProduct = cache(getProduct);
