import { describe, it, expect } from "vitest";
import { validateReview, validateReviewStatus } from "./review.validator.js";

// No documented contract for this module (docs/backend/commerce/02-api-documentation.md
// has no Review section) — characterization per docs/TESTING.md §4 "Everything else".

const valid = { rating: 5, name: "Jane", country: "IN" };

describe("validateReview", () => {
  it("accepts a minimal valid input", () => {
    expect(validateReview(valid)).toBeNull();
  });

  it("rejects rating out of range (0)", () => {
    expect(validateReview({ ...valid, rating: 0 })).toMatch(/Rating/);
  });

  it("rejects rating out of range (6)", () => {
    expect(validateReview({ ...valid, rating: 6 })).toMatch(/Rating/);
  });

  it("accepts rating boundary values 1 and 5", () => {
    expect(validateReview({ ...valid, rating: 1 })).toBeNull();
    expect(validateReview({ ...valid, rating: 5 })).toBeNull();
  });

  it("rejects a missing name", () => {
    expect(validateReview({ ...valid, name: "" })).toMatch(/Name/);
  });

  it("rejects a name over 255 chars", () => {
    expect(validateReview({ ...valid, name: "a".repeat(256) })).toMatch(/Name/);
  });

  it("rejects a missing country", () => {
    expect(validateReview({ ...valid, country: "" })).toMatch(/Country/);
  });

  it("rejects a description over 5000 chars", () => {
    expect(validateReview({ ...valid, description: "a".repeat(5001) })).toMatch(/Description/);
  });
});

describe("validateReviewStatus", () => {
  it("accepts a documented status", () => {
    expect(validateReviewStatus({ status: "APPROVED" })).toBeNull();
  });

  it("rejects an undocumented status", () => {
    expect(validateReviewStatus({ status: "BOGUS" })).toBe("Invalid review status.");
  });
});
