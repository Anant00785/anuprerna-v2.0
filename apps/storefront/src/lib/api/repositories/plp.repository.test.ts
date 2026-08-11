import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { plpRepository } from "./plp.repository";
import { useHandlers } from "@/test/msw";

// plpRepository calls the storefront's own /api/plp Next.js route handler
// directly with plain fetch (Path A does not apply — see docs/DATA-FLOW.md
// §1, "the two undocumented data paths"). That route already unwraps the
// legacy envelope server-side, so the JSON this repository consumes is the
// flat { products, colors, materials, patterns } shape the route emits, not
// the raw legacy envelope.
const ORIGIN = "http://localhost:3000";

describe("plpRepository.getPLPData", () => {
  it("requests /api/plp with group and category query params and returns the parsed data", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get(`${ORIGIN}/api/plp`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({
          products: [{ id: 1 }],
          colors: [{ id: 1, name: "Red" }],
          materials: [],
          patterns: [],
        });
      })
    );
    const data = await plpRepository.getPLPData("fabric", "cotton");
    expect(capturedUrl?.searchParams.get("group")).toBe("fabric");
    expect(capturedUrl?.searchParams.get("category")).toBe("cotton");
    expect(data.products).toEqual([{ id: 1 }]);
    expect(data.colors).toEqual([{ id: 1, name: "Red" }]);
  });

  it("defaults every field to an empty array when the route returns nothing for a key", async () => {
    useHandlers(http.get(`${ORIGIN}/api/plp`, () => HttpResponse.json({})));
    const data = await plpRepository.getPLPData("fabric");
    expect(data).toEqual({ products: [], colors: [], materials: [], patterns: [] });
  });

  it("swallows a non-OK response and returns the empty-data shape rather than throwing", async () => {
    useHandlers(http.get(`${ORIGIN}/api/plp`, () => HttpResponse.json({}, { status: 500 })));
    await expect(plpRepository.getPLPData("fabric")).resolves.toEqual({
      products: [],
      colors: [],
      materials: [],
      patterns: [],
    });
  });
});

describe("plpRepository.getRelatedProducts", () => {
  it("requests /api/plp/related?ids=... and unwraps relatedProductsList", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get(`${ORIGIN}/api/plp/related`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ relatedProductsList: [{ id: 5, products: [] }] });
      })
    );
    const related = await plpRepository.getRelatedProducts("1,2,3");
    expect(capturedUrl?.searchParams.get("ids")).toBe("1,2,3");
    expect(related).toEqual([{ id: 5, products: [] }]);
  });

  it("short-circuits to an empty array without any network call when ids is empty", async () => {
    // No handler registered — if this reached the network, onUnhandledRequest
    // "error" would fail the test, proving the short-circuit actually happens.
    await expect(plpRepository.getRelatedProducts("")).resolves.toEqual([]);
  });
});

describe("plpRepository.getFilterSegments", () => {
  it("requests /api/plp/segments?category=... and unwraps segmentList", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get(`${ORIGIN}/api/plp/segments`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ segmentList: [{ name: "Sarees" }] });
      })
    );
    const segments = await plpRepository.getFilterSegments("clothing");
    expect(capturedUrl?.searchParams.get("category")).toBe("clothing");
    expect(segments).toEqual([{ name: "Sarees" }]);
  });

  it("returns an empty array on a non-OK response instead of throwing", async () => {
    useHandlers(http.get(`${ORIGIN}/api/plp/segments`, () => HttpResponse.json({}, { status: 500 })));
    await expect(plpRepository.getFilterSegments("clothing")).resolves.toEqual([]);
  });
});
