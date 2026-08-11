import { describe, it, expect } from "vitest";
import { mapReviewRowToData } from "./review.mapper.js";
import { ReviewStatus } from "../types/review.types.js";

describe("mapReviewRowToData", () => {
  it("maps a full row, converting ids to bigint and rating to number", () => {
    const row = {
      id: 1, tenantId: 2, productId: 3, rating: "5", headline: "H", comment: "C",
      status: "APPROVED", createdAt: 1700000000000,
    };
    const out = mapReviewRowToData(row);
    expect(out.id).toBe(1n);
    expect(out.tenantId).toBe(2n);
    expect(out.productId).toBe(3n);
    expect(out.rating).toBe(5);
    expect(out.status).toBe(ReviewStatus.APPROVED);
    expect(out.createdAt).toBe(1700000000000);
  });

  it("defaults headline/comment to empty string and status to PENDING when missing", () => {
    const out = mapReviewRowToData({ id: 1, tenantId: 1, productId: 1, rating: 4 });
    expect(out.headline).toBe("");
    expect(out.comment).toBe("");
    expect(out.status).toBe(ReviewStatus.PENDING);
  });

  it("falls back createdAt to now() when missing", () => {
    const before = Date.now();
    const out = mapReviewRowToData({ id: 1, tenantId: 1, productId: 1, rating: 4 });
    expect(out.createdAt).toBeGreaterThanOrEqual(before);
  });
});
