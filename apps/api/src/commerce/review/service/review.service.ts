import { Injectable } from "@nestjs/common";
import { ReviewRepository } from "../repository/review.repository.js";
import { ReviewInput } from "../dto/review.dto.js";

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async findById(id: bigint) {
    return this.reviewRepository.findById(id);
  }

  /** Global statistics, or — with a productId — that product's own. */
  async findStatistics(productId?: number | null) {
    if (productId === undefined) return this.reviewRepository.findStatistics();
    if (productId === null) return { count: 0, rating: 0 };
    return this.reviewRepository.findStatistics(productId);
  }

  async findApprovedReviews(page: number, size: number) {
    return this.reviewRepository.findApprovedReviews(page, size);
  }

  async findReviewsByStatus(status: "PENDING" | "APPROVED" | "REMOVED", page: number, size: number) {
    return this.reviewRepository.findReviewsByStatus(status, page, size);
  }

  /**
   * A product's OWN approved reviews — nothing else.
   *
   * This used to run a five-stage cascade that padded the result up to
   * `size` (default 100) with reviews of other products in the same
   * sub-category, then the same category, then any fabric product, then
   * "generic" reviews, and finally — if all of that produced nothing — the
   * newest approved reviews site-wide. Measured on real data: product
   * 162853313 returned 100 reviews spanning 95 distinct products and none of
   * its own, and the nonexistent product 999999 returned the same 100. Every
   * PDP was presenting other products' reviews as its own, so the cascade is
   * gone rather than moved behind a second response key: none of those
   * reviews is about this product, and the "generic" (product_id IS NULL)
   * bucket that could honestly be labelled is empty in production (0 of 296
   * approved rows).
   */
  async findProductReviews(productId: number, page: number, size: number) {
    return this.reviewRepository.findProductReviews(productId, page, size);
  }

  async findPaginated(page: number, size: number) {
    return this.reviewRepository.findPaginated(page, size);
  }

  async addReview(review: ReviewInput) {
    return this.reviewRepository.insert(review);
  }

  async updateReviewCustomer(review: ReviewInput, tenantId: number) {
    if (!review.id) return false;
    
    const existing = await this.reviewRepository.findById(BigInt(review.id));
    if (!existing) return false;
    
    return this.reviewRepository.updateCustomer(BigInt(review.id), review);
  }

  async updateReviewSuperUser(review: ReviewInput) {
    if (!review.id) return false;
    
    const existing = await this.reviewRepository.findById(BigInt(review.id));
    if (!existing) return false;
    
    return this.reviewRepository.updateSuperUser(BigInt(review.id), review);
  }
}
