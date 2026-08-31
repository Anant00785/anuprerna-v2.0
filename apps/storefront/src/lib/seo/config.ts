// ===========================================================================
// SEO config — the SINGLE switch + shared helpers for the "SEO built DARK"
// layer. Everything SEO-facing keys off this file.
//
// DARK (default: SEO_MODE unset or anything != 'live')
//   - global robots: noindex,nofollow
//   - /robots.txt  = disallow-all, no sitemap ref
//   - /sitemap.xml = empty
// LIVE (SEO_MODE=live)
//   - global robots: index,follow
//   - real robots.txt rules + sitemap ref
//   - populated sitemap, canonical/OG/JSON-LD active
//
// CRITICAL: read env at RUNTIME (never bake into a module-init const) so ONE
// Vercel build can flip via the SEO_MODE env var without a rebuild for the
// dynamically-rendered surfaces (robots, sitemap, on-demand PDP/content SSR).
//
// ALL canonical / OG / sitemap / JSON-LD urls resolve against SITE_URL
// (default https://anuprerna.com) — NEVER the vercel.app demo host, even in
// dark mode, so nothing ever legitimizes the demo domain.
// ===========================================================================

/** True only when SEO_MODE is exactly 'live'. Read per-call (runtime). */
export function isSeoLive(): boolean {
  return process.env.SEO_MODE === 'live';
}

/** Canonical site origin (no trailing slash). Never the vercel.app host. */
export function siteUrl(): string {
  const raw = process.env.SITE_URL || 'https://anuprerna.com';
  return raw.replace(/\/+$/, '');
}

/** Absolute URL anchored to SITE_URL for a site-relative path. */
export function absUrl(path: string): string {
  const p = path.startsWith('/') ? path : '/' + path;
  return siteUrl() + p;
}

/** Robots metadata object for a page: flips index/noindex on the switch. */
export function robotsMeta(): { index: boolean; follow: boolean } {
  return isSeoLive() ? { index: true, follow: true } : { index: false, follow: false };
}

/** PDP url shape (matches the app's ProductCard / live URL): /product/<group>-product/<slug>. */
export function productPath(productGroup: string, slug: string): string {
  return '/product/' + productGroup + '-product/' + slug;
}

// ---------------------------------------------------------------------------
// Private payment-link / internal product URLs disallowed on the LIVE site.
// Ported VERBATIM from https://www.anuprerna.com/robots.txt. SHARED by
// robots.ts (emit as Disallow) and sitemap.ts (exclude from url set). Deduped.
// ---------------------------------------------------------------------------
export const DISALLOWED_PRODUCT_PATHS: string[] = [
  '/product/fabric-product/sheetal-final-sample-link',
  '/product/fabric-product/kaftan-production-link',
  '/product/fabric-product/geometric-cream-jamdani',
  '/product/fabric-product/poulami-custom-link',
  '/product/fabric-product/naushad-2nd-sample-payment-link',
  '/product/fabric-product/batting-custom-link',
  '/product/fabric-product/fabric-custom-link',
  '/product/fabric-product/jaimie-custom-link',
  '/product/fabric-product/subha-labels-custom-link',
  '/product/fabric-product/mary-custom-link',
  '/product/fabric-product/bella-2nd-production-link',
  '/product/fabric-product/swathi-production-link',
  '/product/fabric-product/dear-abigeal-custom-link',
  '/product/fabric-product/sunni-custom-link',
  '/product/fabric-product/catherine-vegetable-dye',
  '/product/fabric-product/parvathy-custom-link',
  '/product/fabric-product/susana-custom-link',
  '/product/fabric-product/lindsay-labels-custom-link',
  '/product/fabric-product/eitan-custom-link',
  '/product/fabric-product/baby-book-custom-link',
  '/product/fabric-product/swathi-custom-link',
  '/product/fabric-product/sheetal-3rd-sample-custom-link',
  '/product/fabric-product/rosie-custom-link',
  '/product/fabric-product/danielle-custom-link',
  '/product/fabric-product/claire-sample-link',
  '/product/fabric-product/redwan-sample-link',
  '/product/fabric-product/sukhjeet-2nd-sample-costing',
  '/product/fabric-product/supreet-3rd-sample-costing',
  '/product/fabric-product/kingy-production-custom-link',
  '/product/fabric-product/rubina-custom-link',
  '/product/fabric-product/kitty-production-custom-link',
  '/product/fabric-product/abigeal-production-link',
  '/product/fabric-product/martin-custom-link',
  '/product/fabric-product/rosh-production-link',
  '/product/fabric-product/nikita-sample-link',
  '/product/fabric-product/custom-matka-fabric',
  '/product/fabric-product/masion-kameej-sample-link',
  '/product/fabric-product/sheetal-2nd-sample-custom-link',
  '/product/fabric-product/jaanki-sample-custom-link',
  '/product/fabric-product/domica-2nd-production-custom-link',
  '/product/fabric-product/samiksha-sample-custom-link',
  '/product/fabric-product/rosh-sample-custom-link',
  '/product/fabric-product/sukh-custom-link',
  '/product/fabric-product/amna-custom-link',
  '/product/fabric-product/eisha-custom-link',
  '/product/fabric-product/domica-production-custom-link',
  '/product/fabric-product/custom-fabric-zarisilk',
  '/product/fabric-product/rosh-custom-link',
  '/product/fabric-product/lindsay-production-custom-link',
  '/product/fabric-product/domica-4th-sample-custom-link',
  '/product/fabric-product/cotton-batting',
  '/product/fabric-product/supreet-2nd-sample-custom-link',
  '/product/fabric-product/naushad-embroidery-custom-link',
  '/product/fabric-product/neha-2nd-sample-custom-link',
  '/product/fabric-product/abstract-pattern-custom-fabric',
  '/product/fabric-product/custom-fabric-jack',
  '/product/fabric-product/bella-production-custom-link',
  '/product/fabric-product/kingy-3rd-sample-custom-link',
  '/product/fabric-product/domica-3rd-sample-custom-link',
  '/product/fabric-product/sheetal-custom-link',
  '/product/fabric-product/geena-2nd-sample-custom-link',
  '/product/fabric-product/herringbone-custom-fabric',
  '/product/fabric-product/rebecca-2nd-custom-link',
  '/product/fabric-product/rebecca-sample-custom-link',
  '/product/fabric-product/lindsay-custom-link',
  '/product/fabric-product/neha-custom-link',
  '/product/fabric-product/supreet-custom-link',
  '/product/fabric-product/kitty-order-custom-link',
  '/product/fabric-product/bella-2nd-sample-custom-link',
  '/product/fabric-product/olivia-payment-link',
  '/product/fabric-product/custom-link-for-claire-garments-production',
  '/product/fabric-product/custom-link-for-kingy',
  '/product/fabric-product/domica-2nd-sample-link',
  '/product/fabric-product/nicole-custom-link',
  '/product/fabric-product/custom-fabric-meghan',
  '/product/fabric-product/kiarra-custom-link',
  '/product/fabric-product/rebecca-production-custom-link',
  '/product/fabric-product/sabrina-1-custom-link',
  '/product/fabric-product/gaia-custom-link',
  '/product/fabric-product/catherine-custom-link',
  '/product/fabric-product/test-order-2',
  '/product/fabric-product/long-dress',
  '/product/fabric-product/stripe-gathered-dress',
  '/product/fabric-product/digital-print-shirt',
  '/product/fabric-product/sultan-custom-link',
  '/product/fabric-product/ziva-custom-fabric',
  '/product/fabric-product/maison-kameej-custom-link',
  '/product/fabric-product/geema-custom-link',
  '/product/fabric-product/domica-custom-link',
  '/product/fabric-product/kai-custom-sample',
  '/product/fabric-product/sabrina-custom-link',
  '/product/fabric-product/custom-embroidery-shirt',
  '/product/fabric-product/custom-test-fabric',
  '/product/fabric-product/custom-product-maria',
  '/product/fabric-product/custom-product-claire-1',
  '/product/fabric-product/test-order',
  '/product/fabric-product/custom-product-jesse',
  '/product/fabric-product/custom-product-bella',
  '/product/fabric-product/custom-product-kai',
  '/product/fabric-product/custom-product-sourav-jadav',
  '/product/fabric-product/custom-product-claire',
  '/product/fabric-product/custom-dyed-fabric',
  '/product/fabric-product/custom-fabric',
  '/product/fabric-product/rebecca-custom-product',
  '/product/fabric-product/kitty-custom-product',
  '/product/fabric-product/loren-custom-product',
  '/product/fabric-product/inayah-custom-product',
  '/product/fabric-product/test-product',
  '/product/fabric-product/kingy-custom-product',
  '/product/fabric-product/claire-custom-product-1',
  '/product/fabric-product/claire-custom',
  '/product/fabric-product/custom-product',
  '/product/fabric-product/kai-custom-1',
  '/product/fabric-product/anjali-custom',
  '/product/fabric-product/sultan-custom',
  '/product/fabric-product/kai-custom',
  '/product/fabric-product/kitty-custom',
  '/product/fabric-product/custom-long-dress',
  '/product/fabric-product/custom-fabric-product',
  '/product/fabric-product/abigael-custom-apparel',
  '/product/fabric-product/custom-apparel-01',
  '/product/fabric-product/custom-cushion-cover',
  '/product/fabric-product/mulberry-silk-54-gsm-35-inch-width',
  '/product/fabric-product/custom-product-1',
  '/product/fabric-product/desyjune2024shipment',
  '/product/fabric-product/kiranjune2024shipment',
  '/product/fabric-product/katejune2024shipment',
  '/product/fabric-product/clair-s-mayshipment',
  '/product/fabric-product/padded-jacket',
];

/** Deduped set of the disallowed PDP paths, for O(1) sitemap exclusion. */
export const DISALLOWED_PRODUCT_PATH_SET: Set<string> = new Set(DISALLOWED_PRODUCT_PATHS);

// ---------------------------------------------------------------------------
// Legacy / non-canonical + private-utility path prefixes disallowed on LIVE.
// Ported from production robots.txt, MINUS any prefix that collides with a
// canonical route THIS app actually publishes in its sitemap. Notably:
//   - production disallows /story-details/ and /blog/ (its legacy patterns),
//     but THIS demo's canonical story route IS /story-details/<slug>/<id> and
//     canonical blog route IS /blogs/<slug>/<id>. So /story-details/ is NOT
//     disallowed here (it is sitemap'd); /blog/ (singular, non-canonical) IS.
// Plus this app's own auth/account/checkout/api utility areas.
// ---------------------------------------------------------------------------
export const DISALLOWED_PREFIXES: string[] = [
  // ported legacy patterns that do NOT match a sitemap'd route here
  '/Fabrics/',
  '/Scarves/',
  '/crafts/',
  '/productsservices/',
  '/SwatchKit/',
  '/blog-details/',
  '/blog/',
  // app-private / utility (never index)
  '/auth/',
  '/profile',
  '/checkout',
  '/wishlist',
  '/filter',
  '/api/',
];

// ---------------------------------------------------------------------------
// Meta-description helpers — strip HTML from Loom copy (product overview, blog
// / story body) and truncate to ~155 chars on a word boundary. Shared by PDP,
// blog, and story generateMetadata.
// ---------------------------------------------------------------------------
export function stripHtml(html: string | undefined | null): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(s: string | undefined | null, n = 155): string {
  const t = (s || '').trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).replace(/\s+\S*$/, '').trim() + '…';
}

export function metaDescription(html: string | undefined | null, n = 155): string {
  return truncate(stripHtml(html), n);
}
