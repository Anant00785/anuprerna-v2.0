import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  sanitizeAddSizeProfileInput,
  sanitizeAddBadgeProfileInput,
  sanitizeUpdateCustomerProfileInput,
} from "./profile.sanitizer.js";

describe("sanitizeString", () => {
  it("trims a value", () => {
    expect(sanitizeString("  a  ")).toBe("a");
  });

  it("passes undefined through unchanged", () => {
    expect(sanitizeString(undefined)).toBeUndefined();
  });
});

describe("sanitizeAddSizeProfileInput", () => {
  it("trims profileName/displayName/disclaimer, leaves other fields untouched", () => {
    const out = sanitizeAddSizeProfileInput({ profileName: " P ", displayName: " D ", disclaimer: " X ", options: [] });
    expect(out.profileName).toBe("P");
    expect(out.displayName).toBe("D");
    expect(out.disclaimer).toBe("X");
    expect(out.options).toEqual([]);
  });
});

describe("sanitizeAddBadgeProfileInput", () => {
  it("trims name only", () => {
    expect(sanitizeAddBadgeProfileInput({ name: " Badge ", items: [] }).name).toBe("Badge");
  });
});

describe("sanitizeUpdateCustomerProfileInput", () => {
  it("trims name and phone when present", () => {
    const out = sanitizeUpdateCustomerProfileInput({ name: " N ", phone: " P " });
    expect(out).toEqual({ name: "N", phone: "P" });
  });
});
