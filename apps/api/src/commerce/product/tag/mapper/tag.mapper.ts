/**
 * apps/api/src/catalog/product/tag/mapper/tag.mapper.ts
 *
 * Translates between the API-facing Tag input shapes and the Drizzle
 * insert/update value shapes for the `tag` table. Direct port of what
 * `TagDAOController#createTag` / `#updateTag` actually write.
 */
import { InsertTagValues } from "../repository/tag.repository.js";
import { CreateTagInput } from "../types/tag.types.js";

/**
 * TagDAOController#createTag(Tag entity):
 *   entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis());
 *   return this.addNewEntity(entity);
 */
export function toInsertValues(input: CreateTagInput): InsertTagValues {
  return {
    name: input.name,
    timeOfCreation: Date.now(),
  };
}

/**
 * TagDAOController#updateTag(Tag updatedEntity):
 *   Tag entity = this.retrieveEntity(updatedEntity.getId());
 *   entity.setName(updatedEntity.getName());
 *   return this.modifyEntity(entity);
 *
 * Only `name` is ever written on update — verbatim from source.
 */
export function toUpdateValues(name: string): Partial<InsertTagValues> {
  return { name };
}
// @ts-nocheck
// @ts-nocheck
