import type { MetadataRoute } from 'next';
import {
  isSeoLive,
  absUrl,
  productPath,
  DISALLOWED_PRODUCT_PATH_SET,
} from '@/lib/seo/config';
import { getCachedFullCatalogue } from '@/components/catalogue/loom';
import { getStoryList, getBlogList } from '@/components/content-list/loom';

// force-dynamic: enumerate at REQUEST time so SEO_MODE flips dark<->live via a
// Vercel env var with no rebuild. In dark mode this returns [] immediately
// (no Loom calls). In live mode it pulls from the SAME cached data the pages use.
export const dynamic = 'force-dynamic';

type Entry = MetadataRoute.Sitemap[number];

// Static / PSEO landing routes this app publishes. (Dynamic b2b/<slug> and
// fabric-wholesaler/<city> PSEO combos are NOT enumerable from local data —
// their slug universe lives in an external keyword set — so only the parent
// landing routes are listed, per 'cities if enumerable'.)
const STATIC_PATHS: string[] = [
  '/',
  '/products/fabric',
  '/products/finished',
  '/products/finished?category=apparel',
  '/products/finished?category=home',
  '/products/finished?category=accessories',
  '/stories',
  '/blogs',
  '/artisanflow',
  '/wholesale-partner-program',
  '/fabric-wholesaler',
  '/contact',
  '/review',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // DARK (default): empty sitemap. Nothing about the demo is ever enumerated.
  if (!isSeoLive()) return [];

  const now = new Date();
  const entries: Entry[] = [];

  // --- Static / landing pages ------------------------------------------------
  for (const p of STATIC_PATHS) {
    entries.push({ url: absUrl(p), lastModified: now, changeFrequency: 'weekly' });
  }

  // --- Products (fabric + finished) -----------------------------------------
  // Each section is independently fault-tolerant: a Loom failure omits that
  // section rather than throwing the whole sitemap.
  for (const group of ['fabric', 'finished'] as const) {
    try {
      const { allProducts } = await getCachedFullCatalogue(group);
      for (const prod of allProducts) {
        if (!prod?.slug || !prod?.productGroup) continue;
        const path = productPath(prod.productGroup, prod.slug);
        if (DISALLOWED_PRODUCT_PATH_SET.has(path)) continue; // shared exclusion
        entries.push({
          url: absUrl(path),
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    } catch {
      /* omit this product group on any upstream failure */
    }
  }

  // --- Stories --------------------------------------------------------------
  try {
    const stories = await getStoryList();
    for (const s of stories) {
      if (!s?.slug || s?.id == null) continue;
      entries.push({
        url: absUrl('/story-details/' + s.slug + '/' + s.id),
        lastModified: s.lastUpdateTime ? new Date(s.lastUpdateTime) : now,
        changeFrequency: 'monthly',
      });
    }
  } catch {
    /* omit stories on failure */
  }

  // --- Blogs ----------------------------------------------------------------
  try {
    const blogs = await getBlogList();
    for (const b of blogs) {
      if (!b?.slug || b?.id == null) continue;
      entries.push({
        url: absUrl('/blogs/' + b.slug + '/' + b.id),
        lastModified: b.lastUpdateTime ? new Date(b.lastUpdateTime) : now,
        changeFrequency: 'monthly',
      });
    }
  } catch {
    /* omit blogs on failure */
  }

  // De-dupe by url (a product could appear via multiple facets).
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));
}
