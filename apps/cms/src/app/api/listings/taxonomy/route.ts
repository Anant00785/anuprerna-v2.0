/**
 * GET /api/listings/taxonomy
 *
 * Thin proxy exposing the existing catalog-api.ts reference-data fetchers
 * (categories/segments/sub-categories/sku-groups/special-statuses) to the
 * client-side /listings filter panel. Segments carry their parent category
 * ref and sub-categories carry their parent category+segment refs, which is
 * what lets the filter panel cascade (category -> segment -> sub-category).
 * Read-only; in-process cache since this reference data changes rarely.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCategoryList,
  getSegmentList,
  getSubCategoryList,
  getSkuGroupList,
  getSpecialStatusList,
} from "@/lib/catalog-api";
import type {
  CatalogCategory,
  CatalogSegment,
  CatalogSubCategory,
  CatalogSimpleItem,
} from "@/types/catalog";

export const dynamic = "force-dynamic";

const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const TTL_MS = 60_000;

interface Body {
  categories: CatalogCategory[];
  segments: CatalogSegment[];
  subCategories: CatalogSubCategory[];
  skuGroups: CatalogSimpleItem[];
  specialStatuses: CatalogSimpleItem[];
}

let cache: { expiresAt: number; body: Body } | null = null;

export async function GET() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return NextResponse.json(cache.body);

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;

  const [categories, segments, subCategories, skuGroups, specialStatuses] =
    await Promise.all([
      getCategoryList(token),
      getSegmentList(token),
      getSubCategoryList(token),
      getSkuGroupList(token),
      getSpecialStatusList(token),
    ]);

  const body: Body = { categories, segments, subCategories, skuGroups, specialStatuses };
  cache = { expiresAt: now + TTL_MS, body };
  return NextResponse.json(body);
}
