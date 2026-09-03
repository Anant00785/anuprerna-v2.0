import { describe, it, expect } from "vitest";
import {
  mapToNavMenuCraftResult,
  mapToNavMenuFinishedResult,
  mapToNavMenuStoryResult,
} from "./navigation.mapper.js";

describe("mapToNavMenuCraftResult", () => {
  it("coerces ids to Number and names to String", () => {
    const out = mapToNavMenuCraftResult({
      segmentCategoryId: "1",
      segmentCategoryName: "Segment",
      subCategoryId: "2",
      subCategoryName: "Sub",
    });
    expect(out).toEqual({
      segmentCategoryId: 1,
      segmentCategoryName: "Segment",
      subCategoryId: 2,
      subCategoryName: "Sub",
    });
  });
});

describe("mapToNavMenuFinishedResult", () => {
  it("maps fields and defaults subCategoryFeaturedImage to empty string when absent", () => {
    const out = mapToNavMenuFinishedResult({
      segmentCategoryId: 1,
      segmentCategoryName: "Segment",
      subCategoryId: 2,
      subCategoryName: "Sub",
      subCategoryFeaturedImage: null,
    });
    expect(out.subCategoryFeaturedImage).toBe("");
  });

  it("passes through a provided image url", () => {
    const out = mapToNavMenuFinishedResult({
      segmentCategoryId: 1,
      segmentCategoryName: "Segment",
      subCategoryId: 2,
      subCategoryName: "Sub",
      subCategoryFeaturedImage: "img.jpg",
    });
    expect(out.subCategoryFeaturedImage).toBe("img.jpg");
  });
});

describe("mapToNavMenuStoryResult", () => {
  it("maps every field, defaulting bannerImage to empty string when absent", () => {
    const out = mapToNavMenuStoryResult({
      storyId: 5,
      storyTitle: "Title",
      slug: "slug",
      bannerImage: undefined,
      storyCategoryId: 9,
      storyCategoryName: "Cat",
    });
    expect(out).toEqual({
      storyId: 5,
      storyTitle: "Title",
      slug: "slug",
      bannerImage: "",
      storyCategoryId: 9,
      storyCategoryName: "Cat",
    });
  });
});
