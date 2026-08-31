import 'server-only';
import { loomGet } from '@/lib/loom/client';

export interface SeoProduct {
  id: number;
  sku: string;
  name: string;
  heroImage: string;
  hoverImage: string;
  slug: string;
  productGroup: string;
  price: number;
  specialStatus: string;
  unit: string;
}

interface SearchResponse {
  searchResult?: {
    product?: {
      resultSet?: SeoProduct[];
    };
  };
  success?: boolean;
}

export async function searchProducts(keyword: string, limit = 12): Promise<SeoProduct[]> {
  try {
    const data = await loomGet<SearchResponse>(
      `/search/ai/${encodeURIComponent(keyword)}`,
      { revalidate: 3600 }
    );
    return (data.searchResult?.product?.resultSet ?? []).slice(0, limit);
  } catch {
    return [];
  }
}

export interface SeoBlogItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  readingTime: number;
  bannerImageDesktop: string;
  bannerImageMobile: string;
  timeOfCreation: number;
  blogContentCategory?: { id: number; name: string };
}

interface BlogListResponse {
  success?: boolean;
  blogContentList?: SeoBlogItem[];
}

export async function getLatestBlogs(limit = 4): Promise<SeoBlogItem[]> {
  try {
    const data = await loomGet<BlogListResponse>(
      '/get/blog-content-list/customer',
      { revalidate: 3600 }
    );
    return (data.blogContentList ?? []).slice(0, limit);
  } catch {
    return [];
  }
}

export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function slugToKeyword(slug: string): string {
  return slug.replace(/-/g, ' ');
}

/** For ads slugs like 'khadi-fabric-for-bulk-orders' -> take first 3-4 meaningful words */
export function adsSlugToKeyword(slug: string): string {
  const words = slug.replace(/-/g, ' ').split(' ');
  // Take up to 4 words
  return words.slice(0, 4).join(' ');
}
