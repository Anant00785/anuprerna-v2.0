import { describe, it, expect } from "vitest";
import { sanitizeProductImageGallerySEOPayload } from "./seo.sanitizer.js";

describe("sanitizeProductImageGallerySEOPayload", () => {
  it("trims image and HTML-escapes altText for every list item", () => {
    const out = sanitizeProductImageGallerySEOPayload({
      productId: 1n,
      gallerySEOList: [{ id: 1n, version: 1n, productId: 1n, image: "  a.jpg  ", altText: "<b>alt</b>", deleted: false }],
    });
    expect(out.gallerySEOList[0].image).toBe("a.jpg");
    expect(out.gallerySEOList[0].altText).toBe("&lt;b&gt;alt&lt;/b&gt;");
  });

  it("defaults missing image/altText to empty strings", () => {
    const out = sanitizeProductImageGallerySEOPayload({
      productId: 1n,
      gallerySEOList: [{ id: 1n, version: 1n, productId: 1n, image: "", altText: "", deleted: false }],
    });
    expect(out.gallerySEOList[0].image).toBe("");
    expect(out.gallerySEOList[0].altText).toBe("");
  });
});
