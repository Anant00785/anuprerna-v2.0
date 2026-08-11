import { describe, it, expect } from "vitest";
import { sanitizePatternName } from "./pattern.sanitizer.js";

describe("sanitizePatternName", () => {
  it("trims and escapes angle brackets", () => {
    expect(sanitizePatternName("  <b>Stripe</b>  ")).toBe("&lt;b&gt;Stripe&lt;/b&gt;");
  });

  it("leaves an already-clean name unchanged", () => {
    expect(sanitizePatternName("Paisley")).toBe("Paisley");
  });
});
