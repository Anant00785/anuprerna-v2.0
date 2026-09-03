import {
  NavMenuCraftResult,
  NavMenuFinishedResult,
  NavMenuStoryResult,
} from "../types/navigation.types.js";

// The mapper simply acts as a typed boundary if needed.
// With Drizzle ORM, row mapping is often handled implicitly by Drizzle's selection typed objects.

export function mapToNavMenuCraftResult(row: any): NavMenuCraftResult {
  return {
    segmentCategoryId: Number(row.segmentCategoryId),
    segmentCategoryName: String(row.segmentCategoryName),
    subCategoryId: Number(row.subCategoryId),
    subCategoryName: String(row.subCategoryName),
  };
}

export function mapToNavMenuFinishedResult(row: any): NavMenuFinishedResult {
  return {
    segmentCategoryId: Number(row.segmentCategoryId),
    segmentCategoryName: String(row.segmentCategoryName),
    subCategoryId: Number(row.subCategoryId),
    subCategoryName: String(row.subCategoryName),
    subCategoryFeaturedImage: String(row.subCategoryFeaturedImage || ""),
  };
}

export function mapToNavMenuStoryResult(row: any): NavMenuStoryResult {
  return {
    storyId: Number(row.storyId),
    storyTitle: String(row.storyTitle),
    slug: String(row.slug),
    bannerImage: String(row.bannerImage || ""),
    storyCategoryId: Number(row.storyCategoryId),
    storyCategoryName: String(row.storyCategoryName),
  };
}
