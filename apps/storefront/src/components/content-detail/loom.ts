import 'server-only';
import { loomGet } from '@/lib/loom/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentSection {
  id: number;
  sortOrder: number;
  templateType: number; // 1=img-left, 2=img-right, 8=text-only, 9=img-only
  heading: string;
  paragraph1: string; // HTML
  paragraph2: string; // HTML
  image1: string;
  image1Alt: string;
  image2: string;
  image2Alt: string;
  image1Link: string;
  image2Link: string;
  caption1: string;
  caption2: string;
  ctaButtonName1: string;
  ctaLink1: string;
  ctaButtonName2: string;
  ctaLink2: string;
  video1: string;
  video2: string;
  topMotif: string;
  bottomMotif: string;
}

export interface FaqQuestion {
  id: number;
  question: string;
  answer: string;
}

export interface Faq {
  heading: string;
  faqQuestionList: FaqQuestion[];
}

export interface ContentAuthor {
  name: string;
}

export interface RelatedContentItem {
  id: number;
  slug: string;
  title: string;
  bannerImageDesktop: string;
}

// Full preview card returned by the /recommended endpoints (mirrors live ContentPreview)
export interface ContentPreview {
  id: number;
  slug: string;
  title: string;
  description: string;
  bannerImageDesktop: string;
  bannerImageMobile: string;
  readingTime: number;
  timeOfCreation: number;
  lastUpdateTime: number;
  blogContentCategory?: { name: string };
  storyContentCategory?: { name: string };
}

export interface StoryCategory {
  name: string;
  storyContentType: string;
}

export interface BlogCategory {
  name: string;
}

export interface StoryDetail {
  id: number;
  slug: string;
  title: string;
  description: string; // HTML
  readingTime: number;
  bannerImageDesktop: string;
  bannerImageMobile: string;
  bannerImageParallax: string;
  bannerImageAlt: string;
  bannerImageParallaxAlt: string;
  parallaxText: string;
  metaTitle: string;
  metaDescription: string;
  timeOfCreation: number;
  lastUpdateTime: number;
  previousStory: number;
  previousStoryDetails: RelatedContentItem | null;
  nextStory: number;
  nextStoryDetails?: RelatedContentItem | null;
  author: ContentAuthor;
  faq: Faq | null;
  storyContentSectionList: ContentSection[];
  storyContentCategory: StoryCategory;
}

export interface BlogDetail {
  id: number;
  slug: string;
  title: string;
  description: string; // HTML
  readingTime: number;
  bannerImageDesktop: string;
  bannerImageMobile: string;
  bannerImageAlt: string;
  timeOfCreation: number;
  lastUpdateTime: number;
  previousBlog: number;
  previousBlogDetails: RelatedContentItem | null;
  nextBlog: number;
  nextBlogDetails?: RelatedContentItem | null;
  author: ContentAuthor;
  faq: Faq | null;
  blogContentSectionList: ContentSection[];
  blogContentCategory: BlogCategory;
}

export interface StoryProduct {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  hero_image: string;
  hover_image: string;
  slug: string;
  unit: string;
  quantity: number;
  product_group: string;
  segment_category: string;
  sub_category: string;
  special_status: string;
}

export interface StoryProductPreviewsResult {
  storyContentId: number;
  fabricProductList: StoryProduct[];
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

const REVALIDATE = 600; // 10 min cache

export async function getStoryDetail(id: string | number): Promise<StoryDetail | null> {
  try {
    const res = await loomGet<{ success: boolean; storyContent: StoryDetail }>(
      '/get/story-content/' + id,
      { revalidate: REVALIDATE },
    );
    return res?.storyContent ?? null;
  } catch {
    return null;
  }
}

// Resolve a story by its SLUG (the stable key in the URL). The numeric id segment in
// live URLs (e.g. /story-details/tussar-silk/79286) is a LEGACY id the API no longer
// resolves — slug is authoritative. Returns the full story incl. its current id.
export async function getStoryDetailBySlug(slug: string): Promise<StoryDetail | null> {
  try {
    const res = await loomGet<{ success: boolean; storyContent: StoryDetail }>(
      '/get/story-content/slug/' + encodeURIComponent(slug),
      { revalidate: REVALIDATE },
    );
    return res?.storyContent ?? null;
  } catch {
    return null;
  }
}

// Some URLs in the /story-details/ family are actually BLOG content (the live sitemap
// mixes them). Fetch a blog by slug and normalise it into the StoryDetail shape so the
// /story-details page can render it without a redirect (parity: must serve 200).
export async function getStoryOrBlogBySlug(slug: string): Promise<StoryDetail | null> {
  const story = await getStoryDetailBySlug(slug);
  if (story) return story;
  try {
    const res = await loomGet<{ success: boolean; blogContent: Record<string, unknown> }>(
      '/get/blog-content/slug/' + encodeURIComponent(slug),
      { revalidate: REVALIDATE },
    );
    const b = res?.blogContent as Record<string, unknown> | undefined;
    if (!b) return null;
    return {
      ...(b as object),
      storyContentCategory: b['blogContentCategory'],
      storyContentSectionList: b['blogContentSectionList'] ?? [],
      previousStoryDetails: b['previousBlogDetails'] ?? null,
      nextStoryDetails: b['nextBlogDetails'] ?? null,
    } as unknown as StoryDetail;
  } catch {
    return null;
  }
}

export async function getBlogDetail(id: string | number): Promise<BlogDetail | null> {
  try {
    const res = await loomGet<{ success: boolean; blogContent: BlogDetail }>(
      '/get/blog-content/' + id,
      { revalidate: REVALIDATE },
    );
    return res?.blogContent ?? null;
  } catch {
    return null;
  }
}

export async function getBlogDetailBySlug(slug: string): Promise<BlogDetail | null> {
  try {
    const res = await loomGet<{ success: boolean; blogContent: BlogDetail }>(
      '/get/blog-content/slug/' + encodeURIComponent(slug),
      { revalidate: REVALIDATE },
    );
    return res?.blogContent ?? null;
  } catch {
    return null;
  }
}

export async function getStoryProductPreviews(id: string | number): Promise<StoryProduct[]> {
  try {
    const res = await loomGet<{ success: boolean; storyProductMapping: StoryProductPreviewsResult }>(
      '/get/story/product-previews/' + id,
      { revalidate: REVALIDATE },
    );
    return res?.storyProductMapping?.fabricProductList ?? [];
  } catch {
    return [];
  }
}

export async function getStoryRecommendedList(id: string | number): Promise<ContentPreview[]> {
  try {
    const res = await loomGet<{ storyContentList?: ContentPreview[] }>(
      '/get/stories/' + id + '/recommended',
      { revalidate: REVALIDATE },
    );
    return res?.storyContentList ?? [];
  } catch {
    return [];
  }
}

export async function getBlogRecommendedList(id: string | number): Promise<ContentPreview[]> {
  try {
    const res = await loomGet<{ blogContentList?: ContentPreview[] }>(
      '/get/blogs/' + id + '/recommended',
      { revalidate: REVALIDATE },
    );
    return res?.blogContentList ?? [];
  } catch {
    return [];
  }
}
