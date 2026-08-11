import { describe, it, expect } from "vitest";
import { sanitize, sanitizeCartItem } from "./cart-item.sanitizer.js";
import { CartItemInput } from "../types/cart.types.js";

describe("sanitize (NVerseSanitizer#sanitize port)", () => {
  it("strips null bytes (stage 1: canonicalization)", () => {
    expect(sanitize("hello\0world")).toBe("helloworld");
  });

  it("strips <script> tags (stage 2: XSS stripping)", () => {
    expect(sanitize('before<script>alert("x")</script>after')).toBe("beforeafter");
  });

  it("strips <iframe> tags", () => {
    expect(sanitize('<iframe src="evil.com"></iframe>rest')).toBe("rest");
  });

  it("strips src= attributes, leaving the (now-empty) attribute slot", () => {
    expect(sanitize('<img src="evil.com/x.png">')).toBe("<img >");
  });

  it("strips eval(...) and expression(...) calls", () => {
    expect(sanitize("x = eval(maliciousCode)")).toBe("x = ");
    expect(sanitize("width: expression(1)")).toBe("width: ");
  });

  it("strips javascript: and vbscript: pseudo-protocols", () => {
    expect(sanitize('javascript:alert(1)')).toBe("alert(1)");
    expect(sanitize('vbscript:msgbox(1)')).toBe("msgbox(1)");
  });

  it("strips onload= handlers; the resulting bare <body> tag is then dropped entirely since body is outside the stage-3 allowlist", () => {
    expect(sanitize('<body onload="doEvil()">')).toBe("");
  });

  it("keeps allowlisted formatting tags but strips tags outside the allowlist (stage 3 substitute)", () => {
    expect(sanitize("<b>bold</b>")).toBe("<b>bold</b>");
    expect(sanitize("<object data=\"x\">bad</object>")).toBe("bad");
  });
});

describe("sanitizeCartItem", () => {
  function input(overrides: Partial<CartItemInput> = {}): CartItemInput {
    return {
      selectedFinishId: "1,2",
      customSize: {},
      productGroup: "fabric",
      orderType: "IN_STOCK",
      quantity: 1,
      unit: "METER",
      ...overrides,
    };
  }

  it("sanitizes each declared string field (selectedFinishId, productGroup, click/utm fields)", () => {
    const dirty = input({
      selectedFinishId: "1\0,2",
      productGroup: "<script>alert(1)</script>fabric",
      clickId: "click<script>x</script>",
      utmSource: "google<iframe></iframe>",
    });
    const result = sanitizeCartItem(dirty);
    expect(result.selectedFinishId).toBe("1,2");
    expect(result.productGroup).toBe("fabric");
    expect(result.clickId).toBe("click");
    expect(result.utmSource).toBe("google");
  });

  it("does not touch orderType/unit (enums, not strings) or customSize (JSONB, undefined shape) — matches reflection targeting only String fields", () => {
    const dirty = input({ orderType: "IN_STOCK", unit: "METER", customSize: { evil: "<script>x</script>" } });
    const result = sanitizeCartItem(dirty);
    expect(result.orderType).toBe("IN_STOCK");
    expect(result.unit).toBe("METER");
    expect(result.customSize).toEqual({ evil: "<script>x</script>" });
  });

  it("leaves non-string values on declared fields untouched (e.g. clickId absent/null)", () => {
    const result = sanitizeCartItem(input({ clickId: null, clickIdType: undefined }));
    expect(result.clickId).toBeNull();
    expect(result.clickIdType).toBeUndefined();
  });
});
