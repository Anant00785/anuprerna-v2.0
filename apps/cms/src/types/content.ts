/**
 * Content types — stories and blogs.
 * Mirrors Loom entity shapes returned by story-content-* and blog-content-* endpoints.
 */

export interface StoryPreviewItem {
  id: number;
  storyContentCategoryId: number;
  title: string;
  description: string;
  readingTime: number;
  slug: string;
  timeOfCreation: number;
  bannerImageMobile: string;
  bannerImageDesktop: string;
  storyContentCategory?: { id: number; name: string; storyContentType: string };
}

export interface StoryCategory {
  id: number;
  name: string;
  storyContentType: string;
  timeOfCreation: number;
}

export interface BlogPreviewItem {
  id: number;
  blogContentCategoryId: number;
  title: string;
  description: string;
  readingTime: number;
  slug: string;
  timeOfCreation: number;
  bannerImageMobile: string;
  bannerImageDesktop: string;
  blogContentCategory?: { id: number; name: string };
}

export interface BlogTypeItem {
  id: number;
  name: string;
  timeOfCreation: number;
  /** Note: intentional typo preserved from Loom API */
  blogContentCatogoryList?: BlogCategoryItem[];
}

export interface BlogCategoryItem {
  id: number;
  name: string;
  timeOfCreation: number;
  blogContentType?: BlogTypeItem;
}

export interface ContentSectionDraft {
  /** Real backend blog_content_section/story_content_section id once saved; undefined/0 = local-only draft not yet persisted. */
  id?: number;
  sortOrder: number;
  templateType: number;
  heading: string;
  title1: string;
  title2: string;
  paragraph1: string;
  paragraph2: string;
  image1: string;
  image1Alt: string;
  image1Link: string;
  caption1: string;
  image2: string;
  image2Alt: string;
  image2Link: string;
  caption2: string;
  video1: string;
  video1Alt: string;
  video2: string;
  video2Alt: string;
  ctaButtonName1: string;
  ctaButtonName2: string;
  ctaLink1: string;
  ctaLink2: string;
}
