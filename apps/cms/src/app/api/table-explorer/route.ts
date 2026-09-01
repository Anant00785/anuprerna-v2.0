import { NextRequest, NextResponse } from "next/server";
import { getSandboxToken } from "@/lib/sandbox-token";
import { getLiveLoomToken } from "@/lib/loom-service-token";
import { rewriteBloomscorpUrlsDeep } from "@/lib/media";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";

const PAYLOAD_KEY_EXCEPTIONS: Record<string, string> = {
  "catalog-pdf": "catalogPdfGenerationList",
  "log": "loomLogList",
  "orders": "orderList",
  "product-fabric": "fabricProductDataList",
  "purchase-order-feedback": "orderFeedbackList",
  "inventory-restock-request": "inventoryReStockRequestList",
  "product-image-gallery-seo": "productImageGallerySEOList",
  "subprocess-element": "subProcessElementList",
  "subprocess-element-artisan-mapping": "subProcessElementArtisanMappingList",
  "subprocess-element-template": "subProcessElementTemplateList",
};

function toCamel(name: string): string {
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function getExpectedKey(tableName: string): string {
  if (PAYLOAD_KEY_EXCEPTIONS[tableName]) return PAYLOAD_KEY_EXCEPTIONS[tableName];
  return toCamel(tableName) + "List";
}

/**
 * Table-name translation — table param ("table") comes verbatim from
 * getTableSummaries()'s tableName field, which is the RAW sandbox Postgres
 * table name (snake_case, usually plural: "artisans", "cron_logs",
 * "fabric_products"). The backend's /get/table-explorer/data/{slug} route
 * vocabulary is a curated, mostly-singular, hyphenated ENTITY slug set
 * ("artisan", "cron-job-log", "product-fabric") that does not literally
 * match most raw table names.
 *
 * Fixed 2026-07-06: the old code passed tableName straight through, so almost
 * every non-single-word table 404'd regardless of auth — a naming mismatch
 * distinct from (and compounding) the wrong-token-scheme bug below. Empirical
 * fix: try the raw name first (covers any exact/future match), then a small
 * curated exception map for names the mechanical heuristic gets wrong, then a
 * mechanical hyphenate + naive-singularize heuristic (covers ~65 of the 99
 * tables on its own). First candidate that returns 200 wins.
 */
const SLUG_EXCEPTIONS: Record<string, string> = {
  blogs: "blog-content",
  blog_categories: "blog-content-category",
  blog_types: "blog-content-type",
  stories: "story-content",
  story_categories: "story-content-category",
  warehouses: "warehouse",
  cron_logs: "cron-job-log",
  catalog_pdf_download_history: "catalog-pdf",
  fabric_products: "product-fabric",
  finished_products: "product-finished",
  feedback: "purchase-order-feedback",
  order_feedback: "purchase-order-feedback",
  artisan_skills: "artisan-skill-mapping",
};

function singularize(s: string): string {
  if (s.endsWith("ies")) return s.slice(0, -3) + "y";
  if (s.endsWith("ses")) return s.slice(0, -2);
  if (s.endsWith("s") && !s.endsWith("ss")) return s.slice(0, -1);
  return s;
}

function candidateSlugs(rawTable: string): string[] {
  const cands = [rawTable];
  if (SLUG_EXCEPTIONS[rawTable]) cands.push(SLUG_EXCEPTIONS[rawTable]);
  const hyphenated = rawTable.replace(/_/g, "-");
  if (!cands.includes(hyphenated)) cands.push(hyphenated);
  const singular = singularize(hyphenated);
  if (!cands.includes(singular)) cands.push(singular);
  const parts = hyphenated.split("-");
  if (parts.length > 1) {
    const lastSingular = [...parts.slice(0, -1), singularize(parts[parts.length - 1])].join("-");
    if (!cands.includes(lastSingular)) cands.push(lastSingular);
  }
  return cands;
}

/**
 * Fetch a table-explorer page for one candidate slug, discovering the
 * correct auth scheme by trying rather than duplicating the backend's
 * native-table allowlist.
 *
 * Fixed 2026-07-06 (regrade blocker: hard-401 'credentials tampered'):
 * auth.matrix.ts's gateTier() decides per-table whether a route is
 * "sandbox-token" (served natively from our own pg — wants the exact
 * SANDBOX_ADMIN_TOKEN) or "bearer-required" (PROXIED straight through to
 * live Loom, which validates its own JWT and rejects the sandbox token as
 * tampered). The old code hardcoded a 4-item NATIVE_TABLES allowlist that
 * predates the 2026-07-04/07-06 native-table migrations, and everything
 * else fell through to fetchWithServiceToken()'s SANDBOX_ADMIN_TOKEN being
 * sent to what was actually a bearer-required/proxied route.
 *
 * Rather than hand-mirror the ~90-entry native list here (guaranteed to
 * drift as the backend lane adds native tables), try the sandbox token
 * first (works for every native table, present and future); if the backend
 * answers 401 — meaning this slug is proxied to live Loom — retry once with
 * a genuine live-signed JWT. GET-only, so the retry is safe.
 */
async function fetchOneSlug(slug: string, page: number, size: number): Promise<Response> {
  const url = `${BACKEND}/get/table-explorer/data/${encodeURIComponent(slug)}?page=${page}&size=${size}`;
  const sandboxToken = getSandboxToken();
  const nativeHeaders: Record<string, string> = { "Content-Type": "application/json", Origin: "localhost" };
  if (sandboxToken) nativeHeaders["Authorization"] = `Bearer ${sandboxToken}`;

  let res = await fetch(url, { headers: nativeHeaders, cache: "no-store" });
  if (res.status === 401) {
    const liveToken = await getLiveLoomToken();
    if (liveToken) {
      res = await fetch(url, {
        headers: { "Content-Type": "application/json", Origin: "localhost", Authorization: `Bearer ${liveToken}` },
        cache: "no-store",
      });
    }
  }
  return res;
}

/** Try each candidate slug for rawTable until one succeeds; return the last response otherwise. */
async function fetchTableData(rawTable: string, page: number, size: number): Promise<{ res: Response; slug: string }> {
  const candidates = candidateSlugs(rawTable);
  let last: { res: Response; slug: string } | null = null;
  for (const slug of candidates) {
    const res = await fetchOneSlug(slug, page, size);
    if (res.ok) return { res, slug };
    last = { res, slug };
  }
  return last as { res: Response; slug: string };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const size = parseInt(searchParams.get("size") ?? "50", 10);

  if (!table) {
    return NextResponse.json({ error: "Missing table parameter" }, { status: 400 });
  }

  try {
    const { res, slug } = await fetchTableData(table, page, size);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Backend ${res.status}: ${text.slice(0, 120)}` },
        { status: res.status },
      );
    }

    const json = rewriteBloomscorpUrlsDeep(await res.json()) as Record<string, unknown>;

    const expectedKey = getExpectedKey(slug);
    if (Array.isArray(json[expectedKey])) {
      const rows = json[expectedKey] as unknown[];
      return NextResponse.json({ rows, total: json.total ?? rows.length });
    }

    const metaKeys = new Set(["total", "page", "size", "message", "status", "error"]);
    for (const [k, v] of Object.entries(json)) {
      if (!metaKeys.has(k) && Array.isArray(v)) {
        return NextResponse.json({ rows: v, total: json.total ?? v.length });
      }
    }

    return NextResponse.json({ rows: [], total: 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
