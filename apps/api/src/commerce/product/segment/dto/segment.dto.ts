// @ts-nocheck
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
  const page = q.page !== undefined && q.page !== "" ? Number(q.page) : 0;
  const size = q.size !== undefined && q.size !== "" ? Number(q.size) : 20;
  return { page: Math.max(0, isNaN(page) ? 0 : page), size: Math.max(1, isNaN(size) ? 20 : size) };
}

export function parseSegmentIdParam(segmentId: unknown): number {
  return requireInt(segmentId, "segmentId");
}

export function parseIdParam(id: unknown): number {
  return requireInt(id, "id");
}

export function parseCategoryFilterQuery(query: unknown): string | undefined {
  const q = (query ?? {}) as Record<string, unknown>;
  return parseOptionalString(q.category, "category");
}

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
