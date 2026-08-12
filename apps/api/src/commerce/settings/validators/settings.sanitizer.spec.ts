import { describe, it, expect } from "vitest";
import { sanitizeUpdateSettingsRequest } from "./settings.sanitizer.js";

// This sanitizer is currently a no-op that returns the request unchanged (no trimming/escaping
// of attributeValue/attributeLink). Pinning current behavior per docs/TESTING.md §5 — not a bug
// to "fix" here.
describe("sanitizeUpdateSettingsRequest", () => {
  it("returns the request object unchanged", () => {
    const request = { id: 1n, attributeValue: "  <b>x</b>  ", attributeLink: "/x" };
    expect(sanitizeUpdateSettingsRequest(request)).toBe(request);
  });
});
