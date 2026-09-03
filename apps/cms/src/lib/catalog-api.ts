/**
 * Catalog reference-data API — Milestone 1 of the Weave CMS rebuild.
 *
 * Self-contained fetch helpers for the catalog CRUD screens. Returns full
 * Loom objects (not just the {id,name} RefOption pairs used by the product
 * edit form). Mirrors the request logic in api.ts but scoped to catalog
 * endpoints so api.ts stays stable.
 */

import {loomGetJson} from "@/lib/backend-fetch-error";
import type {
  CatalogCategory,
  CatalogSegment,
  CatalogSubCategory,
  CatalogSimpleItem,
} from "@/types/catalog";


/** Single backend GET for this module. All failure handling — network,
 *  HTTP, and the `{success:false}` envelope — lives in loomGetJson. */
const catalogGet = <T,>(path: string, token?: string): Promise<T> =>
  loomGetJson<T>("catalog-api", path, token);

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
  const payload = await catalogGet<unknown>(path, token);
  return extractFirstArray<T>(payload);
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
