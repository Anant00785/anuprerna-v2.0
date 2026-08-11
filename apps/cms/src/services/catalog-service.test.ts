import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { CatalogService } from "./catalog-service";

describe("CatalogService", () => {
  it("getCatalogListByArtisan hits the correct path-param URL and unwraps 'catalogList'", async () => {
    useHandlers(
      http.get("*/get/catalog-list/artisan/:id", ({ params }) => {
        expect(params.id).toBe("42");
        return HttpResponse.json(envelope("catalogList", [{ id: 1, name: "Handwoven" }]));
      })
    );
    const result = await CatalogService.getCatalogListByArtisan(42);
    expect(result).toEqual([{ id: 1, name: "Handwoven" }]);
  });

  it("getCatalogById unwraps the singular 'catalog' key", async () => {
    useHandlers(
      http.get("*/get/catalog/7", () => HttpResponse.json(envelope("catalog", { id: 7, name: "Silk" })))
    );
    const result = await CatalogService.getCatalogById(7);
    expect(result).toEqual({ id: 7, name: "Silk" });
  });

  it("propagates a rejected backend response as a thrown error", async () => {
    useHandlers(
      http.get("*/get/catalog-list", () => HttpResponse.json(errorEnvelope("catalog list unavailable")))
    );
    await expect(CatalogService.getCatalogList()).rejects.toThrow("catalog list unavailable");
  });

  it("generateCatalogPdfByArtisan POSTs to the artisan-scoped endpoint and unwraps the generation record", async () => {
    let sawBody: unknown;
    useHandlers(
      http.post("*/add/catalog-pdf-generation/artisan/9", async ({ request }) => {
        sawBody = await request.json();
        return HttpResponse.json(envelope("catalogPdfGeneration", { id: 3, status: "PENDING", artisanId: 9 }));
      })
    );
    const result = await CatalogService.generateCatalogPdfByArtisan(9);
    expect(sawBody).toEqual({});
    expect(result).toEqual({ id: 3, status: "PENDING", artisanId: 9 });
  });
});
