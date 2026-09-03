import { describe, it, expect, vi, type Mock } from "vitest";
import { ReviewService } from "./review.service.js";
import type { ReviewRepository } from "../repository/review.repository.js";

/**
 * Regression guard for the review cascade: findProductReviews used to pad the
 * result up to `size` from the sub-category, then the category, then fabric,
 * then generic, then every approved review site-wide — so a product with one
 * review answered with 100, and a product that does not exist answered with
 * 100 as well. A product's reviews must be that product's reviews.
 */
describe("ReviewService.findProductReviews", () => {
  const ownReviews = [
    { id: 1, productId: 42, rating: 5 },
    { id: 2, productId: 42, rating: 4 },
  ];

  function build(overrides: Partial<Record<string, unknown>> = {}) {
    const repo = {
      findProductReviews: vi.fn(async () => ownReviews),
      findApprovedReviews: vi.fn(async () => [{ id: 99, productId: 7 }]),
      findStatistics: vi.fn(async () => ({ count: 296, rating: 5 })),
      ...overrides,
    } as unknown as ReviewRepository;
    return { repo, service: new ReviewService(repo) };
  }

  it("returns only the product's own reviews", async () => {
    const { service } = build();
    const result = await service.findProductReviews(42, 0, 100);
    expect(result).toEqual(ownReviews);
    expect(result.every((r) => r?.productId === 42)).toBe(true);
  });

  it("does not pad a short page up to `size`", async () => {
    const { service } = build();
    const result = await service.findProductReviews(42, 0, 100);
    expect(result).toHaveLength(2);
  });

  it("returns an empty list for a product with no reviews — never a site-wide fallback", async () => {
    const { repo, service } = build({ findProductReviews: vi.fn(async () => []) });
    await expect(service.findProductReviews(999999, 0, 100)).resolves.toEqual([]);
    expect((repo as unknown as { findApprovedReviews: Mock }).findApprovedReviews).not.toHaveBeenCalled();
  });

  it("never reaches for sub-category / category / fabric / generic reviews", async () => {
    const cascade = {
      findReviewsBySubCategory: vi.fn(),
      findReviewsByCategory: vi.fn(),
      findFabricReviews: vi.fn(),
      findGenericReviews: vi.fn(),
      isProductFinished: vi.fn(),
    };
    const { service } = build({ findProductReviews: vi.fn(async () => []), ...cascade });
    await service.findProductReviews(42, 0, 100);
    for (const fn of Object.values(cascade)) expect(fn).not.toHaveBeenCalled();
  });

  it("passes paging straight through", async () => {
    const { repo, service } = build();
    await service.findProductReviews(42, 2, 20);
    expect(repo.findProductReviews).toHaveBeenCalledWith(42, 2, 20);
  });
});

describe("ReviewService.findStatistics", () => {
  const repo = {
    findStatistics: vi.fn(async (productId?: number) =>
      productId === undefined ? { count: 296, rating: 5 } : { count: 12, rating: 5 },
    ),
  } as unknown as ReviewRepository;
  const service = new ReviewService(repo);

  it("scopes to a product when one is given", async () => {
    await expect(service.findStatistics(324086)).resolves.toEqual({ count: 12, rating: 5 });
    expect(repo.findStatistics).toHaveBeenCalledWith(324086);
  });

  it("stays site-wide when no product is given", async () => {
    (repo.findStatistics as unknown as Mock).mockClear();
    await expect(service.findStatistics()).resolves.toEqual({ count: 296, rating: 5 });
    expect(repo.findStatistics).toHaveBeenCalledWith();
  });

  it("zeroes out an id that cannot address a row rather than falling back to the global figure", async () => {
    await expect(service.findStatistics(null)).resolves.toEqual({ count: 0, rating: 0 });
  });
});
