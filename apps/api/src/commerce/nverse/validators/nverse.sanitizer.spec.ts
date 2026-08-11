import { describe, it, expect } from "vitest";
import { sanitizeEmail, sanitizeContactNumber } from "./nverse.sanitizer.js";

describe("sanitizeEmail", () => {
  it("trims and lowercases", () => {
    expect(sanitizeEmail("  Foo@Example.COM  ")).toBe("foo@example.com");
  });

  it("returns undefined for an undefined/empty input", () => {
    expect(sanitizeEmail(undefined)).toBeUndefined();
    expect(sanitizeEmail("")).toBeUndefined();
  });
});

describe("sanitizeContactNumber", () => {
  it("strips non-digit characters", () => {
    expect(sanitizeContactNumber("+91 (987) 654-3210")).toBe("919876543210");
  });

  it("returns undefined for an undefined/empty input", () => {
    expect(sanitizeContactNumber(undefined)).toBeUndefined();
    expect(sanitizeContactNumber("")).toBeUndefined();
  });
});
