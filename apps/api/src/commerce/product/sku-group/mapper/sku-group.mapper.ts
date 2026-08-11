/**
 * apps/api/src/product/sku_group/SkuGroup.mapper.ts
 *
 * Translates between the API-facing SkuGroup input shapes and the Drizzle
 * insert/update value shapes for the `sku_group` table. Kept separate from
 * the service so the "which fields get written on create vs. update" rule
 * stays visible in one place, mirroring commerce/cart/mapper/cart.mapper.ts.
 */
import { InsertSkuGroupValues, UpdateSkuGroupValues } from "../repository/sku-group.repository.js";
import { CreateSkuGroupInput } from "../types/sku-group.types.js";

/**
 * SkuGroupDaoController#createSkuGroup(SkuGroup entity):
 *   entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis());
 *   return this.addNewEntity(entity);
 * timeOfCreation is always server-set, never taken from the client input.
 */
export function toInsertValues(input: CreateSkuGroupInput): InsertSkuGroupValues {
  return {
    name: input.name,
    timeOfCreation: Date.now(),
  };
}

/**
 * SkuGroupDaoController#updateSkuGroup(SkuGroup updatedEntity):
 *   SkuGroup entity = this.retrieveEntity(updatedEntity.getId());
 *   entity.setName(updatedEntity.getName());
 *   return this.modifyEntity(entity);
 * Only `name` is ever written on update — timeOfCreation and every other
 * field is left untouched, preserved verbatim (not "improved").
 */
export function toUpdateValues(name: string): UpdateSkuGroupValues {
  return {
    name,
  };
}
// @ts-nocheck
// @ts-nocheck
