import { Injectable } from "@nestjs/common";
import { ReviewRepository } from "../repository/review.repository.js";
import { ReviewInput } from "../dto/review.dto.js";

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async findById(id: bigint) {
    return this.reviewRepository.findById(id);
  }

  async findStatistics() {
    return this.reviewRepository.findStatistics();
  }

  async findApprovedReviews(page: number, size: number) {
    return this.reviewRepository.findApprovedReviews(page, size);
  }

  async findReviewsByStatus(status: "PENDING" | "APPROVED" | "REMOVED", page: number, size: number) {
    return this.reviewRepository.findReviewsByStatus(status, page, size);
  }

  async findProductReviews(productId: number, page: number, size: number) {
    try {
      let results: any[] = [];
      
      const productReviews = await this.reviewRepository.findProductReviews(productId, page, size);
      if (Array.isArray(productReviews)) {
        results = [...productReviews];
      }
      
      if (results.length < size) {
        const subCategoryReviews = await this.reviewRepository.findReviewsBySubCategory(productId, page, size - results.length);
        if (Array.isArray(subCategoryReviews)) {
          results = [...results, ...subCategoryReviews];
        }
      }
      
      if (results.length < size) {
        const categoryReviews = await this.reviewRepository.findReviewsByCategory(productId, page, size - results.length);
        if (Array.isArray(categoryReviews)) {
          results = [...results, ...categoryReviews];
        }
      }
      
      if (results.length < size) {
        const isFinished = await this.reviewRepository.isProductFinished(productId);
        if (isFinished) {
          const fabricReviews = await this.reviewRepository.findFabricReviews(page, size - results.length);
          if (Array.isArray(fabricReviews)) {
            results = [...results, ...fabricReviews];
          }
        }
      }
      
      if (results.length < size) {
        const genericReviews = await this.reviewRepository.findGenericReviews(page, size - results.length);
        if (Array.isArray(genericReviews)) {
          results = [...results, ...genericReviews];
        }
      }
      
      if (results.length === 0) {
        const fallbackReviews = await this.reviewRepository.findApprovedReviews(page, size);
        if (Array.isArray(fallbackReviews)) {
          results = fallbackReviews;
        }
      }
      
      return results;
    } catch (err) {
      console.error("[findProductReviews error]:", err);
      return [];
    }
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
