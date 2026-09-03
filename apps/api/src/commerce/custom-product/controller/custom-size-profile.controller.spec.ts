/**
 * Envelope tests for CustomSizeProfileController. Keys are Loom's
 * ResponseParameter values: CUSTOM_SIZE_PROFILE = "customSizeProfile",
 * CUSTOM_SIZE_PROFILE_LIST = "customSizeProfileList", DELETE_RESULT = "deleteResult".
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { CustomSizeProfileController } from "./custom-size-profile.controller.js";
import type { CustomSizeProfileRepository } from "../repository/custom-size-profile.repository.js";

function make(over: Record<string, unknown> = {}) {
  const repo = {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(9),
    update: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue({
      success: true,
      message: "Custom Size profile deleted.",
      productSkuList: null,
      subcategoryCount: null,
      subCategoryNameList: null,
    }),
    ...over,
  };
  return { repo, controller: new CustomSizeProfileController(repo as unknown as CustomSizeProfileRepository) };
}

const validBody = {
  profileName: "Blouse",
  disclaimer: "Measure over a fitted garment.",
  price: 250,
  customSizeProfileItemList: [{ label: "Bust", fieldType: 1, placeholder: "in", mandatory: true }],
};

describe("GET /get/custom-size-profile-list", () => {
  it("returns profiles under `customSizeProfileList`", async () => {
    const rows = [{ id: 1, profileName: "Blouse", customSizeProfileItemList: [] }];
    const { controller } = make({ findAll: vi.fn().mockResolvedValue(rows) });
    await expect(controller.getCustomSizeProfileList()).resolves.toEqual({
      success: true,
      message: "",
      customSizeProfileList: rows,
    });
  });

  it("returns an empty list when there are no profiles", async () => {
    const { controller } = make();
    await expect(controller.getCustomSizeProfileList()).resolves.toEqual({
      success: true,
      message: "",
      customSizeProfileList: [],
    });
  });
});

describe("GET /get/custom-size-profile/:profileId", () => {
  it("returns the profile under `customSizeProfile`", async () => {
    const profile = { id: 1, profileName: "Blouse", customSizeProfileItemList: [] };
    const { controller } = make({ findById: vi.fn().mockResolvedValue(profile) });
    await expect(controller.getCustomSizeProfile("1")).resolves.toEqual({
      success: true,
      message: "",
      customSizeProfile: profile,
    });
  });

  it("returns null for a profile that does not exist", async () => {
    const { controller } = make();
    await expect(controller.getCustomSizeProfile("99")).resolves.toEqual({
      success: true,
      message: "",
      customSizeProfile: null,
    });
  });

  it("rejects a non-numeric id", async () => {
    const { controller, repo } = make();
    await expect(controller.getCustomSizeProfile("abc")).rejects.toThrow(BadRequestException);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});

describe("POST /add/custom-size-profile", () => {
  it("creates and reports Loom's created message", async () => {
    const { controller, repo } = make();
    await expect(controller.addCustomSizeProfile(validBody)).resolves.toEqual({
      success: true,
      message: "New custom size profile created",
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ profileName: "Blouse", price: 250 }));
  });

  it("rejects a profile with no measurement fields", async () => {
    const { controller, repo } = make();
    await expect(controller.addCustomSizeProfile({ ...validBody, customSizeProfileItemList: [] })).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("rejects a non-positive price, as Loom's validator does", async () => {
    const { controller } = make();
    await expect(controller.addCustomSizeProfile({ ...validBody, price: 0 })).rejects.toThrow(/price/);
  });
});

describe("PATCH /update/custom-size-profile", () => {
  it("updates and reports success", async () => {
    const { controller } = make();
    await expect(controller.updateCustomSizeProfile({ ...validBody, id: 3 })).resolves.toEqual({
      success: true,
      message: "Custom size profile updated",
    });
  });

  it("reports a missing profile as a failure envelope", async () => {
    const { controller } = make({ update: vi.fn().mockResolvedValue(false) });
    await expect(controller.updateCustomSizeProfile({ ...validBody, id: 3 })).resolves.toEqual({
      success: false,
      message: "No custom size profile found for the given id",
    });
  });

  it("requires an id on update", async () => {
    const { controller, repo } = make();
    await expect(controller.updateCustomSizeProfile(validBody)).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /delete/custom-size-profile/:profileId", () => {
  it("returns the deletion result under `deleteResult`", async () => {
    const { controller } = make();
    await expect(controller.deleteCustomSizeProfile("3")).resolves.toEqual({
      success: true,
      message: "",
      deleteResult: {
        success: true,
        message: "Custom Size profile deleted.",
        productSkuList: null,
        subcategoryCount: null,
        subCategoryNameList: null,
      },
    });
  });

  it("passes through Loom's refusal when products still reference the profile", async () => {
    const blocked = {
      success: true,
      message: "Custom Size profile has 2 products and 1 sub categories associated. Cannot be deleted.",
      productSkuList: ["SKU-1", "SKU-2"],
      subcategoryCount: 1,
      subCategoryNameList: null,
    };
    const { controller } = make({ remove: vi.fn().mockResolvedValue(blocked) });
    await expect(controller.deleteCustomSizeProfile("3")).resolves.toEqual({
      success: true,
      message: "",
      deleteResult: blocked,
    });
  });

  it("reports a profile that does not exist", async () => {
    const missing = {
      success: false,
      message: "Profile not found.",
      productSkuList: null,
      subcategoryCount: null,
      subCategoryNameList: null,
    };
    const { controller } = make({ remove: vi.fn().mockResolvedValue(missing) });
    const result = await controller.deleteCustomSizeProfile("99");
    expect(result.deleteResult).toEqual(missing);
  });
});
