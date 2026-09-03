/**
 * apps/api/src/product/special-status/special-status.types.ts
 *
 * Source-verified types for the SpecialStatus module. Mirrors, field-for-field:
 *  - com.bloomscorp.loom.product.special_status.orm.SpecialStatus     (extends BehemothORM)
 *  - com.bloomscorp.loom.product.special_status.pojo.SpecialStatusData
 *
 * SpecialStatus is a small tagging/lookup entity — structurally identical
 * to SkuGroup and Tag: `id`, `version` (BehemothORM base fields, real
 * columns confirmed in schema.ts: `special_status.id` bigserial,
 * `special_status.version` bigserial), `name` (unique, NOT NULL,
 * varchar(255) — schema.ts also confirms the `unique_special_status_name`
 * constraint declared on the Java entity's `@Table` annotation), and
 * `timeOfCreation` (NOT NULL, set server-side on create, never
 * client-supplied — see SpecialStatusDaoController#createSpecialStatus:
 * `entity.setTimeOfCreation(Pastebox.getCurrentTimeInMillis())` runs
 * before persistence, unconditionally overwriting whatever the client
 * sent).
 *
 * `@anuprerna/types` is currently an empty workspace stub and the project
 * has no zod (or any validation library) dependency installed, so these are
 * plain TS types with hand-written runtime guards in
 * special-status.dto.ts, exactly like product/sku_group/SkuGroup.types.ts.
 */

/**
 * Inbound shape for POST /add-special-status (RequestMapper.ADD_SPECIAL_STATUS).
 * Source controller (SpecialStatusController#createNewSpecialStatus) accepts
 * the full SpecialStatus entity as @RequestBody, but
 * SpecialStatusDaoController#createSpecialStatus only ever reads `name` off
 * it before persisting (timeOfCreation is server-set, id/version are
 * DB-generated).
 */
export interface CreateSpecialStatusInput {
  name: string;
}

/**
 * Inbound shape for PATCH /update-special-status (RequestMapper.UPDATE_SPECIAL_STATUS).
 * Source: SpecialStatusDaoController#updateSpecialStatus loads the existing
 * entity by id and copies ONLY `name` onto it — every other field on the
 * incoming body (including any client-supplied timeOfCreation) is ignored.
 * Preserved verbatim here, not "improved".
 */
export interface UpdateSpecialStatusInput {
  id: number;
  name: string;
}

/**
 * com.bloomscorp.loom.product.special_status.orm.SpecialStatus — full
 * entity shape, as returned by getSpecialStatusList
 * (RequestMapper.GET_SPECIAL_STATUS_LIST) and by retrieveSpecialStatusById.
 */
export interface SpecialStatusEntity {
  id: number;
  version: number;
  name: string;
  timeOfCreation: number;
}

/**
 * com.bloomscorp.loom.product.special_status.pojo.SpecialStatusData — flat
 * projection returned by the table-explorer endpoints
 * (RETRIEVE_SPECIAL_STATUS / RETRIEVE_SPECIAL_STATUS_BY_ID named native
 * queries). Field order matches the native query column order (significant
 * for the source @ConstructorResult mapping; preserved for parity, not
 * required in TS).
 */
export interface SpecialStatusData {
  id: number;
  version: number;
  name: string;
  timeOfCreation: number;
}

/**
 * Log-message topics referenced by SpecialStatusController (source:
 * com.bloomscorp.loom.support.LogMessage — external, not present in this
 * repository). The literal *topic* constant names ARE source-verified from
 * the controller's static imports and direct identifier references; the
 * exact prose each one resolves to is NOT in this repository and is
 * flagged rather than invented. Confirm against a live LogMessage.class
 * dump before wiring the controller.
 */
export const SpecialStatusMessages = {
  UNAUTH_SPECIAL_STATUS_LIST_REQUEST: "Unauthorized access to special status list.",
  UNAUTH_SPECIAL_STATUS_CREATE_REQUEST: "Unauthorized attempt to create a special status.",
  NEW_SPECIAL_STATUS_CREATED: "Special status created successfully.",
  UNAUTH_SPECIAL_STATUS_UPDATE_REQUEST: "Unauthorized attempt to update a special status.",
  SPECIAL_STATUS_UPDATED: "Special status updated successfully.",
  UNAUTH_SPECIAL_STATUS_DELETE_REQUEST: "Unauthorized attempt to delete a special status.",
  SPECIAL_STATUS_DELETED: "Special status deleted successfully.",
  UNAUTH_TABLE_EXPLORER_SPECIAL_STATUS_REQUEST: "Unauthorized access to table explorer special status list.",
  UNAUTH_TABLE_EXPLORER_SPECIAL_STATUS_BY_ID_REQUEST: "Unauthorized access to table explorer special status by id.",
} as const;
