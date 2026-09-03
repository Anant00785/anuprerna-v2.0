/**
 * A well-formed id that matches no row must answer 404, not 200 with a null
 * payload. The 200-null shape made "no such product" indistinguishable from
 * "here is a product that happens to be null" for every client.
 *
 * Malformed ids stay 400 (the DTO parsers reject them before the service is
 * ever consulted) — asserted here too so the id-strictness work cannot be
 * regressed by the not-found guards.
 *
 * One representative handler per controller; the guard is the same one line
 * in all of them.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductController } from "./product.controller.js";
import { SegmentController } from "./segment.controller.js";
import { CategoryController } from "./category.controller.js";
import { SubCategoryController } from "./sub-category.controller.js";
import { SkuGroupController } from "./sku-group.controller.js";
import { TagController } from "./tag.controller.js";
import { SpecialStatusController } from "./special-status.controller.js";
import { ProductSizeProfileController } from "./product-size-profile.controller.js";
import { ProductZohoRelationController } from "./product-zoho-relation.controller.js";
import { FabricProductController } from "./fabric-product.controller.js";
import { CartController } from "../../cart/controller/cart.controller.js";

const nul = () => vi.fn().mockResolvedValue(null);
const svc = (...names: string[]) =>
  Object.fromEntries(names.map((n) => [n, nul()])) as never;

const CASES: [string, () => Promise<unknown>][] = [
  ["GET /get/product/:id", () => new ProductController(svc("retrieveProduct")).getProduct("999999999")],
  ["GET /get/product/by-id/:id", () => new ProductController(svc("retrieveProductById")).getProductById("999999999")],
  ["GET /get/product/slug/:slug", () => new ProductController(svc("findBySlug")).getProductBySlug("no-such-slug")],
  ["GET /get/table-explorer/data/product/:id", () => new ProductController(svc("retrieveProductDataById")).getProductDataById("999999999")],
  ["GET /get/segment/by-id/:id", () => new SegmentController(svc("retrieveSegmentById")).getSegmentById("999999999")],
  ["GET /get/segment/:segmentId", () => new SegmentController(svc("retrieveSegment")).getSegment("999999999")],
  ["GET /get/category/:categoryId", () => new CategoryController(svc("retrieveCategory")).getCategory("999999999")],
  ["GET /get/sub-category/:subCategoryId", () => new SubCategoryController(svc("retrieveSubCategory")).getSubCategory("999999999")],
  ["GET /get/sub-category/related/:subCategoryId", () => new SubCategoryController(svc("retrieveSubCategoryWithRelatedEntities")).getSubCategoryWithRelatedEntities("999999999")],
  ["GET /get/table-explorer/data/sku-group/:id", () => new SkuGroupController(svc("retrieveSkuGroupDataById")).getSkuGroupDataById("999999999")],
  ["GET /get/tag/:id", () => new TagController(svc("retrieveTagById")).getTagById("999999999")],
  ["GET /get/table-explorer/data/special-status/:id", () => new SpecialStatusController(svc("retrieveSpecialStatusDataById")).getSpecialStatusDataById("999999999")],
  ["GET /get/product-size-profile/:id", () => new ProductSizeProfileController(svc("retrieveProductSizeProfileById")).getProductSizeProfile("999999999")],
  ["GET /get/product-zoho-relation/:id", () => new ProductZohoRelationController(svc("retrieveProductZohoRelationById")).getProductZohoRelation("999999999")],
  ["GET /get/fabric-product/:productId", () => new FabricProductController(svc("retrieveFabricProduct")).getFabricProduct("999999999")],
  ["GET /get/fabric-product/slug/:productSlug", () => new FabricProductController(svc("retrieveFabricProductBySlug")).getFabricProductBySlug("no-such-slug")],
  ["GET /get/table-explorer/data/cart-item/:id", () => new CartController(svc("retrieveCartItemDataById")).getCartItemById("999999999")],
];

describe("a well-formed id with no matching row is a 404, never 200-with-null", () => {
  for (const [route, call] of CASES) {
    it(`${route} throws NotFoundException`, async () => {
      await expect(call()).rejects.toBeInstanceOf(NotFoundException);
    });
  }
});

describe("the reserved empty-slug handlers", () => {
  it("/get/product/slug (no slug) is a 404, not a 400 from the :id route", () => {
    expect(() => new ProductController(svc()).emptySlug()).toThrow(NotFoundException);
  });

  it("/get/fabric-product/slug (no slug) is a 404, not a 400 from the :productId route", () => {
    expect(() => new FabricProductController(svc()).emptySlug()).toThrow(NotFoundException);
  });
});

describe("malformed ids still 400 — the not-found guard never runs", () => {
  for (const bad of ["1e5", "0x10", "12345678901234567890"]) {
    it(`/get/product/${bad} is a 400`, async () => {
      const service = svc("retrieveProduct");
      await expect(new ProductController(service).getProduct(bad)).rejects.toBeInstanceOf(BadRequestException);
      expect((service as never as Record<string, ReturnType<typeof vi.fn>>).retrieveProduct).not.toHaveBeenCalled();
    });
  }
});
