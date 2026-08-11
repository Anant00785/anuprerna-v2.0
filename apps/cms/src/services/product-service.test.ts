import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { ProductService } from "./product-service";

describe("ProductService", () => {
  it("getColors hits '/get/color-list' and unwraps 'colorList'", async () => {
    useHandlers(
      http.get("*/get/color-list", () => HttpResponse.json(envelope("colorList", [{ id: 1, name: "Indigo", hex: "#3f51b5" }])))
    );
    const result = await ProductService.getColors();
    expect(result).toEqual([{ id: 1, name: "Indigo", hex: "#3f51b5" }]);
  });

  it("getSegments returns [] when the response is not an array (defensive fallback)", async () => {
    useHandlers(
      http.get("*/get/segment-list", () => HttpResponse.json({ success: true, message: "", segmentList: { not: "an array" } }))
    );
    const result = await ProductService.getSegments();
    expect(result).toEqual([]);
  });

  it("propagates an error-envelope rejection from the backend", async () => {
    useHandlers(
      http.get("*/get/category-list", () => HttpResponse.json(errorEnvelope("categories unavailable")))
    );
    await expect(ProductService.getCategories()).rejects.toThrow("categories unavailable");
  });

  it("createColor trims name/hex and POSTs the expected payload shape", async () => {
    let sawBody: unknown;
    useHandlers(
      http.post("*/add/color", async ({ request }) => {
        sawBody = await request.json();
        return HttpResponse.json({ success: true, message: "created" });
      })
    );
    await ProductService.createColor("  Maroon  ", " #800000 ");
    expect(sawBody).toEqual({ name: "Maroon", hex: "#800000" });
  });

  it("getFinishedProducts falls back to '/get/product-preview-list' when the primary endpoint fails", async () => {
    useHandlers(
      http.get("*/get/finished-preview-list", () => new HttpResponse(null, { status: 500 })),
      http.get("*/get/product-preview-list", () => HttpResponse.json(envelope("productPreviewList", [{ id: 5 }])))
    );
    const result = await ProductService.getFinishedProducts();
    expect(result).toEqual([{ id: 5 }]);
  });
});
