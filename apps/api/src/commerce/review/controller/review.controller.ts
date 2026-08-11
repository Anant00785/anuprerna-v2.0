// @ts-nocheck
import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../common/response/rain-response.js";
import { ReviewService } from "../service/review.service.js";
import { parseReviewInput } from "../dto/review.dto.js";
import { validateReview, validateReviewStatus } from "../validators/review.validator.js";
import { sanitizeReview, sanitizeReviewStatus } from "../validators/review.sanitizer.js";

@Controller()
@UseGuards(RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get("/get/review/stats")
  async retrieveReviewStats() {
    const stats = await this.reviewService.findStatistics();
    return keyedResponse("statistics", stats);
  }

  @Get("/get/review/:reviewId")
  async retrieveReview(@Param("reviewId") reviewId: string) {
    const review = await this.reviewService.findById(BigInt(reviewId));
    return keyedResponse("review", review);
  }

  @Get("/get/customer/review")
  @RequireGate(GateCode.CODE_CU)
  async retrieveAllReviewsForCustomer(
    @Query("pageNumber") pageNumber = "0",
    @Query("pageSize") pageSize = "100"
  ) {
    const reviews = await this.reviewService.findApprovedReviews(parseInt(pageNumber), parseInt(pageSize));
    return keyedResponse("reviewList", reviews);
  }

  @Get("/get/product/review/:productId")
  async retrieveProductReviewsForCustomer(
    @Param("productId") productId: string,
    @Query("pageNumber") pageNumber = "0",
    @Query("pageSize") pageSize = "100"
  ) {
    const reviews = await this.reviewService.findProductReviews(parseInt(productId), parseInt(pageNumber), parseInt(pageSize));
    return keyedResponse("reviewList", reviews);
  }

  @Get("/get/super-user/review")
  @RequireGate(GateCode.CODE_SU)
  async retrieveAllReviewsForSuperUser(
    @Query("status") status = "APPROVED",
    @Query("pageNumber") pageNumber = "0",
    @Query("pageSize") pageSize = "100"
  ) {
    const reviews = await this.reviewService.findReviewsByStatus(status as any, parseInt(pageNumber), parseInt(pageSize));
    return keyedResponse("reviewList", reviews);
  }

  @Get("/get/table-explorer/data/review")
  @RequireGate(GateCode.CODE_SU)
  async getReviewData(
    @Query("page") page: string,
    @Query("size") size: string
  ) {
    const reviews = await this.reviewService.findPaginated(parseInt(page), parseInt(size));
    return keyedResponse("reviewList", reviews);
  }

  @Get("/get/table-explorer/data/review/:id")
  @RequireGate(GateCode.CODE_SU)
  async getReviewById(@Param("id") id: string) {
    const review = await this.reviewService.findById(BigInt(id));
    return keyedResponse("review", review);
  }

  @Post("/add/review")
  @RequireGate(GateCode.CODE_SUCU)
  async addReview(@Body() rawBody: unknown) {
    const input = parseReviewInput(rawBody);
    const sanitized = sanitizeReview(input);
    const validationError = validateReview(sanitized);
    
    if (validationError) {
      return simpleResponse(false, validationError);
    }
    
    const result = await this.reviewService.addReview(sanitized);
    return simpleResponse(!!result, result ? "Review created successfully." : "Failed to create review.");
  }

  @Patch("/update/customer/review")
  @RequireGate(GateCode.CODE_CU)
  async updateReviewCustomer(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() rawBody: unknown
  ) {
    const input = parseReviewInput(rawBody);
    const sanitized = sanitizeReview(input);
    const validationError = validateReview(sanitized);
    
    if (validationError) {
      return simpleResponse(false, validationError);
    }
    
    const result = await this.reviewService.updateReviewCustomer(sanitized, Number(tenant.id));
    return simpleResponse(result, result ? "Review updated successfully." : "Failed to update review or unauthorized.");
  }

  @Patch("/update/super-user/review")
  @RequireGate(GateCode.CODE_SU)
  async updateReviewSuperUser(@Body() rawBody: unknown) {
    const input = parseReviewInput(rawBody);
    const sanitized = sanitizeReviewStatus(sanitizeReview(input));
    const statusError = validateReviewStatus(sanitized);
    
    if (statusError) {
      return simpleResponse(false, statusError);
    }
    
    const result = await this.reviewService.updateReviewSuperUser(sanitized);
    return simpleResponse(result, result ? "Review updated successfully." : "Failed to update review.");
  }
}
// @ts-nocheck
