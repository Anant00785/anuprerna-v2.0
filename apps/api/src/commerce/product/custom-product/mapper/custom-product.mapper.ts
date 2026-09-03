/**
 * apps/api/src/product/custom-product/mapper/custom-product.mapper.ts
 *
 * Translates between the API-facing CustomProductInput shape and the
 * Drizzle insert/update value shapes for the `custom_product` table.
 * Source-verified field list: name, sku, price, productGroup, unit,
 * remarks, heroImage, additionalImages, additionalDocs, createdAt,
 * updatedAt (CustomProduct.java, custom_product/schema.ts).
 */
import { InsertCustomProductValues, UpdateCustomProductValues } from "../repository/custom-product.repository.js";
import { AddCustomProductRequest } from "../dto/custom-product.dto.js";
import { UpdateCustomProductInput } from "../types/custom-product.types.js";

/**
 * addNewCustomProduct(CustomProduct customProduct) — source sets
 * createdAt/updatedAt to `Pastebox.getCurrentTimeInMillis()` right before
 * `addNewEntity`; ported as `Date.now()` at insert time. Optional String
 * fields default to `""` (field initializer + @ColumnDefault("") in
 * source); `unit` defaults to `"METER"` (@ColumnDefault("'METER'")).
 */
export function toInsertValues(input: AddCustomProductRequest): InsertCustomProductValues {
  const now = Date.now();
  return {
    name: input.name,
    sku: input.sku,
    price: String(input.price),
    productGroup: input.productGroup,
    unit: input.unit ?? "METER",
    remarks: input.remarks ?? "",
    heroImage: input.heroImage ?? "",
    additionalImages: input.additionalImages ?? "",
    additionalDocs: input.additionalDocs ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * updateCustomProduct(CustomProduct updatedCustomProduct, LoomTenant tenant)
 * — source copies name/productGroup/unit/price/heroImage/additionalImages/
 * additionalDocs/remarks onto the existing entity and refreshes updatedAt;
 * `sku` and `createdAt` are deliberately NOT among the fields source
 * reassigns on update — preserved verbatim here (sku/createdAt stay
 * whatever they already were).
 */
export function toUpdateValues(input: UpdateCustomProductInput): UpdateCustomProductValues {
  return {
    name: input.name,
    productGroup: input.productGroup,
    unit: input.unit ?? "METER",
    price: String(input.price),
    heroImage: input.heroImage ?? "",
    additionalImages: input.additionalImages ?? "",
    additionalDocs: input.additionalDocs ?? "",
    remarks: input.remarks ?? "",
    updatedAt: Date.now(),
  };
}
