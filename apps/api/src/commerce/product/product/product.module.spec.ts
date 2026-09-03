import { describe, it, expect, vi } from "vitest";
import "reflect-metadata";
import { ProductCoreModule } from "./product.module.js";
import {
  BADGE_PROFILE_PORT,
  CUSTOM_SIZE_PROFILE_PORT,
  FABRIC_PROFILE_PORT,
  FINISH_PROFILE_PORT,
  IMAGE_GALLERY_SEO_PORT,
  MADE_TO_ORDER_PRODUCT_PREVIEW_PORT,
  MADE_TO_ORDER_PROFILE_PORT,
  PRODUCT_SIZE_PROFILE_PORT,
  PRODUCT_ZOHO_RELATION_PORT,
  SIZE_PROFILE_PORT,
  SKU_GROUP_PORT,
  SPECIAL_STATUS_PORT,
  SUB_CATEGORY_PORT,
  VOLUME_DISCOUNT_PROFILE_PORT,
} from "./types/product.types.js";

const PORTS = [
  SUB_CATEGORY_PORT,
  SKU_GROUP_PORT,
  SPECIAL_STATUS_PORT,
  BADGE_PROFILE_PORT,
  VOLUME_DISCOUNT_PROFILE_PORT,
  MADE_TO_ORDER_PROFILE_PORT,
  MADE_TO_ORDER_PRODUCT_PREVIEW_PORT,
  CUSTOM_SIZE_PROFILE_PORT,
  SIZE_PROFILE_PORT,
  FINISH_PROFILE_PORT,
  FABRIC_PROFILE_PORT,
  PRODUCT_SIZE_PROFILE_PORT,
  PRODUCT_ZOHO_RELATION_PORT,
  IMAGE_GALLERY_SEO_PORT,
];

const providers = (): any[] => Reflect.getMetadata("providers", ProductCoreModule) ?? [];
const providerFor = (token: symbol) => providers().find((p) => p && p.provide === token);

/** Same drizzle-shaped double as db-lookup.spec.ts. */
function fakeDb(rows: unknown[]) {
  const chain: any = {
    select: vi.fn(() => chain),
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(rows)),
    then: (onOk: any, onErr: any) => Promise.resolve(rows).then(onOk, onErr),
  };
  return chain;
}

describe("ProductCoreModule — no port is a stub", () => {
  it("binds all fourteen cross-module ports", () => {
    for (const token of PORTS) expect(providerFor(token), String(token)).toBeDefined();
  });

  it("binds every port to a real provider — never a `useValue` dummy", () => {
    for (const token of PORTS) {
      const provider = providerFor(token);
      expect(provider.useValue, `${String(token)} is still a useValue stub`).toBeUndefined();
      expect(typeof provider.useFactory, String(token)).toBe("function");
      expect(provider.inject?.length, String(token)).toBeGreaterThan(0);
    }
  });
});

describe("ProductCoreModule — the ports return real data", () => {
  it("SUB_CATEGORY_PORT reads through SubCategoryService", async () => {
    const subCategory = { retrieveSubCategoryWithRelatedEntities: vi.fn().mockResolvedValue({ id: 3527n }) };
    const port = providerFor(SUB_CATEGORY_PORT).useFactory(subCategory);

    expect(await port.retrieveSubCategoryWithRelatedEntities(3527)).toEqual({ id: 3527 });
    expect(subCategory.retrieveSubCategoryWithRelatedEntities).toHaveBeenCalledWith(3527n);
  });

  it("BADGE_PROFILE_PORT reads through ProfileService", async () => {
    const profile = { getBadgeProfile: vi.fn().mockResolvedValue({ id: 11, name: "Handwoven" }) };
    const port = providerFor(BADGE_PROFILE_PORT).useFactory(profile);

    expect(await port.retrieveBadgeProfile(11)).toEqual({ id: 11 });
    expect(profile.getBadgeProfile).toHaveBeenCalledWith(11);
  });

  it("FABRIC_PROFILE_PORT reads the fabric_profile table, not a null literal", async () => {
    const port = providerFor(FABRIC_PROFILE_PORT).useFactory(fakeDb([{ id: 88n }]));
    expect(await port.retrieveFabricProfile(88)).toEqual({ id: 88 });
  });

  it("PRODUCT_SIZE_PROFILE_PORT actually issues the wholesale delete", async () => {
    const sizeProfiles = { deleteProductSizeProfileItems: vi.fn().mockResolvedValue(undefined) };
    await providerFor(PRODUCT_SIZE_PROFILE_PORT).useFactory(sizeProfiles).deleteProductSizeProfileItems(5);
    expect(sizeProfiles.deleteProductSizeProfileItems).toHaveBeenCalledWith(5);
  });

  it("PRODUCT_ZOHO_RELATION_PORT looks the relation up and writes `disabled` back", async () => {
    const relations = {
      findByProductIdAndSku: vi.fn().mockResolvedValue({ id: 900, sku: "SKU-1" }),
      setDisabled: vi.fn().mockResolvedValue(undefined),
    };
    const port = providerFor(PRODUCT_ZOHO_RELATION_PORT).useFactory(relations);

    expect(await port.findByProductAndSku(5, "SKU-1")).toEqual({ id: 900 });
    await port.setDisabled(900, true);
    expect(relations.setDisabled).toHaveBeenCalledWith(900, true);
  });

  it("IMAGE_GALLERY_SEO_PORT replaces the gallery rows instead of dropping them", async () => {
    const deleted: unknown[] = [];
    const inserted: unknown[] = [];
    const tx: any = {
      delete: () => ({ where: () => Promise.resolve(deleted.push("delete")) }),
      insert: () => ({ values: (rows: unknown[]) => Promise.resolve(inserted.push(...rows)) }),
    };
    const db: any = { transaction: (fn: any) => fn(tx) };

    const port = providerFor(IMAGE_GALLERY_SEO_PORT).useFactory(db);
    await port.replaceForProduct(7, [
      { image: "a.jpg", altText: "a" },
      { image: "b.jpg", altText: "b", deleted: true },
    ]);

    expect(deleted).toHaveLength(1);
    expect(inserted).toEqual([{ productId: 7, image: "a.jpg", altText: "a" }]);
  });
});
