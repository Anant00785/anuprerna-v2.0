// @ts-nocheck
/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.dto.ts
 *
 * Request DTOs, one per FabricProductDAOController method. Field sets
 * mirror FabricProductController's handler parameters exactly:
 *  - getFabricProduct(productId) / getFabricProductBySlug(productSlug) /
 *    getFabricProductBySlugV2(productSlug)
 *  - createFabricProduct(fabricProduct: FabricProduct)
 *  - updateFabricProduct(fabricProduct: FabricProduct)
 *  - disableFabricProduct(productDisableRequest: ProductDisableRequest)
 *  - triggerZohoWorkflow(triggerData: ProductZohoTriggerData)
 *  - getFabricProductData(page, size) / getProductFabricData(page, size)
 *    (both route to the same `retrieveFabricProductData`, ported as one
 *    parser)
 *
 * REUSE: the nested `product` field of a FabricProduct request is parsed
 * with Product Core's own `parseCreateProductRequest` /
 * `parseUpdateProductRequest` (../../../product/core/dto/product.dto.js)
 * rather than re-implementing field-by-field parsing here — same "never
 * duplicate" rule the types file follows.
 *
 * Controller wiring is out of scope per the brief (RequestMapper.java
 * unavailable) — these parsers exist so fabric-product.service.ts has a
 * typed, validated boundary ready for that controller once it's generated.
 */
import { BadRequestException } from "@nestjs/common";
import { parseCreateProductRequest, parseUpdateProductRequest } from "../../product/dto/product.dto.js";
import { FabricFilterPreviewFilters, FabricProductInput, ProductDisableRequestInput, ProductZohoTriggerDataInput } from "../types/fabric-product.types.js";

function requireInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return n;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new BadRequestException(`${field} must be a boolean.`);
  }
  return value;
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  return requireBoolean(value, field);
}

function parseOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) throw new BadRequestException(`${field} must be a number.`);
  return n;
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new BadRequestException(`${field} must be a string.`);
  return value;
}

export interface PageQuery {
  page: number;
  size: number;
}

export function parsePageQuery(query: unknown): PageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = requireInt(q.page, "page");
  const size = requireInt(q.size, "size");
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** getFabricProduct(@PathVariable Long productId) */
export function parseProductIdParam(productId: unknown): number {
  return requireInt(productId, "productId");
}

/** getFabricProductBySlug/V2(@PathVariable String productSlug) */
export function parseProductSlugParam(productSlug: unknown): string {
  return requireNonEmptyString(productSlug, "productSlug");
}

/** Shared body parsing for both create and update — the request shape is identical (FabricProduct). */
function parseFabricProductInput(body: unknown, mode: "create" | "update"): FabricProductInput {
  const b = (body ?? {}) as Record<string, unknown>;

  const product = mode === "create" ? parseCreateProductRequest(b.product) : parseUpdateProductRequest(b.product);

  return {
    id: b.id === undefined ? undefined : requireInt(b.id, "id"),
    gsm: requireInt(b.gsm, "gsm"),
    addToSwatch: parseOptionalBoolean(b.addToSwatch, "addToSwatch"),
    width: requireNonEmptyString(b.width, "width"),
    product,
  };
}

export type CreateFabricProductRequest = FabricProductInput;

export function parseCreateFabricProductRequest(body: unknown): CreateFabricProductRequest {
  return parseFabricProductInput(body, "create");
}

export interface UpdateFabricProductRequest extends FabricProductInput {
  id: number; // required for update, unlike create
}

export function parseUpdateFabricProductRequest(body: unknown): UpdateFabricProductRequest {
  const parsed = parseFabricProductInput(body, "update");
  if (parsed.id === undefined) {
    throw new BadRequestException("id is required to update a fabric product.");
  }
  return parsed as UpdateFabricProductRequest;
}

/** disableFabricProduct(@RequestBody ProductDisableRequest) */
export function parseProductDisableRequest(body: unknown): ProductDisableRequestInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    productId: requireInt(b.productId, "productId"),
    disable: requireBoolean(b.disable, "disable"),
  };
}

/**
 * triggerZohoWorkflow(@RequestBody ProductZohoTriggerData) —
 * `productZohoRelationList` row shape belongs to the not-yet-migrated
 * ProductZohoRelation domain; accepted as an opaque array and passed
 * through unopened, matching source (see fabric-product.types.ts doc).
 */
export function parseProductZohoTriggerData(body: unknown): ProductZohoTriggerDataInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    productId: requireInt(b.productId, "productId"),
    productZohoRelationList: Array.isArray(b.productZohoRelationList) ? b.productZohoRelationList : [],
  };
}

/** FIND_FABRIC_FILTER_PREVIEW(_PAGE) params — category_name / segment_category_name, both optional-empty per source `:x is null or :x = ''` guards. */
export interface FabricFilterPreviewQuery {
  categoryName: string | null;
  segmentCategoryName: string | null;
}

export function parseFabricFilterPreviewQuery(query: unknown): FabricFilterPreviewQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  return {
    categoryName: parseOptionalString(q.categoryName, "categoryName") ?? null,
    segmentCategoryName: parseOptionalString(q.segmentCategoryName, "segmentCategoryName") ?? null,
  };
}

/** FIND_FABRIC_FILTER_PREVIEW_PAGE params — same as above plus limit/offset. */
export interface FabricFilterPreviewPageQuery extends FabricFilterPreviewQuery {
  limit: number;
  offset: number;
}

export function parseFabricFilterPreviewPageQuery(query: unknown): FabricFilterPreviewPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  return {
    ...parseFabricFilterPreviewQuery(query),
    limit: requireInt(q.limit, "limit"),
    offset: requireInt(q.offset, "offset"),
  };
}

/** FIND_FABRIC_FILTER_PREVIEW_BY_IDS(:ids) — comma-separated id list. */
export function parseFabricFilterPreviewIds(ids: unknown): number[] {
  const raw = requireNonEmptyString(ids, "ids");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => requireInt(s, "ids"));
}

/** FIND_FABRIC_FILTER_PREVIEW_FILTERED params — verbatim source contract, all filters optional. */
export function parseFabricFilterPreviewFilters(query: unknown): FabricFilterPreviewFilters {
  const q = (query ?? {}) as Record<string, unknown>;
  return {
    colors: parseOptionalString(q.colors, "colors") ?? null,
    materials: parseOptionalString(q.materials, "materials") ?? null,
    patterns: parseOptionalString(q.patterns, "patterns") ?? null,
    minPrice: parseOptionalNumber(q.minPrice, "minPrice") ?? null,
    maxPrice: parseOptionalNumber(q.maxPrice, "maxPrice") ?? null,
    minGSM: parseOptionalNumber(q.minGSM, "minGSM") ?? null,
    maxGSM: parseOptionalNumber(q.maxGSM, "maxGSM") ?? null,
    segments: parseOptionalString(q.segments, "segments") ?? null,
    subCategories: parseOptionalString(q.subCategories, "subCategories") ?? null,
    limit: requireInt(q.limit, "limit"),
    offset: requireInt(q.offset, "offset"),
  };
}
// @ts-nocheck
// @ts-nocheck
