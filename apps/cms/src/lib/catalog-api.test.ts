import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { getCategoryList } from "./catalog-api";

describe("catalog-api", () => {
  it("returns the parsed list on a valid envelope", async () => {
    useHandlers(
      http.get("*/get/category-list", () =>
        HttpResponse.json(envelope("categoryList", [{ id: 1, name: "Sarees" }])),
      ),
    );

    await expect(getCategoryList("tok")).resolves.toEqual([{ id: 1, name: "Sarees" }]);
  });

  it("rejects with the backend's message on {success:false} at HTTP 200", async () => {
    useHandlers(
      http.get("*/get/category-list", () => HttpResponse.json(errorEnvelope("catalog list unavailable"))),
    );

    // The regression: this used to resolve to [] and render an empty table.
    await expect(getCategoryList("tok")).rejects.toThrow("catalog list unavailable");
  });

  it("rejects on a 500", async () => {
    useHandlers(http.get("*/get/category-list", () => new HttpResponse(null, { status: 500 })));

    await expect(getCategoryList("tok")).rejects.toThrow(/500/);
  });
});
