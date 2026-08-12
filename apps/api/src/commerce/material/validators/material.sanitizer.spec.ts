import { describe, it, expect } from "vitest";
import { sanitizeMaterialName } from "./material.sanitizer.js";

describe("sanitizeMaterialName", () => {
  it("trims surrounding whitespace", () => {
    expect(sanitizeMaterialName("  Cotton  ")).toBe("Cotton");
  });

  it("escapes < and > (only, not other HTML-significant characters like & or \")", () => {
    expect(sanitizeMaterialName('<b>Bold</b> & "quoted"')).toBe('&lt;b&gt;Bold&lt;/b&gt; & "quoted"');
  });
});
