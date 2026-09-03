/**
 * Content API — stories and blogs.
 *
 * Self-contained fetch helpers for story and blog CRUD screens.
 * Mirrors the request logic in catalog-api.ts but scoped to content endpoints.
 */

import {loomGetJson} from "@/lib/backend-fetch-error";
import type {
  StoryPreviewItem,
  StoryCategory,
  BlogPreviewItem,
  BlogTypeItem,
  BlogCategoryItem,
} from "@/types/content";


/** Single backend GET for this module. All failure handling — network,
 *  HTTP, and the `{success:false}` envelope — lives in loomGetJson. */
const contentGet = <T,>(path: string, token?: string): Promise<T> =>
  loomGetJson<T>("content-api", path, token);

/** Extract the first array-of-objects from a Loom response envelope. */
function extractFirstArray<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== "object") return [];
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "object") {
      return value as T[];
    }
  }
  return [];
}

async function fetchContentList<T>(path: string, token?: string): Promise<T[]> {
  const payload = await contentGet<unknown>(path, token);
  return extractFirstArray<T>(payload);
}

export const getStoryList = (token?: string) =>
  fetchContentList<StoryPreviewItem>("/get/story-content-list", token);

export const getStoryCategoryList = (token?: string) =>
  fetchContentList<StoryCategory>("/get/story-content-category-list", token);

export const getBlogList = (token?: string) =>
  fetchContentList<BlogPreviewItem>("/get/blog-content-list", token);

export const getBlogTypeList = (token?: string) =>
  fetchContentList<BlogTypeItem>("/get/blog-content-types", token);

export const getBlogCategoryList = (token?: string) =>
  fetchContentList<BlogCategoryItem>("/get/blog-content-category-list", token);

// ── Content detail (full record for edit drawers) ─────────────────────────

function detailStr(v: unknown): string { return v != null ? String(v) : ""; }
function detailNum(v: unknown): number | null {
  const n = Number(v);
  return v != null && v !== "" && !isNaN(n) && n > 0 ? n : null;
}

/**
 * Shared section shape for story and blog content sections.
 */
export interface ContentSectionData {
  /** Real backend section id when this row came from an existing saved
   * record; absent for a section that only exists in local draft state
   * (never yet POSTed to add/{story,blog}-content-section). */
  id?: number;
  sortOrder: number;
  templateType: number;
  heading: string;
  title1: string; title2: string;
  paragraph1: string; paragraph2: string;
  image1: string; image1Alt: string; image1Link: string; caption1: string;
  image2: string; image2Alt: string; image2Link: string; caption2: string;
  video1: string; video1Alt: string;
  video2: string; video2Alt: string;
  ctaButtonName1: string; ctaButtonName2: string;
  ctaLink1: string; ctaLink2: string;
}

export function normaliseContentSection(raw: Record<string, unknown>): ContentSectionData {
  const id = detailNum(raw.id);
  return {
    ...(id != null ? { id } : {}),
    sortOrder: Number(raw.sortOrder ?? 0),
    templateType: Number(raw.templateType ?? 0),
    heading: detailStr(raw.heading), title1: detailStr(raw.title1), title2: detailStr(raw.title2),
    paragraph1: detailStr(raw.paragraph1), paragraph2: detailStr(raw.paragraph2),
    image1: detailStr(raw.image1), image1Alt: detailStr(raw.image1Alt),
    image1Link: detailStr(raw.image1Link), caption1: detailStr(raw.caption1),
    image2: detailStr(raw.image2), image2Alt: detailStr(raw.image2Alt),
    image2Link: detailStr(raw.image2Link), caption2: detailStr(raw.caption2),
    video1: detailStr(raw.video1), video1Alt: detailStr(raw.video1Alt),
    video2: detailStr(raw.video2), video2Alt: detailStr(raw.video2Alt),
    ctaButtonName1: detailStr(raw.ctaButtonName1), ctaButtonName2: detailStr(raw.ctaButtonName2),
    ctaLink1: detailStr(raw.ctaLink1), ctaLink2: detailStr(raw.ctaLink2),
  };
}

function normaliseSections(raw: unknown): ContentSectionData[] {
  const list = (raw ?? []) as Record<string, unknown>[];
  return list.map(normaliseContentSection).sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── Section live-table merge ───────────────────────────────────────────────
// The parent story/blog blob's embedded {story,blog}ContentSectionList is a
// point-in-time snapshot (set at sync time, or omitted entirely for a
// sandbox-created row). Sections created/edited via add|update/{story,blog}-
// content-section write ONLY to the separate story_content_section /
// blog_content_section table (2130 blog rows + 374 story rows, fully synced
// from live — see backend content.repository.ts) and are NEVER re-embedded
// into the parent blob. Reading only the embedded list would silently hide
// every section added or edited after this build landed (read-after-write
// would break). Fetch the live section table (native, table-explorer) and
// filter by parent id client-side — there is no dedicated
// "sections-by-parent" endpoint, and none is needed at this admin-only scale.
async function fetchSectionsForParent(
  table: "blog-content-section" | "story-content-section",
  parentIdField: "blogContentId" | "storyContentId",
  parentId: number,
  token?: string,
): Promise<Record<string, unknown>[]> {
  const payload = await contentGet<unknown>(
    `/get/table-explorer/data/${table}?page=0&size=5000`,
    token,
  );
  const rows = extractFirstArray<Record<string, unknown>>(payload);
  return rows.filter((r) => Number(r[parentIdField]) === parentId);
}

// ── Story detail ───────────────────────────────────────────────────────────

/**
 * Full story record returned by /get/story-content/{id}.
 * The Loom envelope wraps it as { storyContent: { ... } }.
 */
export interface StoryDetail {
  id: number;
  title: string;
  description: string;
  storyContentCategoryId: number;
  slug: string;
  previousStoryId: number | null;
  nextStoryId: number | null;
  bannerImageDesktop: string;
  bannerImageDesktopAlt: string;
  bannerImageMobile: string;
  bannerImageMobileAlt: string;
  parallaxText: string;
  bannerImageParallax: string;
  bannerImageParallaxAlt: string;
  metaTitle: string;
  metaDescription: string;
  backwardCompatibleLink: string;
  sections: ContentSectionData[];
}

function normaliseStoryDetail(raw: Record<string, unknown>): StoryDetail {
  const cat = (raw.storyContentCategory ?? {}) as Record<string, unknown>;
  const prev = (raw.previousStoryDetails ?? {}) as Record<string, unknown>;
  const next = (raw.nextStoryDetails ?? {}) as Record<string, unknown>;
  return {
    id: Number(raw.id ?? 0),
    title: detailStr(raw.title),
    description: detailStr(raw.description),
    storyContentCategoryId: Number(raw.storyContentCategoryId ?? cat.id ?? 0),
    slug: detailStr(raw.slug),
    previousStoryId: detailNum(raw.previousStoryId) ?? detailNum(prev.id),
    nextStoryId: detailNum(raw.nextStoryId) ?? detailNum(next.id),
    bannerImageDesktop: detailStr(raw.bannerImageDesktop),
    bannerImageDesktopAlt: detailStr(raw.bannerImageDesktopAlt),
    bannerImageMobile: detailStr(raw.bannerImageMobile),
    bannerImageMobileAlt: detailStr(raw.bannerImageMobileAlt),
    parallaxText: detailStr(raw.parallaxText),
    bannerImageParallax: detailStr(raw.bannerImageParallax),
    bannerImageParallaxAlt: detailStr(raw.bannerImageParallaxAlt),
    metaTitle: detailStr(raw.metaTitle),
    metaDescription: detailStr(raw.metaDescription),
    backwardCompatibleLink: detailStr(raw.backwardCompatibleLink),
    sections: normaliseSections(raw.storyContentSectionList ?? raw.storyContentSectionDtoList),
  };
}

/** Fetch the full story detail by id (server-side — backend not browser-reachable). */
export async function getStoryById(id: number, token?: string): Promise<StoryDetail | null> {
  const raw = await contentGet<Record<string, unknown>>(
    "/get/story-content/" + id,
    token,
  );
  const detail = (raw.storyContent ?? raw) as Record<string, unknown>;
  if (!detail || !detail.id) return null;
  const parsed = normaliseStoryDetail(detail);
  // Prefer the live story_content_section table over the embedded snapshot
  // whenever it has rows for this story (see fetchSectionsForParent above).
  const liveSections = await fetchSectionsForParent(
    "story-content-section",
    "storyContentId",
    parsed.id,
    token,
  );
  if (liveSections.length > 0) {
    parsed.sections = liveSections
      .map(normaliseContentSection)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return parsed;
}

// ── Blog detail ────────────────────────────────────────────────────────────

/**
 * Full blog record returned by /get/blog-content/{id}.
 * The Loom envelope wraps it as { blogContent: { ... } }.
 */
export interface BlogDetail {
  id: number;
  title: string;
  description: string;
  blogContentCategoryId: number;
  slug: string;
  previousBlogId: number | null;
  nextBlogId: number | null;
  bannerImageDesktop: string;
  bannerImageDesktopAlt: string;
  bannerImageMobile: string;
  bannerImageMobileAlt: string;
  parallaxText: string;
  bannerImageParallax: string;
  bannerImageParallaxAlt: string;
  metaTitle: string;
  metaDescription: string;
  backwardCompatibleLink: string;
  sections: ContentSectionData[];
}

function normaliseBlogDetail(raw: Record<string, unknown>): BlogDetail {
  const cat = (raw.blogContentCategory ?? {}) as Record<string, unknown>;
  const prev = (raw.previousBlogDetails ?? {}) as Record<string, unknown>;
  const next = (raw.nextBlogDetails ?? {}) as Record<string, unknown>;
  return {
    id: Number(raw.id ?? 0),
    title: detailStr(raw.title),
    description: detailStr(raw.description),
    blogContentCategoryId: Number(raw.blogContentCategoryId ?? cat.id ?? 0),
    slug: detailStr(raw.slug),
    previousBlogId: detailNum(raw.previousBlog) ?? detailNum(raw.previousBlogId) ?? detailNum(prev.id),
    nextBlogId: detailNum(raw.nextBlog) ?? detailNum(raw.nextBlogId) ?? detailNum(next.id),
    bannerImageDesktop: detailStr(raw.bannerImageDesktop),
    bannerImageDesktopAlt: detailStr(raw.bannerImageDesktopAlt),
    bannerImageMobile: detailStr(raw.bannerImageMobile),
    bannerImageMobileAlt: detailStr(raw.bannerImageMobileAlt),
    parallaxText: detailStr(raw.parallaxText),
    bannerImageParallax: detailStr(raw.bannerImageParallax),
    bannerImageParallaxAlt: detailStr(raw.bannerImageParallaxAlt),
    metaTitle: detailStr(raw.metaTitle),
    metaDescription: detailStr(raw.metaDescription),
    backwardCompatibleLink: detailStr(raw.backwardCompatibleLink),
    sections: normaliseSections(raw.blogContentSectionList ?? raw.blogContentSectionDtoList),
  };
}

/** Fetch the full blog detail by id (server-side — backend not browser-reachable). */
export async function getBlogById(id: number, token?: string): Promise<BlogDetail | null> {
  const raw = await contentGet<Record<string, unknown>>(
    "/get/blog-content/" + id,
    token,
  );
  const detail = (raw.blogContent ?? raw) as Record<string, unknown>;
  if (!detail || !detail.id) return null;
  const parsed = normaliseBlogDetail(detail);
  // Prefer the live blog_content_section table over the embedded snapshot
  // whenever it has rows for this blog (see fetchSectionsForParent above).
  const liveSections = await fetchSectionsForParent(
    "blog-content-section",
    "blogContentId",
    parsed.id,
    token,
  );
  if (liveSections.length > 0) {
    parsed.sections = liveSections
      .map(normaliseContentSection)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return parsed;
}

// ── FAQ types ──────────────────────────────────────────────────────────────
// Source: live-weave-ref/src/app/manage-faq/interface/faq-item.ts
//         live-weave-ref/src/app/manage-faq/manage-faq-question/interface/faq-question-item.ts
//         live-weave-ref/src/app/raintree/interface/faq-payload.ts (FaqPayload.faqList)

export interface FaqQuestionItem {
  id: number;
  question: string;
  answer: string;
  version: number;
  timeOfCreation: number;
}

export interface FaqItem {
  id: number;
  heading: string;
  version: number;
  timeOfCreation: number;
  /** Linked story content id — null when not linked to a story */
  storyContentId: number | null;
  /** Linked blog content id — null when not linked to a blog */
  blogContentId: number | null;
  deleted?: boolean;
  faqQuestionList: FaqQuestionItem[];
}

/** Fetch all FAQs (backend envelope: { faqList: FaqItem[] }). */
export const getFaqList = (token?: string) =>
  fetchContentList<FaqItem>("/get/faqs", token);

function normaliseFaqQuestion(raw: Record<string, unknown>): FaqQuestionItem {
  return {
    id: Number(raw.id ?? 0),
    question: detailStr(raw.question),
    answer: detailStr(raw.answer),
    version: Number(raw.version ?? 0),
    timeOfCreation: Number(raw.timeOfCreation ?? 0),
  };
}

function normaliseFaqItem(raw: Record<string, unknown>): FaqItem {
  return {
    id: Number(raw.id ?? 0),
    heading: detailStr(raw.heading),
    version: Number(raw.version ?? 0),
    timeOfCreation: Number(raw.timeOfCreation ?? 0),
    storyContentId: raw.storyContentId != null ? Number(raw.storyContentId) : null,
    blogContentId: raw.blogContentId != null ? Number(raw.blogContentId) : null,
    deleted: Boolean(raw.deleted ?? false),
    faqQuestionList: ((raw.faqQuestionList ?? []) as Record<string, unknown>[]).map(
      normaliseFaqQuestion,
    ),
  };
}

/**
 * Fetch a single FAQ by id.
 * Backend envelope: { faq: FaqItem }
 */
export async function getFaqById(id: number, token?: string): Promise<FaqItem | null> {
  const raw = await contentGet<Record<string, unknown>>("/get/faq/" + id, token);
  const detail = (raw.faq ?? raw) as Record<string, unknown>;
  if (!detail || !detail.id) return null;
  return normaliseFaqItem(detail);
}
