/**
 * apps/api/src/catalog/product/tag/dto/tag.dto.ts
 *
 * Request DTOs, one per Tag endpoint. Field sets mirror the corresponding
 * TagController handler parameters exactly:
 *  - getTagData(page, size)
 *  - getTagById(id)
 *  - createNewTag(entity: Tag)   -> name only (see types/tag.types.ts)
 *  - updateTag(entity: Tag)      -> id + name only (see types/tag.types.ts)
 *
 * No validation library (zod/class-validator) is installed in this project
 * yet, so parsing here is done by hand, matching commerce/cart/dto/cart.dto.ts.
 */
import { BadRequestException } from "@nestjs/common";
import { CreateTagInput, UpdateTagInput } from "../types/tag.types.js";
import { parseIdParamStrict } from "../../../../common/params/id-param.js";

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

/** @RequestParam int page, @RequestParam int size on getTagData */
export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = q.page !== undefined && q.page !== "" ? requireInt(q.page, "page") : 1;
  const size = q.size !== undefined && q.size !== "" ? requireInt(q.size, "size") : 10;
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

/** @PathVariable Long id on getTagById */
export function parseIdParam(id: unknown): bigint {
  return parseIdParamStrict(id, "id");
}

/** @RequestBody Tag entity on createNewTag — only `name` is consumed by source. */
export function parseCreateTagRequest(body: unknown): CreateTagInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    name: requireNonEmptyString(b.name, "name"),
  };
}

/** @RequestBody Tag entity on updateTag — only `id` and `name` are consumed by source. */
export function parseUpdateTagRequest(body: unknown): UpdateTagInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    id: BigInt(requireInt(b.id, "id")),
    name: requireNonEmptyString(b.name, "name"),
  };
}
