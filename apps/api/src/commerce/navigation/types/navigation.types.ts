// @ts-nocheck
export interface StoryContentPreview {
  id: number;
  title: string;
  slug: string;
  bannerImageDesktop?: string;
  bannerImageMobile?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface NavProductPreview {
  id: number;
  slug: string;
  heroImage: string;
  productGroup: string;
  name: string;
}

export interface NavigationMenu {
  contents: StoryContentPreview[];
  fabricProducts: NavProductPreview[];
  finishedProducts: NavProductPreview[];
}

export interface NavMenuCraftResult {
  segmentCategoryId: number;
  segmentCategoryName: string;
  subCategoryId: number;
  subCategoryName: string;
}

export interface NavMenuCraftOption {
  id: number;
  subCategoryName: string;
}

export interface NavMenuCraft {
  id: number;
  segmentCategoryName: string;
  optionList: NavMenuCraftOption[];
}

export interface NavMenuMaterialResult {
  materialId: number;
  materialName: string;
}

export interface NavMenuPatternResult {
  patternId: number;
  patternName: string;
}

export interface NavMenuColorResult {
  colorId: number;
  colorLabel: string;
  colorHexCode: string;
}

export interface NavMenuFinishedResult {
  segmentCategoryId: number;
  segmentCategoryName: string;
  subCategoryId: number;
  subCategoryName: string;
  subCategoryFeaturedImage: string;
}

export interface NavMenuFinishedOption {
  id: number;
  subCategoryName: string;
  subCategoryFeaturedImage: string;
}

export interface NavMenuFinished {
  id: number;
  segmentCategoryName: string;
  optionList: NavMenuFinishedOption[];
}

export interface NavMenuStoryResult {
  storyId: number;
  storyTitle: string;
  slug: string;
  bannerImage: string;
  storyCategoryId: number;
  storyCategoryName: string;
}

export interface NavMenuStoryOption {
  storyId: number;
  storyTitle: string;
  slug: string;
  bannerImage: string;
}

export interface NavMenuStory {
  storyCategoryId: number;
  storyCategoryName: string;
  optionList: NavMenuStoryOption[];
}
// @ts-nocheck
// @ts-nocheck
