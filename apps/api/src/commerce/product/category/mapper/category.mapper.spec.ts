import { describe, it, expect, vi } from "vitest";
import { toInsertValues, toUpdateValues } from "./category.mapper.js";
import { CategoryInput } from "../types/category.types.js";

function baseInput(overrides: Partial<CategoryInput> = {}): CategoryInput {
  return {
    name: "Sarees",
    metaTitle: "Sarees Meta",
    metaDescription: "Sarees Desc",
    ...overrides,
  } as CategoryInput;
}

describe("category.mapper toInsertValues", () => {
  it("maps name/metaTitle/metaDescription and the resolved image urls, stamping timeOfCreation", () => {
    vi.useFakeTimers().setSystemTime(1000);
    const values = toInsertValues(baseInput(), "icon.jpg", "social.jpg");
    expect(values).toEqual({
      name: "Sarees",
      icon: "icon.jpg",
      metaTitle: "Sarees Meta",
      metaDescription: "Sarees Desc",
      socialImage: "social.jpg",
      timeOfCreation: 1000,
    });
    vi.useRealTimers();
  });

  it("defaults metaTitle/metaDescription to empty string when absent", () => {
    const values = toInsertValues(baseInput({ metaTitle: undefined, metaDescription: undefined }), "icon.jpg", "social.jpg");
    expect(values.metaTitle).toBe("");
    expect(values.metaDescription).toBe("");
  });
});

describe("category.mapper toUpdateValues", () => {
  it("always writes name/metaTitle/metaDescription and omits icon/socialImage when not passed", () => {
    const values = toUpdateValues(baseInput());
    expect(values).toEqual({
      name: "Sarees",
      metaTitle: "Sarees Meta",
      metaDescription: "Sarees Desc",
    });
    expect(values).not.toHaveProperty("icon");
    expect(values).not.toHaveProperty("socialImage");
  });

  it("includes icon/socialImage only when a replacement was uploaded", () => {
    const values = toUpdateValues(baseInput(), "new-icon.jpg", "new-social.jpg");
    expect(values.icon).toBe("new-icon.jpg");
    expect(values.socialImage).toBe("new-social.jpg");
  });
});
