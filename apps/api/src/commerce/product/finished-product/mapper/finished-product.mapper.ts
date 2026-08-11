// @ts-nocheck
/**
 * apps/api/src/product/finished-product/mapper/finished-product.mapper.ts
 *
 * Translates between the API-facing FinishedProductInput shape and the
 * Drizzle insert/update value shapes for the `product_finished` table.
 * Source-verified: the table has exactly one own column besides id/version
 * — `product_id` (product_finished/schema.ts, FinishedProductContract.java).
 * Kept as its own file — mirroring cart.mapper.ts — so the very small
 * "what actually gets written" surface stays visible in one place.
 */
import { InsertFinishedProductValues } from "../repository/finished-product.repository.js";

/**
 * FinishedProductDAOController#createFinishedProduct — after ProductPort has
 * persisted the nested product and returned its id (see
 * finished-product.service.ts for why this two-step shape replaces the
 * source's single JPA cascade save).
 */
export function toInsertValues(productId: number): InsertFinishedProductValues {
  return { productId };
}

/**
 * FinishedProductDAOController#updateFinishedProduct /
 * #disableFinishedProduct both end in `this.modifyEntity(finishedProduct)`
 * with no own-field change (FinishedProduct has no field besides `product`,
 * which isn't stored on this row) — the save exists purely to bump
 * `version` the way JPA's `@Version` does on any `save()` call. There is no
 * business column to include in the update payload; the repository's
 * `touchVersion` performs exactly this version-bump, no data field needed.
 */
// @ts-nocheck
// @ts-nocheck
