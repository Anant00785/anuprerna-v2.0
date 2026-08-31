import 'server-only';
import { loomGet } from '@/lib/loom/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoryCategory {
  id: number;
  name: string;
  storyContentType: string; // 'CRAFTS' | 'CLUSTERS' | 'COLLABORATIONS'
}

export interface StoryItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  readingTime: number;
  bannerImageDesktop: string;
  bannerImageMobile: string;
  timeOfCreation: number;
  lastUpdateTime: number;
  storyContentCategory: StoryCategory;
  version: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  blogContentType?: { name: string; id: number };
}

export interface BlogItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  readingTime: number;
  bannerImageDesktop: string;
  bannerImageMobile: string;
  timeOfCreation: number;
  lastUpdateTime: number;
  blogContentCategory: BlogCategory;
  version: number;
}

export interface SearchProduct {
  id: number;
  sku: string;
  name: string;
  heroImage: string;
  hoverImage: string;
  heroImageAltText: string;
  slug: string;
  productGroup: string;
  price: number;
  specialStatus: string;
  unit: string;
}

export interface SearchResults {
  products: SearchProduct[];
  stories: StoryItem[];
  blogs: BlogItem[];
}

// ---------------------------------------------------------------------------
// Fetchers — all server-side only
// ---------------------------------------------------------------------------

const REVALIDATE = 300; // 5 min cache for listing pages

export async function getStoryList(): Promise<StoryItem[]> {
  try {
    const res = await loomGet<{ storyContentList?: StoryItem[] }>(
      '/get/story-content-list',
      { revalidate: REVALIDATE },
    );
    return res?.storyContentList ?? [];
  } catch {
    return [];
  }
}

export async function getBlogList(): Promise<BlogItem[]> {
  try {
    const res = await loomGet<{ success?: boolean; blogContentList?: BlogItem[] }>(
      '/get/blog-content-list/customer',
      { revalidate: REVALIDATE },
    );
    return res?.blogContentList ?? [];
  } catch {
    return [];
  }
}

export async function getSearchResults(term: string): Promise<SearchResults> {
  if (!term.trim()) return { products: [], stories: [], blogs: [] };
  const encoded = encodeURIComponent(term.trim());
  const [productRes, storyRes, blogRes] = await Promise.allSettled([
    loomGet<{ searchResult?: { product?: { resultSet?: SearchProduct[] } } }>(
      '/search/ai/' + encoded + '?limit=50',
    ),
    loomGet<{ storyContentList?: StoryItem[] }>(
      '/search/ai/story/' + encoded + '?limit=3',
    ),
    loomGet<{ success?: boolean; blogContentList?: BlogItem[] }>(
      '/search/ai/blog/' + encoded + '?limit=3',
    ),
  ]);

  const products =
    productRes.status === 'fulfilled'
      ? (productRes.value?.searchResult?.product?.resultSet ?? [])
      : [];
  const stories =
    storyRes.status === 'fulfilled'
      ? (storyRes.value?.storyContentList ?? [])
      : [];
  const blogs =
    blogRes.status === 'fulfilled'
      ? (blogRes.value?.blogContentList ?? [])
      : [];

  return { products, stories, blogs };
}

// ---------------------------------------------------------------------------
// Catalogue term list — for client-side autocomplete + 'did you mean'.
// Pulled from the SAME fabric nav endpoints the mega-menu uses (craft option
// names + material/pattern/color labels), deduped. Server-side + cached so the
// client never touches Loom directly. Fault-tolerant: any failed segment is
// skipped, never throws.
// ---------------------------------------------------------------------------
export async function getCatalogueTerms(): Promise<string[]> {
  const { getNavFabric } = await import('@/lib/loom/endpoints');
  const [craft, material, pattern, color] = await Promise.allSettled([
    getNavFabric('craft'),
    getNavFabric('material'),
    getNavFabric('pattern'),
    getNavFabric('color'),
  ]);

  const terms = new Set<string>();
  const add = (s?: string) => {
    const t = (s || '').trim();
    if (t && t.length >= 3) terms.add(t);
  };

  if (craft.status === 'fulfilled') {
    for (const seg of craft.value.craft ?? []) {
      add(seg.segmentCategoryName);
      for (const o of seg.optionList ?? []) add(o.subCategoryName);
    }
  }
  if (material.status === 'fulfilled') {
    for (const m of material.value.material ?? []) add(m.materialName);
  }
  if (pattern.status === 'fulfilled') {
    for (const p of pattern.value.pattern ?? []) add(p.patternName);
  }
  if (color.status === 'fulfilled') {
    for (const c of color.value.color ?? []) add(c.colorLabel);
  }

  // Title-case for display (nav labels are a mix of UPPER and Mixed case).
  const titleCase = (s: string) =>
    s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return [...terms].map(titleCase).sort();
}
