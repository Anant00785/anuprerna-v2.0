/**
 * apps/api/src/product/special-status/special-status.dto.ts
 *
 * Request DTOs, one per SpecialStatus endpoint. Field sets mirror the
 * corresponding SpecialStatusController handler parameters exactly:
 *  - getSpecialStatusList()
 *  - createNewSpecialStatus(entity: SpecialStatus)
 *  - updateSpecialStatus(entity: SpecialStatus)
 *  - getSpecialStatusData(page, size)
 *  - getSpecialStatusById(id)
 *  - deleteSpecialStatus(statusId)         -- source path variable is
 *    named `statusId`, not `id`; preserved verbatim.
 *
 * No validation library (zod/class-validator) is installed in this project
 * (mirrors product/sku_group/SkuGroup.dto.ts exactly), so parsing is done
 * by hand rather than depending on a missing package.
 */
import { BadRequestException } from "@nestjs/common";
import { CreateSpecialStatusInput, UpdateSpecialStatusInput } from "../types/special-status.types.js";

function requireInt(value: unknown, field: string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return n;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  return value;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

/** getSpecialStatusData(@RequestParam int page, @RequestParam int size) */
export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = requireInt(q.page, "page");
  const size = requireInt(q.size, "size");
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** getSpecialStatusById(@PathVariable Long id) */
export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

/** deleteSpecialStatus(@PathVariable Long statusId) */
export function parseStatusIdParam(statusId: unknown): number {
  return requireInt(statusId, "statusId");
}

/**
 * createNewSpecialStatus(@RequestBody SpecialStatus entity) — source
 * accepts the full entity shape but
 * SpecialStatusDaoController#createSpecialStatus only ever reads `name`
 * off it (see special-status.types.ts doc comment on
 * CreateSpecialStatusInput).
 */
export function parseCreateSpecialStatusRequest(body: unknown): CreateSpecialStatusInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    name: requireNonEmptyString(b.name, "name"),
  };
}

/**
 * updateSpecialStatus(@RequestBody SpecialStatus entity) — id is required
 * to locate the existing row (SpecialStatusDaoController#updateSpecialStatus
 * calls retrieveEntity(updatedEntity.getId()) before mutating), name is
 * required to write.
 */
export function parseUpdateSpecialStatusRequest(body: unknown): UpdateSpecialStatusInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    id: requireInt(b.id, "id"),
    name: requireNonEmptyString(b.name, "name"),
  };
}
// @ts-nocheck
// @ts-nocheck
