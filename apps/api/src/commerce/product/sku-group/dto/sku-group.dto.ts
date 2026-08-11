/**
 * apps/api/src/product/sku_group/SkuGroup.dto.ts
 *
 * Request DTOs, one per SkuGroup endpoint. Field sets mirror the
 * corresponding SkuGroupController handler parameters exactly:
 *  - getSkuGroupList()
 *  - createNewSkuGroup(entity: SkuGroup)
 *  - updateSkuGroup(entity: SkuGroup)
 *  - getSkuGroupData(page, size)
 *  - getSkuGroupById(id)
 *  - deleteSkuGroup(groupId)
 *
 * No validation library (zod/class-validator) is installed in this project
 * (mirrors commerce/cart/dto/cart.dto.ts exactly), so parsing is done by
 * hand rather than depending on a missing package.
 */
import { BadRequestException } from "@nestjs/common";
import { CreateSkuGroupInput, UpdateSkuGroupInput } from "../types/sku-group.types.js";

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

/** getSkuGroupData(@RequestParam int page, @RequestParam int size) */
export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = requireInt(q.page, "page");
  const size = requireInt(q.size, "size");
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** getSkuGroupById(@PathVariable Long id) */
export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

/** deleteSkuGroup(@PathVariable Long groupId) */
export function parseGroupIdParam(groupId: unknown): number {
  return requireInt(groupId, "groupId");
}

/**
 * createNewSkuGroup(@RequestBody SkuGroup entity) — source accepts the full
 * entity shape but SkuGroupDaoController#createSkuGroup only ever reads
 * `name` off it (see SkuGroup.types.ts doc comment on CreateSkuGroupInput).
 */
export function parseCreateSkuGroupRequest(body: unknown): CreateSkuGroupInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    name: requireNonEmptyString(b.name, "name"),
  };
}

/**
 * updateSkuGroup(@RequestBody SkuGroup entity) — id is required to locate
 * the existing row (SkuGroupDaoController#updateSkuGroup calls
 * retrieveEntity(updatedEntity.getId()) before mutating), name is required
 * to write.
 */
export function parseUpdateSkuGroupRequest(body: unknown): UpdateSkuGroupInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    id: requireInt(b.id, "id"),
    name: requireNonEmptyString(b.name, "name"),
  };
}
// @ts-nocheck
// @ts-nocheck
