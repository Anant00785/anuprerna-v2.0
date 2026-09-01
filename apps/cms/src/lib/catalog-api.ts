/**
 * Catalog reference-data API — Milestone 1 of the Weave CMS rebuild.
 *
 * Self-contained fetch helpers for the catalog CRUD screens. Returns full
 * Loom objects (not just the {id,name} RefOption pairs used by the product
 * edit form). Mirrors the request logic in api.ts but scoped to catalog
 * endpoints so api.ts stays stable.
 */

import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import { classifyHttpFailure, classifyNetworkFailure } from "@/lib/backend-fetch-error";
import type {
  CatalogCategory,
  CatalogSegment,
  CatalogSubCategory,
  CatalogSimpleItem,
} from "@/types/catalog";

const BACKEND =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? "http://localhost:8090")
    : (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8090");

async function catalogGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "localhost",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${BACKEND}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store" });
  } catch (e) {
    const classified = classifyNetworkFailure("catalog-api", url, e);
    console.error(classified.message);
    throw classified;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const classified = classifyHttpFailure("catalog-api", url, res.status, text.slice(0, 120));
    console.error(classified.message);
    throw classified;
  }
  return rewriteBloomscorpUrlsDeep(await res.json()) as T;
}

/** Extract the first array-of-objects from a Loom response envelope. */
function extractFirstArray<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== "object") return [];
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "object") {
      return value as T[];
    }
  }
  return [];
}

async function fetchCatalogList<T>(path: string, token?: string): Promise<T[]> {
  try {
    const payload = await catalogGet<unknown>(path, token);
    return extractFirstArray<T>(payload);
  } catch {
    return [];
  }
}

export const getCategoryList    = (token?: string) =>
  fetchCatalogList<CatalogCategory>("/get/category-list", token);

export const getSegmentList     = (token?: string) =>
  fetchCatalogList<CatalogSegment>("/get/segment-list", token);

export const getSubCategoryList = (token?: string) =>
  fetchCatalogList<CatalogSubCategory>("/get/sub-category-list", token);

export const getSkuGroupList    = (token?: string) =>
  fetchCatalogList<CatalogSimpleItem>("/get/sku-group-list", token);

export const getSpecialStatusList = (token?: string) =>
  fetchCatalogList<CatalogSimpleItem>("/get/special-status-list", token);

export const getTagList         = (token?: string) =>
  fetchCatalogList<CatalogSimpleItem>("/get/tag-list", token);

export const getMaterialList    = (token?: string) =>
  fetchCatalogList<CatalogSimpleItem>("/get/material-list", token);

export const getColorList       = (token?: string) =>
  fetchCatalogList<CatalogSimpleItem>("/get/color-list", token);

export const getPatternList     = (token?: string) =>
  fetchCatalogList<CatalogSimpleItem>("/get/pattern-list", token);
