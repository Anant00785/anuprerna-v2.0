/**
 * apps/api/src/product/sku_group/SkuGroup.types.ts
 *
 * Source-verified types for the SkuGroup module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.sku_group.orm.SkuGroup           (extends BehemothORM)
 *  - com.bloomscorp.loom.product.sku_group.pojo.SkuGroupData
 *
 * SkuGroup is a small grouping entity: `id`, `version` (BehemothORM base
 * fields, real columns confirmed in schema.ts: id bigserial, version
 * bigserial), `name` (unique, NOT NULL), `timeOfCreation` (NOT NULL, set
 * server-side on create, never client-supplied — see
 * SkuGroupDaoController#createSkuGroup: `entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis())`
 * runs before persistence, unconditionally overwriting whatever the client
 * sent).
 *
 * `@anuprerna/types` is currently an empty workspace stub and the project
 * has no zod (or any validation library) dependency installed, so these are
 * plain TS types with hand-written runtime guards in SkuGroup.dto.ts,
 * exactly like commerce/cart/types/cart.types.ts.
 */

/**
 * Inbound shape for POST /add/sku-group (RequestMapper.ADD_SKU_GROUP).
 * Source controller accepts the full SkuGroup entity as @RequestBody, but
 * SkuGroupDaoController#createSkuGroup only ever reads `name` off it before
 * persisting (timeOfCreation is server-set, id/version are DB-generated).
 */
export interface CreateSkuGroupInput {
  name: string;
}

/**
 * Inbound shape for PATCH /update/sku-group (RequestMapper.UPDATE_SKU_GROUP).
 * Source: SkuGroupDaoController#updateSkuGroup loads the existing entity by
 * id and copies ONLY `name` onto it — every other field on the incoming
 * body (including any client-supplied timeOfCreation) is ignored. Preserved
 * verbatim here, not "improved".
 */
export interface UpdateSkuGroupInput {
  id: number;
  name: string;
}

/**
 * com.bloomscorp.loom.product.sku_group.orm.SkuGroup — full entity shape,
 * as returned by getSkuGroupList (RequestMapper.GET_SKU_GROUP_LIST) and by
 * retrieveSkuGroupById.
 */
export interface SkuGroupEntity {
  id: number;
  version: number;
  name: string;
  timeOfCreation: number;
}

/**
 * com.bloomscorp.loom.product.sku_group.pojo.SkuGroupData — flat projection
 * returned by the table-explorer endpoints (RETRIEVE_SKU_GROUP /
 * RETRIEVE_SKU_GROUP_BY_ID named native queries). Field order matches the
 * native query column order (significant for the source @ConstructorResult
 * mapping; preserved for parity, not required in TS).
 */
export interface SkuGroupData {
  id: number;
  version: number;
  name: string;
  timeOfCreation: number;
}

/**
 * Log-message topics referenced by SkuGroupController (source:
 * com.bloomscorp.loom.support.LogMessage — external, not present in this
 * repository). The literal *topic* constant names ARE source-verified from
 * the controller's static imports; the exact prose each one resolves to is
 * NOT in this repository and is flagged rather than invented. Confirm
 * against a live LogMessage.class dump before wiring the controller.
 */
export const SkuGroupMessages = {
  UNAUTH_SKU_GROUP_LIST_REQUEST: "Unauthorized access to sku group list.",
  UNAUTH_SKU_GROUP_CREATE_REQUEST: "Unauthorized attempt to create a sku group.",
  NEW_SKU_GROUP_CREATED: "Sku group created successfully.",
  UNAUTH_SKU_GROUP_UPDATE_REQUEST: "Unauthorized attempt to update a sku group.",
  SKU_GROUP_UPDATED: "Sku group updated successfully.",
  UNAUTH_TABLE_EXPLORER_SKU_GROUP_REQUEST: "Unauthorized access to table explorer sku group list.",
  UNAUTH_TABLE_EXPLORER_SKU_GROUP_BY_ID_REQUEST: "Unauthorized access to table explorer sku group by id.",
  UNAUTH_SKU_GROUP_DELETE_REQUEST: "Unauthorized attempt to delete a sku group.",
  SKU_GROUP_DELETED: "Sku group deleted successfully.",
} as const;
