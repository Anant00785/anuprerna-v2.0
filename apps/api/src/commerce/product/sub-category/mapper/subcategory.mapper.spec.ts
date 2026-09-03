import { describe, it, expect, vi } from "vitest";
import { toInsertValues, toUpdateValues, ResolvedCreateImages, ResolvedUpdateImages } from "./subcategory.mapper.js";
import { CreateSubCategoryInput, UpdateSubCategoryInput } from "../types/sub-category.types.js";

const images: ResolvedCreateImages = { icon: "icon.jpg", socialImage: "social.jpg", featuredImage: "featured.jpg" };

function baseCreateInput(overrides: Partial<CreateSubCategoryInput> = {}): CreateSubCategoryInput {
  return {
    segmentId: 1,
    name: "Silk Sarees",
    metaTitle: "Silk Meta",
    metaDescription: "Silk Desc",
    featured: true,
    badgeProfileId: 2,
    madeToOrderProfileId: 3,
    volumeDiscountProfileId: 4,
    customSizeProfileId: 5,
    sizeProfileId: 6,
    finishProfileId: 7,
    fabricProfileId: 8,
    ...overrides,
  } as CreateSubCategoryInput;
}

describe("subcategory.mapper toInsertValues", () => {
  it("maps every field, stamping timeOfCreation", () => {
    vi.useFakeTimers().setSystemTime(6000);
    const values = toInsertValues(baseCreateInput(), images);
    expect(values).toEqual({
      segmentId: 1,
      name: "Silk Sarees",
      icon: "icon.jpg",
      metaTitle: "Silk Meta",
      metaDescription: "Silk Desc",
      socialImage: "social.jpg",
      featured: true,
      featuredImage: "featured.jpg",
      timeOfCreation: 6000,
      badgeProfileId: 2,
      madeToOrderProfileId: 3,
      volumeDiscountProfileId: 4,
      customSizeProfileId: 5,
      sizeProfileId: 6,
      finishProfileId: 7,
      fabricProfileId: 8,
    });
    vi.useRealTimers();
  });

  it("leaves a profile id undefined (omitted from the write) when absent or 0 on create", () => {
    const values = toInsertValues(baseCreateInput({ badgeProfileId: 0, madeToOrderProfileId: undefined, volumeDiscountProfileId: null }), images);
    expect(values.badgeProfileId).toBeUndefined();
    expect(values.madeToOrderProfileId).toBeUndefined();
    expect(values.volumeDiscountProfileId).toBeUndefined();
  });

  it("defaults metaTitle/metaDescription/featured when absent", () => {
    const values = toInsertValues(baseCreateInput({ metaTitle: undefined, metaDescription: undefined, featured: undefined }), images);
    expect(values.metaTitle).toBe("");
    expect(values.metaDescription).toBe("");
    expect(values.featured).toBe(false);
  });
});

describe("subcategory.mapper toUpdateValues", () => {
  function baseUpdateInput(overrides: Partial<UpdateSubCategoryInput> = {}): UpdateSubCategoryInput {
    return {
      id: 1,
      segmentId: 1,
      name: "Silk Sarees",
      metaTitle: "Meta",
      metaDescription: "Desc",
      featured: true,
      ...overrides,
    } as UpdateSubCategoryInput;
  }

  it("always writes name/metaTitle/metaDescription/featured/segmentId", () => {
    const values = toUpdateValues(baseUpdateInput(), {});
    expect(values).toEqual({
      name: "Silk Sarees",
      metaTitle: "Meta",
      metaDescription: "Desc",
      featured: true,
      segmentId: 1,
    });
  });

  it("clears a profile id to null when present-and-0", () => {
    const values = toUpdateValues(baseUpdateInput({ badgeProfileId: 0 }), {});
    expect(values.badgeProfileId).toBeNull();
  });

  it("sets a profile id when present-and-nonzero", () => {
    const values = toUpdateValues(baseUpdateInput({ badgeProfileId: 9 }), {});
    expect(values.badgeProfileId).toBe(9);
  });

  it("omits a profile id from the update set entirely when absent (leaves existing value untouched)", () => {
    const values = toUpdateValues(baseUpdateInput({ badgeProfileId: undefined }), {});
    expect(values).not.toHaveProperty("badgeProfileId");
  });

  it("only includes image fields that were actually re-uploaded", () => {
    const resolved: ResolvedUpdateImages = { icon: "new-icon.jpg" };
    const values = toUpdateValues(baseUpdateInput(), resolved);
    expect(values.icon).toBe("new-icon.jpg");
    expect(values).not.toHaveProperty("socialImage");
    expect(values).not.toHaveProperty("featuredImage");
  });
});
