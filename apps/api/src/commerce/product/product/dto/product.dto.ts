/**
 * apps/api/src/product/core/dto/Product.dto.ts
 *
 * Request DTOs, one per Product Core operation. Field sets mirror the
 * corresponding ProductDAOController method parameters exactly:
 *  - retrieveProduct(id) / retrieveProductById(id) / retrieveProductDataById(id)
 *  - findAllBySubCategoryId(subCategoryId)
 *  - createProduct(entity: Product)
 *  - updateProduct(updatedProduct: Product)
 *  - resolveRelatedProductsByIdCSV(csv)
 *  - retrieveProductData(page, size)
 *  - findNavMenuFinishedMapping(category)
 *
 * No validation library (zod/class-validator) is installed in this
 * project, so parsing is done by hand, matching Cart's dto/cart.dto.ts.
 *
 * Controller wiring (ProductController / ProductDAOController HTTP
 * surface) is explicitly out of scope for this step per the brief
 * ("Do NOT generate controller files yet because RequestMapper.java is
 * still unavailable") — these parse functions exist so Product.service.ts
 * has a typed, validated boundary ready for that controller once it's
 * generated.
 */
import { BadRequestException } from "@nestjs/common";
import {
  ImageGallerySeoItemInput,
  KNOWN_PRODUCT_GROUPS,
  ProductGroup,
  ProductInput,
  ProductSizeProfileItemInput,
  UNITS,
  Unit,
} from "../types/product.types.js";
import { parseIdParamStrict, toSafeNumberId, parseSlugParamStrict } from "../../../../common/params/id-param.js";

function requireInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return n;
}

/**
 * Path ids go through the shared strict parser (common/params/id-param.ts):
 * digits-only on the RAW string, converted with BigInt(string) so nothing is
 * rounded on the way through Number(). The local `requireInt` above stays for
 * JSON body / query fields, where an integer legitimately arrives as a number.
 */
function strictNumberIdParam(value: unknown, field: string): number {
  const n = toSafeNumberId(parseIdParamStrict(value, field));
  if (n === null) throw new BadRequestException(`${field} must be an integer.`);
  return n;
}

function requireNumber(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new BadRequestException(`${field} must be a number.`);
  }
  return n;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new BadRequestException(`${field} must be a string.`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new BadRequestException(`${field} must be a boolean.`);
  }
  return value;
}

function parseOptionalInt(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return requireInt(value, field);
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireString(value, field);
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  return requireBoolean(value, field);
}

function parseOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  return requireNumber(value, field);
}

function parseUnit(value: unknown): Unit {
  if (typeof value !== "string" || !(UNITS as readonly string[]).includes(value)) {
    throw new BadRequestException(`unit must be one of ${UNITS.join(", ")}.`);
  }
  return value as Unit;
}

function parseProductGroup(value: unknown): ProductGroup {
  const s = requireNonEmptyString(value, "productGroup");
  // Loose string type in source (VARCHAR column, no DB-level enum) — see
  // Product.types.ts. KNOWN_PRODUCT_GROUPS is informative only, not enforced.
  void KNOWN_PRODUCT_GROUPS;
  return s;
}

export interface PageQuery {
  page: number;
  size: number;
}

export function parsePageQuery(query: unknown): PageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = q.page !== undefined && q.page !== "" ? Number(q.page) : 0;
  const size = q.size !== undefined && q.size !== "" ? Number(q.size) : 20;
  return { page: Math.max(0, isNaN(page) ? 0 : page), size: Math.max(1, isNaN(size) ? 20 : size) };
}

export function parseIdParam(id: unknown): number {
  return strictNumberIdParam(id, "id");
}

export function parseSubCategoryIdParam(subCategoryId: unknown): number {
  return strictNumberIdParam(subCategoryId, "subCategoryId");
}

export function parseSlugParam(slug: unknown): string {
  return parseSlugParamStrict(slug, "slug");
}

export function parseBackwardCompatibleLinkParam(link: unknown): string {
  return requireNonEmptyString(link, "link");
}

/** resolveRelatedProductsByIdCSV(csv) — a raw comma-separated id string, parsed downstream in the service (mirrors source's own tolerant per-token parsing). */
export function parseCsvParam(csv: unknown): string {
  return requireNonEmptyString(csv, "csv");
}

/** findNavMenuFinishedMapping(categoryName) */
export function parseCategoryNameParam(categoryName: unknown): string {
  return requireNonEmptyString(categoryName, "categoryName");
}

function parseProductSizeProfileItem(value: unknown, index: number): ProductSizeProfileItemInput {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    id: v.id === undefined ? undefined : requireInt(v.id, `productSizeProfileList[${index}].id`),
    sizeProfileOptionId: requireInt(v.sizeProfileOptionId, `productSizeProfileList[${index}].sizeProfileOptionId`),
    quantity: requireInt(v.quantity, `productSizeProfileList[${index}].quantity`),
    disabled: parseOptionalBoolean(v.disabled, `productSizeProfileList[${index}].disabled`),
    consumedFabric: v.consumedFabric === undefined || v.consumedFabric === null
      ? null
      : requireNumber(v.consumedFabric, `productSizeProfileList[${index}].consumedFabric`),
  };
}

function parseImageGallerySeoItem(value: unknown, index: number): ImageGallerySeoItemInput {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    id: v.id === undefined ? undefined : requireInt(v.id, `imageGallerySEOList[${index}].id`),
    image: requireNonEmptyString(v.image, `imageGallerySEOList[${index}].image`),
    altText: requireString(v.altText, `imageGallerySEOList[${index}].altText`),
    deleted: parseOptionalBoolean(v.deleted, `imageGallerySEOList[${index}].deleted`),
  };
}

/** Shared body parsing for both create and update — the request shape is identical (Product). */
function parseProductInput(body: unknown): ProductInput {
  const b = (body ?? {}) as Record<string, unknown>;

  const productSizeProfileList = Array.isArray(b.productSizeProfileList)
    ? b.productSizeProfileList.map((item, i) => parseProductSizeProfileItem(item, i))
    : undefined;

  const imageGallerySEOList = Array.isArray(b.imageGallerySEOList)
    ? b.imageGallerySEOList.map((item, i) => parseImageGallerySeoItem(item, i))
    : undefined;

  // Required fields REJECT when absent — no invented name/SKU, no ₹1200
  // placeholder price (`||` would also have turned a genuine 0 price into
  // 1200), no defaulting into sub-category 25051.
  const name = requireNonEmptyString(b.name, "name").trim();
  const sku = requireNonEmptyString(b.sku, "sku").trim();
  const price = requireNumber(b.price, "price");
  const subCategoryId = requireInt(b.subCategoryId, "subCategoryId");
  const skuGroupId = requireInt(b.skuGroupId, "skuGroupId");
  const unit: Unit = parseUnit(b.unit);
  const mainProductCheck = parseOptionalBoolean(b.mainProductCheck, "mainProductCheck") ?? true;
  const productGroup: ProductGroup = parseProductGroup(b.productGroup);

  return {
    id: b.id === undefined ? undefined : (parseOptionalInt(b.id, "id") ?? undefined),
    subCategoryId,
    name,
    sku,
    skuGroupId,
    price,
    quantity: parseOptionalNumber(b.quantity, "quantity"), // DB default 0 when absent — never a placeholder 100
    externalQuantity: parseOptionalNumber(b.externalQuantity, "externalQuantity") ?? 0,
    unit,
    mainProductCheck,
    mainProductId: parseOptionalInt(b.mainProductId, "mainProductId"),
    tagId: parseOptionalString(b.tagId, "tagId"),
    badgeProfileId: parseOptionalInt(b.badgeProfileId, "badgeProfileId"),
    badgeProfileEnabled: parseOptionalBoolean(b.badgeProfileEnabled, "badgeProfileEnabled"),
    volumeDiscountProfileId: parseOptionalInt(b.volumeDiscountProfileId, "volumeDiscountProfileId"),
    volumeDiscountProfileEnabled: parseOptionalBoolean(b.volumeDiscountProfileEnabled, "volumeDiscountProfileEnabled"),
    madeToOrderProfileId: parseOptionalInt(b.madeToOrderProfileId, "madeToOrderProfileId"),
    madeToOrderProfileEnabled: parseOptionalBoolean(b.madeToOrderProfileEnabled, "madeToOrderProfileEnabled"),
    madeToOrderFabricId: parseOptionalInt(b.madeToOrderFabricId, "madeToOrderFabricId"),
    sizeProfileId: parseOptionalInt(b.sizeProfileId, "sizeProfileId"),
    sizeProfileEnabled: parseOptionalBoolean(b.sizeProfileEnabled, "sizeProfileEnabled"),
    productSpecificSizeProfile: b.productSpecificSizeProfile,
    productSpecificSizeProfileEnabled: parseOptionalBoolean(
      b.productSpecificSizeProfileEnabled,
      "productSpecificSizeProfileEnabled",
    ),
    customSizeProfileId: parseOptionalInt(b.customSizeProfileId, "customSizeProfileId"),
    customSizeProfileEnabled: parseOptionalBoolean(b.customSizeProfileEnabled, "customSizeProfileEnabled"),
    finishProfileId: parseOptionalInt(b.finishProfileId, "finishProfileId"),
    finishProfileEnabled: parseOptionalBoolean(b.finishProfileEnabled, "finishProfileEnabled"),
    finishProfileItemId: parseOptionalString(b.finishProfileItemId, "finishProfileItemId") ?? null,
    fabricProfileId: parseOptionalInt(b.fabricProfileId, "fabricProfileId"),
    fabricProfileEnabled: parseOptionalBoolean(b.fabricProfileEnabled, "fabricProfileEnabled"),
    specialStatusId: parseOptionalInt(b.specialStatusId, "specialStatusId"),
    productOverview: typeof b.productOverview === "string" ? b.productOverview : "",
    productCare: typeof b.productCare === "string" ? b.productCare : "",
    materialId: typeof b.materialId === "string" ? b.materialId : "",
    colorId: typeof b.colorId === "string" ? b.colorId : "",
    patternId: parseOptionalString(b.patternId, "patternId"),
    sale: parseOptionalBoolean(b.sale, "sale"),
    discount: parseOptionalNumber(b.discount, "discount"),
    heroImage: parseOptionalString(b.heroImage, "heroImage"),
    hoverImage: parseOptionalString(b.hoverImage, "hoverImage"),
    galleryImages: parseOptionalString(b.galleryImages, "galleryImages"),
    productGroup,
    productVideo: typeof b.productVideo === "string" ? b.productVideo : "",
    disabled: parseOptionalBoolean(b.disabled, "disabled") ?? false,
    metaTitle: parseOptionalString(b.metaTitle, "metaTitle"),
    metaDescription: parseOptionalString(b.metaDescription, "metaDescription"),
    heroImageAlt: parseOptionalString(b.heroImageAlt, "heroImageAlt"),
    hoverImageAlt: parseOptionalString(b.hoverImageAlt, "hoverImageAlt"),
    productVideoAlt: parseOptionalString(b.productVideoAlt, "productVideoAlt"),
    backwardCompatibleLink: parseOptionalString(b.backwardCompatibleLink, "backwardCompatibleLink"),
    productSizeProfileList,
    imageGallerySEOList,
  };
}

export type CreateProductRequest = ProductInput;

export function parseCreateProductRequest(body: unknown): CreateProductRequest {
  return parseProductInput(body);
}

export type UpdateProductRequest = ProductInput & { id: number };

export function parseUpdateProductRequest(body: unknown): UpdateProductRequest {
  const parsed = parseProductInput(body);
  if (parsed.id === undefined) {
    throw new BadRequestException("id is required to update a product.");
  }
  return parsed as UpdateProductRequest;
}

import { ApiProperty } from "@nestjs/swagger";

export class CreateProductDto {
  @ApiProperty({ example: "KAK0660N12", description: "Product SKU" })
  sku!: string;

  @ApiProperty({ example: "Chambray Teal Khadi Cotton 115 GSM Handwoven Fabric", description: "Product name" })
  name!: string;

  @ApiProperty({ example: 450, description: "Product price" })
  price!: number;

  @ApiProperty({ example: "METER", description: "Product unit ('METER', 'UNIT')" })
  unit!: Unit;

  @ApiProperty({ example: 100, description: "Stock quantity" })
  quantity!: number;

  @ApiProperty({ example: 3521, required: false, description: "Sub-category ID (e.g. 3521, 3527)" })
  subCategoryId?: number;

  @ApiProperty({ example: "High quality handwoven cotton fabric.", description: "Product overview" })
  productOverview!: string;

  @ApiProperty({ example: "Hand wash gently in cold water.", description: "Product care instructions" })
  productCare!: string;

  @ApiProperty({ example: "2570", description: "Material ID" })
  materialId!: string;

  @ApiProperty({ example: "2703", description: "Color ID" })
  colorId!: string;

  @ApiProperty({ example: "fabric", description: "Product group ('fabric' or 'finished')" })
  productGroup!: ProductGroup;

  @ApiProperty({ example: "https://example.com/videos/product-video.mp4", description: "Product video URL or S3 link" })
  productVideo!: string;
}

export class UpdateProductDto extends CreateProductDto {
  @ApiProperty({ example: 52336, description: "Product ID to update (e.g. 52336, 2728, 94504)" })
  id!: number;
}
