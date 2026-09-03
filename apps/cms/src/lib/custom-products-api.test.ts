/**
 * custom-products-api.ts is the last of the eight *-api.ts modules, and the
 * only one that mixes both error conventions in one file: the LIST returns a
 * Result envelope, the DETAIL throws. Both are pinned here, because a caller
 * that assumes the wrong one either renders a rejection as "no products" or
 * crashes a page that expected null.
 *
 * `normalize` is also the place a missing/garbage numeric field becomes 0
 * rather than NaN — a NaN price renders as "₹NaN" on the catalogue screen.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import {
  CUSTOM_PRODUCT_GROUPS,
  CUSTOM_PRODUCT_UNITS,
  getCustomProductById,
  getCustomProductList,
  groupLabel,
  splitMedia,
} from "./custom-products-api";

const LIST = "*/get/custom-product";
const DETAIL = "*/get/custom-product/:id";

afterEach(() => vi.restoreAllMocks());

describe("getCustomProductList", () => {
  it("normalizes a row, coercing absent numerics to 0 rather than NaN", async () => {
    useHandlers(
      http.get(LIST, () =>
        HttpResponse.json(
          envelope("customProductList", [
            { id: "12", name: "Ikat Fabric", sku: "IK-1", productGroup: "fabric" },
          ]),
        ),
      ),
    );

    const res = await getCustomProductList();

    expect(res.ok).toBe(true);
    expect(res.ok && res.data[0]).toEqual({
      id: 12,
      name: "Ikat Fabric",
      sku: "IK-1",
      price: 0,
      productGroup: "fabric",
      unit: "",
      remarks: "",
      heroImage: "",
      additionalImages: "",
      additionalDocs: "",
      createdAt: undefined,
      updatedAt: undefined,
      version: undefined,
    });
  });

  it("keeps a non-numeric price at 0 instead of letting NaN reach the screen", async () => {
    useHandlers(
      http.get(LIST, () =>
        HttpResponse.json(envelope("customProductList", [{ id: 1, price: "not a number" }])),
      ),
    );

    const res = await getCustomProductList();

    expect(res.ok && res.data[0].price).toBe(0);
  });

  it("preserves the difference between an absent timestamp and a zero one", async () => {
    useHandlers(
      http.get(LIST, () =>
        HttpResponse.json(envelope("customProductList", [{ id: 1, createdAt: 0 }])),
      ),
    );

    const res = await getCustomProductList();

    expect(res.ok && res.data[0].createdAt).toBe(0);
    expect(res.ok && res.data[0].updatedAt).toBeUndefined();
  });

  it("returns ok:false with the backend's message on a rejection, not an empty catalogue", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get(LIST, () => HttpResponse.json(errorEnvelope("custom products offline"))));

    const res = await getCustomProductList();

    expect(res).toMatchObject({ ok: false });
    expect(res.ok === false && res.error).toContain("custom products offline");
  });

  it("returns ok:false on a 401 — a token mismatch must not read as an empty catalogue", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get(LIST, () => new HttpResponse(null, { status: 401 })));

    expect((await getCustomProductList()).ok).toBe(false);
  });

  it("returns ok:true with [] when the list key is missing entirely", async () => {
    useHandlers(http.get(LIST, () => HttpResponse.json({ success: true, message: "" })));

    expect(await getCustomProductList()).toEqual({ ok: true, data: [] });
  });
});

describe("getCustomProductById", () => {
  it("returns the normalized product", async () => {
    useHandlers(
      http.get(DETAIL, () =>
        HttpResponse.json({
          success: true,
          message: "",
          customProduct: { id: 9, name: "Stole", price: 2400 },
        }),
      ),
    );

    await expect(getCustomProductById(9)).resolves.toMatchObject({ id: 9, price: 2400 });
  });

  it("returns null for a 200 that carries no product — genuinely not found", async () => {
    useHandlers(http.get(DETAIL, () => HttpResponse.json({ success: true, message: "" })));

    await expect(getCustomProductById(404)).resolves.toBeNull();
  });

  it("THROWS on a backend failure, unlike the list — the detail page must banner, not 404", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    useHandlers(http.get(DETAIL, () => new HttpResponse(null, { status: 500 })));

    await expect(getCustomProductById(9)).rejects.toMatchObject({ kind: "server" });
  });
});

describe("pure helpers", () => {
  it("pins the two canonical groups and units so the sandbox never invents a third", () => {
    expect([...CUSTOM_PRODUCT_GROUPS]).toEqual(["fabric", "finished"]);
    expect([...CUSTOM_PRODUCT_UNITS]).toEqual(["METER", "UNIT"]);
  });

  it("labels a known group and falls back to an em dash for an empty one", () => {
    expect(groupLabel("fabric")).toBe("Fabric");
    expect(groupLabel("finished")).toBe("Finished");
    expect(groupLabel("")).toBe("—");
    // An unknown group is shown verbatim rather than hidden.
    expect(groupLabel("sample")).toBe("sample");
  });

  it("splits the live CSV media field, dropping blanks and surrounding whitespace", () => {
    expect(splitMedia(" a.jpg , ,b.jpg,")).toEqual(["a.jpg", "b.jpg"]);
    expect(splitMedia("")).toEqual([]);
  });
});
