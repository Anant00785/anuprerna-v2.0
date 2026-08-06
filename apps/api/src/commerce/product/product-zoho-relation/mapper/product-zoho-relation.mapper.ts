/**
 * apps/api/src/commerce/product-zoho-relation/mapper/product-zoho-relation.mapper.ts
 *
 * Translates between the API-facing ProductZohoRelationInput shape and the
 * Drizzle insert/update value shapes for the `product_zoho_relation`
 * table, and between raw entity rows and the view / flat data shapes.
 * Kept separate from the service, matching cart.mapper.ts /
 * product-size-profile.mapper.ts.
 */
import {
  InsertProductZohoRelationValues,
  UpdateProductZohoRelationValues,
} from "../repository/product-zoho-relation.repository.js";
import {
  CreateProductZohoRelationRequest,
  UpdateProductZohoRelationRequest,
} from "../dto/product-zoho-relation.dto.js";
import { ProductZohoRelationData, ProductZohoRelationEntity, ProductZohoRelationView } from "../types/product-zoho-relation.types.js";

/** BehemothCRUDDAOController#addNewEntity(productZohoRelation) — builds the insert payload. */
export function toInsertValues(input: CreateProductZohoRelationRequest): InsertProductZohoRelationValues {
  return {
    productId: input.productId,
    sku: input.sku,
    zohoItemId: input.zohoItemId ?? "",
    hsnCode: input.hsnCode ?? "",
    purchasePrice: String(input.purchasePrice ?? 0.001),
    tax: String(input.tax),
    disabled: input.disabled ?? false,
  };
}

/**
 * BehemothCRUDDAOController#modifyEntity(productZohoRelation) equivalent.
 * No override exists on ProductZohoRelationDAOController for update, so the
 * full persisted shape is written, matching product-size-profile.mapper.ts.
 */
export function toUpdateValues(input: UpdateProductZohoRelationRequest): UpdateProductZohoRelationValues {
  return {
    productId: input.productId,
    sku: input.sku,
    zohoItemId: input.zohoItemId ?? "",
    hsnCode: input.hsnCode ?? "",
    purchasePrice: String(input.purchasePrice ?? 0.001),
    tax: String(input.tax),
    disabled: input.disabled ?? false,
  };
}

/** Raw Drizzle row -> ProductZohoRelationEntity (numeric-string columns coerced back to number). */
export function toEntity(row: {
  id: bigint;
  version: bigint;
  productId: number;
  sku: string;
  zohoItemId: string;
  hsnCode: string;
  purchasePrice: string;
  tax: string;
  disabled: boolean;
}): ProductZohoRelationEntity {
  return {
    id: row.id,
    version: row.version,
    product: undefined,
    productId: row.productId,
    sku: row.sku,
    quantity: 0,
    zohoItemId: row.zohoItemId,
    hsnCode: row.hsnCode,
    purchasePrice: Number(row.purchasePrice),
    tax: Number(row.tax),
    disabled: row.disabled,
  };
}

/**
 * retrieveProductZohoRelationById(id) — `quantity` is always null: it's the
 * TS analogue of the source's `@Transient` field, never populated by this
 * module (see types.ts header note).
 */
export function toView(entity: ProductZohoRelationEntity): ProductZohoRelationView {
  return {
    id: Number(entity.id),
    version: Number(entity.version),
    productId: entity.productId,
    sku: entity.sku,
    quantity: null,
    zohoItemId: entity.zohoItemId,
    hsnCode: entity.hsnCode,
    purchasePrice: entity.purchasePrice,
    tax: entity.tax,
    disabled: entity.disabled,
  };
}

/** Native query row -> ProductZohoRelationData, matching @ColumnResult column order. */
export function toData(row: Record<string, unknown>): ProductZohoRelationData {
  return {
    id: Number(row.id),
    version: Number(row.version),
    productId: Number(row.product_id),
    sku: row.sku as string,
    zohoItemId: row.zoho_item_id as string,
    hsnCode: row.hsn_code as string,
    purchasePrice: Number(row.purchase_price),
    tax: Number(row.tax),
    disabled: row.disabled as boolean,
  };
}