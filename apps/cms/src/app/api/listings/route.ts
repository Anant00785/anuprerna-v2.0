/**
 * GET /api/listings
 *
 * Cached proxy to the paginated native wrapper endpoint
 * (/get/listings/preview). Forwards pageNumber/pageSize/search plus the
 * productType + status filters, and returns { rows, total } where each row is
 * already a lean ListingRow. Read-only; 20s in-process cache.
 *
 * Taxonomy filters (category/segment/subCategory/skuGroup/specialStatus) are
 * optional positive-integer ids; each is forwarded ONLY when present (an
 * unset/"all" selection omits the param entirely rather than sending 0/"" —
 * that's what the backend treats as "no filter on this dimension").
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { ListingRow } from "@/lib/types";
import { rewriteBloomscorpUrlsDeep } from "@/lib/media";

export const dynamic = "force-dynamic";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const TTL_MS = 20_000;

interface Entry {
  expiresAt: number;
  body: { rows: ListingRow[]; total: number };
}
const cache = new Map<string, Entry>();

/** Forward a positive-integer id param as-is; ignore missing/0/blank. */
function taxonomyParam(sp: URLSearchParams, key: string): string | null {
  const v = sp.get(key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? String(n) : null;
}

interface RawItem {
  id: number;
  name?: string;
  sku?: string;
  price?: number | string;
  quantity?: number | string;
  totalQuantity?: number | string;
  heroImage?: string;
  productGroup?: string;
  disabled?: boolean;
  mainProductCheck?: boolean;
  category?: { id?: number; name?: string } | string;
  subCategory?: {
    id?: number;
    name?: string;
    segment?: {
      id?: number;
      name?: string;
      category?: { id?: number; name?: string };
    };
  };
  segment?: { id?: number; name?: string; category?: { id?: number; name?: string } };
  skuGroup?: { id?: number; name?: string };
  specialStatus?: { id?: number; name?: string };
}

function normalizeLoomProduct(item: RawItem): ListingRow {
  const subCat =
    typeof item.subCategory === "object" ? item.subCategory?.name || "" : "";
  const seg =
    (typeof item.subCategory === "object" && item.subCategory?.segment?.name) ||
    (typeof item.segment === "object" && item.segment?.name) ||
    "";
  const cat =
    (typeof item.subCategory === "object" &&
      item.subCategory?.segment?.category?.name) ||
    (typeof item.segment === "object" && item.segment?.category?.name) ||
    (typeof item.category === "object" ? item.category?.name || "" : item.category || "");

  const disabled = item.disabled === true;
  const mainProductCheck = item.mainProductCheck === true;
  let status: ListingStatus = "DRAFT";
  if (disabled) status = "INACTIVE";
  else if (mainProductCheck) status = "ACTIVE";

  return {
    id: item.id,
    productId: item.id,
    name: item.name || "",
    sku: item.sku || "",
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0,
    totalQuantity: Number(item.totalQuantity) || 0,
    heroImage: item.heroImage || "",
    category: cat,
    subCategory: subCat || seg || cat,
    status: status,
    productType: item.productGroup === "finished" ? "finished" : "fabric",
  };
}

let allProductsCache: { expiresAt: number; items: RawItem[] } | null = null;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const pageNumber = sp.get("pageNumber") ?? "0";
  const pageSize = sp.get("pageSize") ?? "50";
  const search = sp.get("search") ?? "";
  const productType = sp.get("productType") ?? "all";
  const status = sp.get("status") ?? "all";
  const returnDisabledProducts = sp.get("returnDisabledProducts") ?? "true";
  const category = taxonomyParam(sp, "category");
  const segment = taxonomyParam(sp, "segment");
  const subCategory = taxonomyParam(sp, "subCategory");
  const skuGroup = taxonomyParam(sp, "skuGroup");
  const specialStatus = taxonomyParam(sp, "specialStatus");

  const now = Date.now();
  for (const [k, v] of cache) if (v.expiresAt <= now) cache.delete(k); // sweep expired
  const key = `listings|${pageNumber}|${pageSize}|${search}|${productType}|${status}|${category ?? ""}|${segment ?? ""}|${subCategory ?? ""}|${skuGroup ?? ""}|${specialStatus ?? ""}|${returnDisabledProducts}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return NextResponse.json(hit.body);

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  const headers: Record<string, string> = { "Content-Type": "application/json", Origin: "localhost" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // 1. Try paginated endpoint
  let url =
    `${BACKEND}/get/listings/preview?pageNumber=${encodeURIComponent(pageNumber)}` +
    `&pageSize=${encodeURIComponent(pageSize)}&search=${encodeURIComponent(search)}` +
    `&productType=${encodeURIComponent(productType)}&status=${encodeURIComponent(status)}`;
  if (category) url += `&category=${category}`;
  if (segment) url += `&segment=${segment}`;
  if (subCategory) url += `&subCategory=${subCategory}`;
  if (skuGroup) url += `&skuGroup=${skuGroup}`;
  if (specialStatus) url += `&specialStatus=${specialStatus}`;
  url += `&returnDisabledProducts=${encodeURIComponent(returnDisabledProducts)}`;

  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (res.ok) {
      const j = rewriteBloomscorpUrlsDeep(await res.json()) as {
        productPreviewList?: ListingRow[];
        total?: number;
      };
      if (j.productPreviewList && j.productPreviewList.length > 0) {
        const body = { rows: j.productPreviewList ?? [], total: j.total ?? 0 };
        cache.set(key, { expiresAt: Date.now() + TTL_MS, body });
        return NextResponse.json(body);
      }
    }
  } catch {
    // Upstream unreachable, fallback below
  }

  // 2. Fallback to full preview list from Loom/Backend
  let allRaw: RawItem[] = [];
  if (!allProductsCache || allProductsCache.expiresAt <= Date.now()) {
    const previewUrls = [
      `https://loom-v2.anuprerna.com/get/product-preview-list/all`,
      `${BACKEND}/get/product-preview-list/all`,
    ];
    for (const pUrl of previewUrls) {
      try {
        const pRes = await fetch(pUrl, { headers, cache: "no-store" });
        if (pRes.ok) {
          const pJson = rewriteBloomscorpUrlsDeep(await pRes.json()) as Record<string, unknown>;
          const list =
            (pJson.productPreviewList as RawItem[] | undefined) ??
            (pJson.data as RawItem[] | undefined) ??
            [];
          if (Array.isArray(list) && list.length > 0) {
            allRaw = list;
            allProductsCache = { expiresAt: Date.now() + 60_000, items: list };
            break;
          }
        }
      } catch {
        // Next fallback
      }
    }
  } else {
    allRaw = allProductsCache.items;
  }

  if (allRaw.length > 0) {
    let filtered = allRaw.map(normalizeLoomProduct);

    if (productType !== "all") {
      filtered = filtered.filter((r) => r.productType === productType);
    }
    if (status !== "all") {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.subCategory.toLowerCase().includes(q),
      );
    }

    const page = Math.max(0, Number(pageNumber));
    const size = Math.max(1, Number(pageSize));
    const start = page * size;
    const pageRows = filtered.slice(start, start + size);

    const body = { rows: pageRows, total: filtered.length };
    cache.set(key, { expiresAt: Date.now() + TTL_MS, body });
    return NextResponse.json(body);
  }

  return NextResponse.json({ rows: [], total: 0 });
}
