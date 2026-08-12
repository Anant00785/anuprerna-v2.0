import { describe, it, expect } from "vitest";
import { validateSearchTerm } from "./search.validator.js";

describe("validateSearchTerm", () => {
  it("accepts a normal search term", () => {
    expect(validateSearchTerm("silk saree")).toBeNull();
  });

  it("rejects a non-string term", () => {
    expect(validateSearchTerm(123 as unknown as string)).toMatch(/must be a string/);
  });

  it("rejects an empty (post-trim) term", () => {
    expect(validateSearchTerm("   ")).toMatch(/cannot be empty/);
  });

  it("rejects a term at/over the 300-char boundary", () => {
    expect(validateSearchTerm("a".repeat(300))).toMatch(/less than 300/);
  });

  it("accepts a term just under the 300-char boundary", () => {
    expect(validateSearchTerm("a".repeat(299))).toBeNull();
  });
});
