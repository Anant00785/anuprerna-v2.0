import { describe, it, expect } from "vitest";
import {
  mapLegacyProductToDomain,
  mapLegacyProductDetailToDomain,
  mapLegacyNavigationToDomain,
  resolveImageUrl,
} from "./legacy-catalog.adapter";
import { mapNestProductToDomain } from "./nest-catalog.adapter";
import { env } from "@/env";
import type { LegacyFabricProductDto } from "../dto/legacy-springboot.dto";
import type { NestProductDto } from "../dto/nestjs.dto";

const S3_BASE = env.NEXT_PUBLIC_S3_BASE_URL.replace(/\/$/, "");

describe("resolveImageUrl", () => {
  it("returns the placeholder for a missing/empty path", () => {
    expect(resolveImageUrl(undefined)).toBe("/images/placeholder.jpg");
    expect(resolveImageUrl(null)).toBe("/images/placeholder.jpg");
    expect(resolveImageUrl("   ")).toBe("/images/placeholder.jpg");
  });

  it("passes an already-absolute URL through unchanged", () => {
    expect(resolveImageUrl("https://cdn.example.test/a.jpg")).toBe("https://cdn.example.test/a.jpg");
  });

  it("prefixes a relative path with the S3 base URL, adding a leading slash if missing", () => {
    expect(resolveImageUrl("products/a.jpg")).toBe(`${S3_BASE}/products/a.jpg`);
    expect(resolveImageUrl("/products/b.jpg")).toBe(`${S3_BASE}/products/b.jpg`);
  });
});

describe("mapLegacyProductToDomain", () => {
  it("maps a full DTO field by field", () => {
    const dto: LegacyFabricProductDto = {
      id: 42,
      slug: "handwoven-cotton",
      productName: "Handwoven Cotton",
      priceDetails: { discountedPrice: 800, basePrice: 1000, mrp: 1200, currencySymbol: "INR" },
      primaryImage: "cotton.jpg",
      images: ["cotton.jpg", "cotton-2.jpg"],
      availableQuantity: 5,
      materialName: "Cotton",
      craftName: "Handloom",
      weaveName: "Plain",
      gsm: 180,
      isEcoFriendly: true,
      minOrderQuantity: 3,
      ratingAverage: 4.5,
      totalReviews: 12,
    };

    const product = mapLegacyProductToDomain(dto);

    expect(product.id).toBe("42");
    expect(product.slug).toBe("handwoven-cotton");
    expect(product.name).toBe("Handwoven Cotton");
    expect(product.price).toBe(800); // discountedPrice wins over basePrice
    expect(product.originalPrice).toBe(1200); // mrp wins
    expect(product.currency).toBe("INR");
    expect(product.thumbnail).toBe(`${S3_BASE}/cotton.jpg`);
    expect(product.gallery).toEqual([`${S3_BASE}/cotton.jpg`, `${S3_BASE}/cotton-2.jpg`]);
    expect(product.inStock).toBe(true);
    expect(product.availableQuantity).toBe(5);
    expect(product.material).toBe("Cotton");
    expect(product.craft).toBe("Handloom");
    expect(product.weave).toBe("Plain");
    expect(product.gsm).toBe(180);
    expect(product.ecoFriendly).toBe(true);
    expect(product.minimumOrderQty).toBe(3);
    expect(product.rating).toBe(4.5);
    expect(product.reviewsCount).toBe(12);
    expect(product.badge).toBe("Eco Handloom");
  });

  it("falls back to defaults for a minimal/empty DTO", () => {
    const product = mapLegacyProductToDomain({});

    expect(product.id).toBe("");
    expect(product.name).toBe("Untitled Fabric");
    expect(product.price).toBe(0);
    expect(product.originalPrice).toBeUndefined();
    expect(product.currency).toBe("INR");
    expect(product.thumbnail).toBe("/images/placeholder.jpg");
    expect(product.gallery).toEqual(["/images/placeholder.jpg"]);
    expect(product.inStock).toBe(true); // no availableQuantity => treated as in stock
    expect(product.ecoFriendly).toBe(false);
    expect(product.minimumOrderQty).toBe(1);
    expect(product.rating).toBe(4.8); // hardcoded fallback, not derived from real data
    expect(product.reviewsCount).toBe(0);
    expect(product.badge).toBeUndefined();
  });

  it("treats a zero price as a real price, not a missing one (?? not ||)", () => {
    const product = mapLegacyProductToDomain({ priceDetails: { basePrice: 0 } });
    expect(product.price).toBe(0);
  });

  it("BUG: availableQuantity of 0 is still treated as in stock (`dto?.availableQuantity ? ... : true` — 0 is falsy)", () => {
    const product = mapLegacyProductToDomain({ availableQuantity: 0 });
    expect(product.inStock).toBe(true);
  });

  it("falls back through the image field priority: primaryImage > imageUrl > images[0] > coverImage", () => {
    expect(mapLegacyProductToDomain({ imageUrl: "b.jpg" }).thumbnail).toBe(`${S3_BASE}/b.jpg`);
    expect(mapLegacyProductToDomain({ images: ["c.jpg"] }).thumbnail).toBe(`${S3_BASE}/c.jpg`);
    expect(mapLegacyProductToDomain({ coverImage: "d.jpg" }).thumbnail).toBe(`${S3_BASE}/d.jpg`);
  });
});

describe("mapLegacyProductDetailToDomain", () => {
  it("builds a specifications list only from present fields, plus free-form specifications map", () => {
    const dto: LegacyFabricProductDto = {
      productName: "Silk Scarf",
      materialName: "Silk",
      gsm: 90,
      specifications: { Weave: "Twill" },
      description: "A fine silk scarf.",
      careInstructions: "Hand wash only.",
      countryOfOrigin: "India",
      certificationStatus: "GOTS",
    };

    const detail = mapLegacyProductDetailToDomain(dto);

    expect(detail.specifications).toEqual([
      { label: "Material", value: "Silk" },
      { label: "GSM / Weight", value: "90 g/m²" },
      { label: "Origin", value: "India" },
      { label: "Weave", value: "Twill" },
    ]);
    expect(detail.description).toBe("A fine silk scarf.");
    expect(detail.careInstructions).toBe("Hand wash only.");
    expect(detail.origin).toBe("India");
    expect(detail.certification).toBe("GOTS");
    expect(detail.relatedProductSlugs).toEqual([]);
  });

  it("uses placeholder copy when description/care/origin/certification are missing", () => {
    const detail = mapLegacyProductDetailToDomain({});
    expect(detail.description).toBe("Handcrafted sustainable artisan textile.");
    expect(detail.careInstructions).toMatch(/Dry clean/);
    expect(detail.origin).toBe("West Bengal, India");
    expect(detail.certification).toBe("Handloom Mark Certified");
    expect(detail.specifications).toEqual([]);
  });
});

describe("mapLegacyNavigationToDomain", () => {
  it("reads a plain array payload and maps each item, including recursive children", () => {
    const nav = mapLegacyNavigationToDomain([
      { id: 1, title: "Fabrics", url: "/fabrics", subMenus: [{ id: 2, title: "Cotton", url: "/fabrics/cotton" }] },
    ]);
    expect(nav.mainCategories).toHaveLength(1);
    expect(nav.mainCategories[0]).toMatchObject({ id: "1", label: "Fabrics", href: "/fabrics" });
    expect(nav.mainCategories[0].children).toEqual([
      { id: "2", label: "Cotton", href: "/fabrics/cotton", icon: undefined, badge: undefined, image: undefined, description: undefined, children: undefined },
    ]);
  });

  it("falls back through navigationList / categories / payload wrapper shapes", () => {
    expect(mapLegacyNavigationToDomain({ navigationList: [{ id: 1, title: "A" }] }).mainCategories).toHaveLength(1);
    expect(mapLegacyNavigationToDomain({ categories: [{ id: 1, title: "B" }] }).mainCategories).toHaveLength(1);
    expect(mapLegacyNavigationToDomain({ payload: { navigationList: [{ id: 1, title: "C" }] } }).mainCategories).toHaveLength(1);
    expect(mapLegacyNavigationToDomain({ payload: [{ id: 1, title: "D" }] }).mainCategories).toHaveLength(1);
  });

  it("defaults to an empty category list and the fallback promo banner when nothing matches", () => {
    const nav = mapLegacyNavigationToDomain({});
    expect(nav.mainCategories).toEqual([]);
    expect(nav.featuredCollections).toEqual([]);
    expect(nav.topBarBanner).toMatchObject({ href: "/collections" });
  });

  it("uses the backend promo banner text/link when provided", () => {
    const nav = mapLegacyNavigationToDomain({ promoBannerText: "Sale!", promoBannerLink: "/sale" });
    expect(nav.topBarBanner).toEqual({ text: "Sale!", href: "/sale" });
  });
});

describe("legacy vs nest catalog adapter equivalence", () => {
  it("map a representative legacy and nest product payload to the same domain shape", () => {
    const legacyDto: LegacyFabricProductDto = {
      id: 7,
      slug: "eco-linen",
      productName: "Eco Linen",
      priceDetails: { discountedPrice: 500, mrp: 600, currencySymbol: "INR" },
      primaryImage: "linen.jpg",
      images: ["linen.jpg"],
      availableQuantity: 10,
      materialName: "Linen",
      craftName: "Handloom",
      weaveName: "Plain",
      gsm: 200,
      isEcoFriendly: true,
      minOrderQuantity: 2,
    };

    const nestDto: NestProductDto = {
      id: "7",
      slug: "eco-linen",
      title: "Eco Linen",
      price: { amount: 500, originalAmount: 600, currency: "INR" },
      thumbnailUrl: `${S3_BASE}/linen.jpg`,
      galleryUrls: [`${S3_BASE}/linen.jpg`],
      stockQuantity: 10,
      isAvailable: true,
      material: "Linen",
      craft: "Handloom",
      weave: "Plain",
      weightGsm: 200,
      isSustainable: true,
      minOrderQty: 2,
    };

    const fromLegacy = mapLegacyProductToDomain(legacyDto);
    const fromNest = mapNestProductToDomain(nestDto);

    expect(fromLegacy).toEqual(
      expect.objectContaining({
        id: "7",
        slug: "eco-linen",
        name: "Eco Linen",
        price: 500,
        originalPrice: 600,
        currency: "INR",
        thumbnail: `${S3_BASE}/linen.jpg`,
        gallery: [`${S3_BASE}/linen.jpg`],
        inStock: true,
        availableQuantity: 10,
        material: "Linen",
        craft: "Handloom",
        weave: "Plain",
        gsm: 200,
        minimumOrderQty: 2,
      })
    );
    // Same fields, same values — the dual-adapter premise: both backends,
    // once mapped, are indistinguishable to the rest of the app.
    expect(fromNest).toMatchObject({
      id: fromLegacy.id,
      slug: fromLegacy.slug,
      name: fromLegacy.name,
      price: fromLegacy.price,
      originalPrice: fromLegacy.originalPrice,
      currency: fromLegacy.currency,
      thumbnail: fromLegacy.thumbnail,
      gallery: fromLegacy.gallery,
      inStock: fromLegacy.inStock,
      availableQuantity: fromLegacy.availableQuantity,
      material: fromLegacy.material,
      craft: fromLegacy.craft,
      weave: fromLegacy.weave,
      gsm: fromLegacy.gsm,
      minimumOrderQty: fromLegacy.minimumOrderQty,
    });
  });
});
