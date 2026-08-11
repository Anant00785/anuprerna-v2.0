/**
 * apps/api/src/commerce/product/segment/dto/segment.dto.ts
 *
 * Request DTOs, one per Segment endpoint that isn't gated behind
 * RequestMapper (controller generation deferred until RequestMapper.java
 * is available). Field sets mirror the corresponding SegmentController
 * handler parameters exactly:
 *  - getSegment(segmentId)
 *  - getSegmentList()
 *  - createNewSegment(segment: Segment)               [multipart]
 *  - updateSegment(updatedSegment: Segment, segmentId) [multipart]
 *  - getSegmentData(page, size)
 *  - getFilterSegmentList(category?)
 *  - getSegmentById(id)
 *  - deleteSegment(segmentId)
 *
 * No validation library installed yet, same constraint as Cart/Category —
 * parsing is done by hand rather than depending on a missing package.
 */
import { BadRequestException } from "@nestjs/common";
import { SegmentInput, UploadedFile } from "../types/segment.types.js";

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

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new BadRequestException(`${field} must be a string.`);
  return value;
}

function parseOptionalFile(value: unknown): UploadedFile | null | undefined {
  if (value === undefined || value === null) return undefined;
  return value as UploadedFile;
}

export interface TableExplorerPageQuery {
  page: number;
  size: number;
}

export function parseTableExplorerPageQuery(query: unknown): TableExplorerPageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = requireInt(q.page, "page");
  const size = requireInt(q.size, "size");
  if (page < 0) throw new BadRequestException("page must be >= 0.");
  if (size < 1) throw new BadRequestException("size must be >= 1.");
  return { page, size };
}

export function parseSegmentIdParam(segmentId: unknown): number {
  return requireInt(segmentId, "segmentId");
}

export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

/**
 * getFilterSegmentList(@RequestParam(required = false) String category) —
 * genuinely optional, no default, absent means "all categories".
 */
export function parseCategoryFilterQuery(query: unknown): string | undefined {
  const q = (query ?? {}) as Record<string, unknown>;
  return parseOptionalString(q.category, "category");
}

/** Shared multipart-body parsing for both create and update — the request shape is identical (Segment). */
function parseSegmentInput(body: unknown, files: unknown): SegmentInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const f = (files ?? {}) as Record<string, unknown>;

  return {
    categoryId: requireInt(b.categoryId, "categoryId"),
    name: requireNonEmptyString(b.name, "name"),
    metaTitle: parseOptionalString(b.metaTitle, "metaTitle"),
    metaDescription: parseOptionalString(b.metaDescription, "metaDescription"),
    iconFile: parseOptionalFile(f.iconFile),
    socialImageFile: parseOptionalFile(f.socialImageFile),
  };
}

export type CreateSegmentRequest = SegmentInput;

export function parseCreateSegmentRequest(body: unknown, files: unknown): CreateSegmentRequest {
  return parseSegmentInput(body, files);
}

export type UpdateSegmentRequest = SegmentInput;

export function parseUpdateSegmentRequest(body: unknown, files: unknown): UpdateSegmentRequest {
  return parseSegmentInput(body, files);
}
// @ts-nocheck
// @ts-nocheck
