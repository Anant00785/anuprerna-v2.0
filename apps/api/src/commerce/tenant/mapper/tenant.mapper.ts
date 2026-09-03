/**
 * apps/api/src/commerce/tenant/mapper/tenant.mapper.ts
 *
 * WHY THIS DELEGATES: this file had its own mapTenantProfile that read
 * `row.name`, `row.phone` and `row.type` — none of which are columns on
 * `loom_tenant` (they are `user_name`, `contact_number`, `user_type`, surfaced
 * by Drizzle as userName / contactNumber / userType). Every one of those
 * resolved to `undefined`, was dropped by JSON.stringify, and
 * GET /get/customer/profile answered with nothing but `{id, email}` for an
 * account whose name and phone were sitting in the database. A second, correct
 * implementation already existed in commerce/profile/mapper/profile.mapper.ts
 * and simply was not the one wired up.
 *
 * There is now ONE implementation. Do not reintroduce a local copy: two mappers
 * over the same row is what produced the divergence in the first place.
 */
export { mapTenantProfile } from "../../profile/mapper/profile.mapper.js";

/**
 * `user_role` columns are `id`, `role` and `user_id` — there is no `roleName`
 * and no `tenant_id`, so the previous mapping produced `{id, undefined,
 * undefined}` for every row. Kept tolerant of either spelling because callers
 * pass both raw rows and already-mapped objects.
 */
export function mapUserRole(row: any) {
  if (!row) return null;
  return {
    id: typeof row.id === "bigint" ? Number(row.id) : row.id,
    role: row.role ?? row.roleName ?? "",
    userId: Number(row.userId ?? row.user_id ?? row.tenantId ?? 0) || null,
  };
}
