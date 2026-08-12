// @ts-nocheck
/**
 * apps/api/src/commerce/product/fabric-product/fabric-product.mapper.ts
 *
 * Translates between the API-facing FabricProductInput shape and the
 * Drizzle insert/update value shapes for the `product_fabric` table.
 * Ported field-for-field from FabricProductDAOController#createFabricProduct
 * and #updateFabricProduct.
 */
import { InsertFabricProductValues } from "../repository/fabric-product.repository.js";
import { FabricProductInput } from "../types/fabric-product.types.js";

/**
 * createFabricProduct(LoomTenant tenant, FabricProduct fabricProduct) —
 * the `product_fabric` half of the insert. `productId` is supplied by the
 * caller (fabric-product.service.ts) once Product Core's row exists,
 * since it isn't known until that insert returns.
 */
export function toInsertValues(productId: number, input: FabricProductInput): InsertFabricProductValues {
  return {
    productId,
    gsm: input.gsm,
    addToSwatch: input.addToSwatch ?? true,
    width: input.width,
  };
}

/**
 * updateFabricProduct(LoomTenant tenant, FabricProduct updatedEntity) —
 * source: `fabricProduct.setGsm(...); fabricProduct.setAddToSwatch(...);
 * fabricProduct.setWidth(...);` — all three fields always overwritten,
 * unconditionally (no enabled-flag branching, unlike Product Core's
 * profile fields).
 */
export function toUpdateValues(input: FabricProductInput): Partial<InsertFabricProductValues> {
  return {
    gsm: input.gsm,
    addToSwatch: input.addToSwatch ?? true,
    width: input.width,
  };
}

/**
 * `product.setProductGroup("fabric")` — the one line
 * FabricProductDAOController#createFabricProduct mutates on the nested
 * Product before handing it to ProductDAOController#createProduct.
 * updateFabricProduct does NOT re-force productGroup (source never touches
 * it in the update path — Product Core's own update leaves productGroup
 * alone entirely, it isn't a column ProductDAOController#updateProduct
 * writes), so this is only used on create.
 */
export function withFabricProductGroup<T extends { productGroup: string }>(product: T): T {
  return { ...product, productGroup: "fabric" };
}
// @ts-nocheck
// @ts-nocheck
