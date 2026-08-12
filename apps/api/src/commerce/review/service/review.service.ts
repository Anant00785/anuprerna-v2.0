// @ts-nocheck
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
    let results: any[] = [];
    
    const productReviews = await this.reviewRepository.findProductReviews(productId, page, size);
    results = [...productReviews];
    
    if (results.length < size) {
        const subCategoryReviews = await this.reviewRepository.findReviewsBySubCategory(productId, page, size - results.length);
        results = [...results, ...subCategoryReviews];
    }
    
    if (results.length < size) {
        const categoryReviews = await this.reviewRepository.findReviewsByCategory(productId, page, size - results.length);
        results = [...results, ...categoryReviews];
    }
    
    if (results.length < size) {
        const isFinished = await this.reviewRepository.isProductFinished(productId);
        if (isFinished) {
            const fabricReviews = await this.reviewRepository.findFabricReviews(page, size - results.length);
            results = [...results, ...fabricReviews];
        }
    }
    
    if (results.length < size) {
        const genericReviews = await this.reviewRepository.findGenericReviews(page, size - results.length);
        results = [...results, ...genericReviews];
    }
    
    return results;
  }

  async findPaginated(page: number, size: number) {
    return this.reviewRepository.findPaginated(page, size);
  }

  async addReview(review: ReviewInput) {
    return this.reviewRepository.insert(review);
  }

  async updateReviewCustomer(review: ReviewInput, tenantId: number) {
    if (!review.id) return false;
    
    const existing = await this.reviewRepository.findById(review.id);
    if (!existing || existing.adminAdded) return false;
    
    // Explicit check for review ownership per prompt requirement
    const isOwner = await this.reviewRepository.checkOwnership(review.id, tenantId);
    if (!isOwner) return false;
    
    return this.reviewRepository.updateCustomer(review.id, review);
  }

  async updateReviewSuperUser(review: ReviewInput) {
    if (!review.id) return false;
    
    const existing = await this.reviewRepository.findById(review.id);
    if (!existing) return false;
    
    return this.reviewRepository.updateSuperUser(review.id, review);
  }
}
// @ts-nocheck
