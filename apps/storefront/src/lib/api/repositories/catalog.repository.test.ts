import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { catalogRepository } from "./catalog.repository";
import { useHandlers, PROXY_BASE, envelope } from "@/test/msw";
import { env } from "@/env";

// catalogRepository has zero importers anywhere in apps/storefront outside
// the dead `lib/api/index.ts` barrel (see report) — tested anyway since it's
// the designed Path-A catalog flow per docs/DATA-FLOW.md §1.

const originalMode = env.NEXT_PUBLIC_API_MODE;
// NEXT_PUBLIC_API_MODE now defaults to "nest" (src/env.ts). The "(legacy)"
// suites below used to inherit the old "legacy" default, so they silently
// started exercising the nest branch and their MSW handlers stopped matching.
// State the mode instead of inheriting it; the nest suite sets its own.
beforeEach(() => {
  env.NEXT_PUBLIC_API_MODE = "legacy";
});
afterEach(() => {
  env.NEXT_PUBLIC_API_MODE = originalMode;
});

describe("catalogRepository.getNavigation (legacy)", () => {
  it("fetches /get/navigation and maps the payload envelope to HeaderNavigation", async () => {
    let capturedUrl: string | undefined;
    useHandlers(
      http.get(`${PROXY_BASE}/get/navigation`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(envelope("payload", { navigationList: [{ id: 1, title: "Fabrics" }] }));
      })
    );
    const nav = await catalogRepository.getNavigation();
    expect(capturedUrl).toBe(`${PROXY_BASE}/get/navigation`);
    expect(nav.mainCategories).toHaveLength(1);
  });

  it("swallows a fetch failure and falls back to an empty navigation model", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/navigation`, () => HttpResponse.json({ success: false }, { status: 500 }))
    );
    const nav = await catalogRepository.getNavigation();
    expect(nav.mainCategories).toEqual([]);
  });
});

describe("catalogRepository.getFabricProducts (legacy)", () => {
  it("POSTs pagination/filter params to /get/fabric-preview-list and maps the product list", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post(`${PROXY_BASE}/get/fabric-preview-list`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          envelope("payload", { content: [{ id: 1, productName: "A" }], totalElements: 1 })
        );
      })
    );
    const result = await catalogRepository.getFabricProducts({ page: 2, limit: 12, search: "silk" });
    expect(capturedBody).toMatchObject({ pageNo: 1, pageSize: 12, search: "silk" }); // page is 1-indexed -> pageNo 0-indexed
    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
  });

  it("returns an empty product list with totalPages 1 when content is empty", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/get/fabric-preview-list`, () =>
        HttpResponse.json(envelope("payload", { content: [], totalElements: 0 }))
      )
    );
    const result = await catalogRepository.getFabricProducts();
    expect(result.products).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1); // Math.ceil(0/12) || 1
  });

  it("swallows a fetch failure and returns an empty result with totalPages 0", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/get/fabric-preview-list`, () =>
        HttpResponse.json({ success: false }, { status: 401 })
      )
    );
    const result = await catalogRepository.getFabricProducts();
    expect(result.products).toEqual([]);
    expect(result.totalPages).toBe(0);
  });
});

describe("catalogRepository.getProductBySlug (legacy)", () => {
  it("GETs /get/fabric-product/slug/:slug (URL-encoded) and maps to ProductDetail", async () => {
    let capturedUrl: string | undefined;
    useHandlers(
      http.get(`${PROXY_BASE}/get/fabric-product/slug/silk%20saree`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(envelope("payload", { id: 1, productName: "Silk Saree" }));
      })
    );
    const product = await catalogRepository.getProductBySlug("silk saree");
    expect(capturedUrl).toBe(`${PROXY_BASE}/get/fabric-product/slug/silk%20saree`);
    expect(product?.name).toBe("Silk Saree");
  });

  it("returns null (not a throw) when the product fetch fails", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/fabric-product/slug/missing`, () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );
    await expect(catalogRepository.getProductBySlug("missing")).resolves.toBeNull();
  });
});

describe("catalogRepository.getFabricProducts (nest)", () => {
  it("GETs /v1/products with page/limit/search/category/sortBy as query params", async () => {
    env.NEXT_PUBLIC_API_MODE = "nest";
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get(`${PROXY_BASE}/v1/products`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ statusCode: 200, message: "", data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 1 } });
      })
    );
    await catalogRepository.getFabricProducts({ page: 1, limit: 12, search: "linen", categorySlug: "fabric" });
    expect(capturedUrl?.searchParams.get("search")).toBe("linen");
    expect(capturedUrl?.searchParams.get("category")).toBe("fabric");
    expect(capturedUrl?.searchParams.get("page")).toBe("1");
  });
});
