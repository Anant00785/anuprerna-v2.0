// @ts-nocheck
/**
 * apps/api/src/commerce/product-size-profile/mapper/product-size-profile.mapper.ts
 *
 * Translates between the API-facing ProductSizeProfileInput shape and the
 * Drizzle insert/update value shapes for the `product_size_profile` table,
 * and between raw entity rows and the enriched view / flat data shapes.
 * Kept separate from the service, matching cart.mapper.ts.
 */
import {
  InsertProductSizeProfileValues,
  UpdateProductSizeProfileValues,
} from "../repository/product-size-profile.repository.js";
import {
  CreateProductSizeProfileRequest,
  UpdateProductSizeProfileRequest,
} from "../dto/product-size-profile.dto.js";
import {
  ProductSizeProfileData,
  ProductSizeProfileEntity,
  ProductSizeProfileView,
  SizeProfileOptionPreview,
} from "../types/product-size-profile.types.js";

/** BehemothCRUDDAOController#addNewEntity(productSizeProfile) — builds the insert payload. */
export function toInsertValues(input: CreateProductSizeProfileRequest): InsertProductSizeProfileValues {
  return {
    productId: input.productId,
    sizeProfileOptionId: input.sizeProfileOptionId,
    sizeProfileOptionSku: input.sizeProfileOptionSku,
    quantity: input.quantity,
    consumedFabric: input.consumedFabric == null ? null : String(input.consumedFabric),
    disabled: input.disabled ?? false,
  };
}

/**
 * BehemothCRUDDAOController#modifyEntity(productSizeProfile) equivalent.
 * No override exists on ProductSizeProfileDAOController for update (unlike
 * Cart's quantity-only quirk), so the full persisted shape is written.
 */
export function toUpdateValues(input: UpdateProductSizeProfileRequest): UpdateProductSizeProfileValues {
  return {
    productId: input.productId,
    sizeProfileOptionId: input.sizeProfileOptionId,
    sizeProfileOptionSku: input.sizeProfileOptionSku,
    quantity: input.quantity,
    consumedFabric: input.consumedFabric == null ? null : String(input.consumedFabric),
    disabled: input.disabled ?? false,
  };
}

/** Raw Drizzle row -> ProductSizeProfileEntity (numeric-string columns coerced back to number). */
export function toEntity(row: {
  id: bigint;
  version: bigint;
  productId: number;
  sizeProfileOptionId: number;
  sizeProfileOptionSku: string;
  quantity: number;
  consumedFabric: string | null;
  disabled: boolean;
}): ProductSizeProfileEntity {
  return {
    id: row.id,
    version: row.version,
    productId: row.productId,
    sizeProfileOptionId: row.sizeProfileOptionId,
    sizeProfileOptionSku: row.sizeProfileOptionSku,
    quantity: row.quantity,
    consumedFabric: row.consumedFabric === null ? null : Number(row.consumedFabric),
    disabled: row.disabled,
  };
}

/**
 * retrieveProductSizeProfileById(id) enrichment — the TS analogue of the
 * populated `sizeProfileOption` association on the Java entity.
 */
export function toView(
  entity: ProductSizeProfileEntity,
  sizeProfileOption: SizeProfileOptionPreview | null,
): ProductSizeProfileView {
  return {
    id: Number(entity.id),
    version: Number(entity.version),
    productId: entity.productId,
    sizeProfileOption,
    sizeProfileOptionSku: entity.sizeProfileOptionSku,
    quantity: entity.quantity,
    consumedFabric: entity.consumedFabric,
    disabled: entity.disabled,
  };
}

/** Native query row -> ProductSizeProfileData, matching @ColumnResult column order. */
export function toData(row: Record<string, unknown>): ProductSizeProfileData {
  return {
    id: Number(row.id),
    version: Number(row.version),
    productId: Number(row.product_id),
    sizeProfileOptionId: Number(row.size_profile_option_id),
    sizeProfileOptionSku: row.size_profile_option_sku as string,
    quantity: Number(row.quantity),
    consumedFabric: row.consumed_fabric === null ? null : Number(row.consumed_fabric),
    disabled: row.disabled as boolean,
  };
}
// @ts-nocheck
// @ts-nocheck
