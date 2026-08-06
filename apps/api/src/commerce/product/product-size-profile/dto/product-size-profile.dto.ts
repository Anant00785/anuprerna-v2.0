/**
 * apps/api/src/commerce/product-size-profile/dto/product-size-profile.dto.ts
 *
 * Request DTOs mirroring ProductSizeProfileDAOController's public surface:
 *  - retrieveProductSizeProfileData(page, size)
 *  - retrieveProductSizeProfileById(id) / retrieveProductSizeProfileDataById(id)
 *  - create/update (base BehemothCRUDDAOController CRUD — no override, so
 *    the full entity shape is read/written, unlike Cart's quirky
 *    quantity-only update)
 *  - deleteProductSizeProfileItems(product) -> by productId
 *  - getProductSizeProfileBySizeOption / deleteProductSizeProfileBySizeOption -> by sizeProfileOptionId
 *
 * No controllers are generated for this domain (no RequestMapper.java was
 * found in the uploaded sources for ProductSizeProfile), so these parsers
 * exist for the service layer / a future controller to call, not wired to
 * any route here.
 *
 * No validation library (zod/class-validator) is installed in this project
 * (`@anuprerna/types` is an empty workspace stub, package.json lists
 * neither), so parsing is done by hand, matching cart.dto.ts / auth.dto.ts.
 */
import { BadRequestException } from "@nestjs/common";
import { ProductSizeProfileInput } from "../types/product-size-profile.types.js";

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

function requireOptionalNumber(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new BadRequestException(`${field} must be a number.`);
  }
  return n;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

/** retrieveProductSizeProfileData(int page, int size) */
export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = requireInt(q.page, "page");
  const size = requireInt(q.size, "size");
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** retrieveProductSizeProfileById(Long id) / retrieveProductSizeProfileDataById(Long id) */
export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

/** deleteProductSizeProfileItems(Product product) — resolves by product id */
export function parseProductIdParam(productId: unknown): number {
  return requireInt(productId, "productId");
}

/**
 * getProductSizeProfileBySizeOption / deleteProductSizeProfileBySizeOption
 * (SizeProfileOption option) — resolves by size profile option id, since
 * the SizeProfileOption entity itself is out of scope for this migration.
 */
export function parseSizeProfileOptionIdParam(sizeProfileOptionId: unknown): number {
  return requireInt(sizeProfileOptionId, "sizeProfileOptionId");
}

/**
 * retrieveConsumedFabricForImpact(Long productId, Long sizeProfileOptionId)
 */
export interface ConsumedFabricForImpactQuery {
  productId: number;
  sizeProfileOptionId: number;
}

export function parseConsumedFabricForImpactQuery(query: unknown): ConsumedFabricForImpactQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  return {
    productId: requireInt(q.productId, "productId"),
    sizeProfileOptionId: requireInt(q.sizeProfileOptionId, "sizeProfileOptionId"),
  };
}

/** Shared body parsing for create/update — matches the persisted entity shape exactly. */
function parseProductSizeProfileInput(body: unknown): ProductSizeProfileInput {
  const b = (body ?? {}) as Record<string, unknown>;

  return {
    id: b.id === undefined ? undefined : requireInt(b.id, "id"),
    productId: requireInt(b.productId, "productId"),
    sizeProfileOptionId: requireInt(b.sizeProfileOptionId, "sizeProfileOptionId"),
    sizeProfileOptionSku: requireNonEmptyString(b.sizeProfileOptionSku, "sizeProfileOptionSku"),
    quantity: requireInt(b.quantity, "quantity"),
    consumedFabric: requireOptionalNumber(b.consumedFabric, "consumedFabric"),
    disabled: b.disabled === undefined ? undefined : Boolean(b.disabled),
  };
}

export type CreateProductSizeProfileRequest = ProductSizeProfileInput;

export function parseCreateProductSizeProfileRequest(body: unknown): CreateProductSizeProfileRequest {
  return parseProductSizeProfileInput(body);
}

export interface UpdateProductSizeProfileRequest extends ProductSizeProfileInput {
  id: number; // required for update, unlike create
}

export function parseUpdateProductSizeProfileRequest(body: unknown): UpdateProductSizeProfileRequest {
  const parsed = parseProductSizeProfileInput(body);
  if (parsed.id === undefined) {
    throw new BadRequestException("id is required to update a product size profile.");
  }
  return parsed as UpdateProductSizeProfileRequest;
}
