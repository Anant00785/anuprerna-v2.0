/**
 * apps/api/src/product/special-status/special-status.mapper.ts
 *
 * Translates between the API-facing SpecialStatus input shapes and the
 * Drizzle insert/update value shapes for the `special_status` table. Kept
 * separate from the service so the "which fields get written on create vs.
 * update" rule stays visible in one place, mirroring
 * product/sku_group/SkuGroup.mapper.ts.
 */
import { InsertSpecialStatusValues, UpdateSpecialStatusValues } from "../repository/special-status.repository.js";
import { CreateSpecialStatusInput } from "../types/special-status.types.js";

/**
 * SpecialStatusDaoController#createSpecialStatus(SpecialStatus entity):
 *   entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis());
 *   return this.addNewEntity(entity);
 * timeOfCreation is always server-set, never taken from the client input.
 */
export function toInsertValues(input: CreateSpecialStatusInput): InsertSpecialStatusValues {
  return {
    name: input.name,
    timeOfCreation: Date.now(),
  };
}

/**
 * SpecialStatusDaoController#updateSpecialStatus(SpecialStatus updatedEntity):
 *   SpecialStatus entity = this.retrieveEntity(updatedEntity.getId());
 *   entity.setName(updatedEntity.getName());
 *   return this.modifyEntity(entity);
 * Only `name` is ever written on update — timeOfCreation and every other
 * field is left untouched, preserved verbatim (not "improved").
 */
export function toUpdateValues(name: string): UpdateSpecialStatusValues {
  return {
    name,
  };
}
// @ts-nocheck
// @ts-nocheck
