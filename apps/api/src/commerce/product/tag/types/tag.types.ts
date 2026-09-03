/**
 * apps/api/src/catalog/product/tag/types/tag.types.ts
 *
 * Source-verified types for the Tag sub-module (product/tag). Mirrors,
 * field-for-field:
 *  - com.bloomscorp.loom.product.tag.orm.Tag           (extends BehemothORM)
 *  - com.bloomscorp.loom.product.tag.pojo.TagData
 *
 * `id` / `version` are not declared on Tag.java itself — they come from the
 * external BehemothORM base class (not present in the uploaded repository).
 * Their existence and types are confirmed instead from the introspected
 * schema (database/schema/schema.ts): `tag.id` is `bigserial`, `tag.version`
 * is `bigserial not null` — same pattern already relied on for `cart_item`
 * in commerce/cart. No fields have been invented beyond what's in source
 * or the introspected schema.
 *
 * No validation library (zod/class-validator) is installed in this project
 * (`@anuprerna/types` is an empty workspace stub, package.json lists
 * neither), so — same as commerce/cart — these are plain TS types with
 * hand-written runtime parsing in `dto/tag.dto.ts`.
 */

/** com.bloomscorp.loom.product.tag.orm.Tag, as returned by SELECT / INSERT / UPDATE. */
export interface TagRow {
  id: bigint;
  version: bigint;
  name: string;
  timeOfCreation: number;
}

/**
 * Inbound shape for POST /add-tag (RequestMapper.ADD_TAG). Source handler
 * takes the full `Tag` entity as its request body, but
 * `TagDAOController#createTag` only ever reads `name` off it before setting
 * `timeOfCreation` itself — `id`/`version`/`timeOfCreation` on the inbound
 * body are ignored by source, so they're not part of this input shape.
 */
export interface CreateTagInput {
  name: string;
}

/**
 * Inbound shape for PATCH /update-tag (RequestMapper.UPDATE_TAG). Source
 * handler takes the full `Tag` entity as its request body, but
 * `TagDAOController#updateTag` only ever reads `id` and `name` off it —
 * every other field on the inbound body is ignored by source (loads the
 * persisted entity by id, copies only `name` onto it, saves). Preserved
 * exactly: this input shape carries only what source actually consumes.
 */
export interface UpdateTagInput {
  id: bigint;
  name: string;
}

/**
 * com.bloomscorp.loom.product.tag.pojo.TagData — flat projection returned
 * by the table-explorer endpoints (native queries RETRIEVE_TAG /
 * RETRIEVE_TAG_BY_ID). Field order matches the source @ConstructorResult
 * column order (significant for the Java mapping; preserved for parity,
 * not required in TS).
 */
export interface TagData {
  id: bigint;
  version: bigint;
  name: string;
  timeOfCreation: number;
}
