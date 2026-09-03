import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ReviewService } from "../service/review.service.js";
import { CreateReviewDto, UpdateCustomerReviewDto, UpdateSuperUserReviewDto, parseReviewInput } from "../dto/review.dto.js";
import { validateReview, validateReviewStatus } from "../validators/review.validator.js";
import { sanitizeReview, sanitizeReviewStatus } from "../validators/review.sanitizer.js";

@ApiBearerAuth()
@ApiTags("Review")
@Controller()
@UseGuards(RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get("/get/review/stats")
  @ApiOperation({ summary: "Get aggregated review statistics and ratings distribution." })
  @ApiResponse({ status: 200, description: "Review statistics." })
  async retrieveReviewStats() {
    const stats = await this.reviewService.findStatistics();
    return keyedResponse("statistics", stats);
  }

  @Get("/get/review/:reviewId")
  @ApiOperation({ summary: "Get review details by review ID." })
  @ApiParam({ name: "reviewId", type: Number, description: "Review unique identifier", example: 1 })
  @ApiResponse({ status: 200, description: "Review details." })
  async retrieveReview(@Param("reviewId") reviewId: string) {
    const review = await this.reviewService.findById(BigInt(reviewId));
    return keyedResponse("review", review);
  }

  @Get("/get/customer/review")
  async retrieveAllReviewsForCustomer(
    @Query("pageNumber") pageNumber = "0",
    @Query("pageSize") pageSize = "100"
  ) {
    const reviews = await this.reviewService.findApprovedReviews(parseInt(pageNumber), parseInt(pageSize));
    return keyedResponse("reviewList", reviews);
  }

  @Get("/get/product/review/:productId")
  @ApiOperation({ summary: "Get approved reviews for a specific product." })
  @ApiParam({ name: "productId", type: Number, description: "Product identifier", example: 94504 })
  @ApiQuery({ name: "pageNumber", required: false, type: Number, example: 0, description: "Page number" })
  @ApiQuery({ name: "pageSize", required: false, type: Number, example: 100, description: "Page size" })
  @ApiResponse({ status: 200, description: "List of product reviews." })
  async retrieveProductReviewsForCustomer(
    @Param("productId") productId: string,
    @Query("pageNumber") pageNumber = "0",
    @Query("pageSize") pageSize = "100"
  ) {
    try {
      const pId = parseInt(productId, 10) || 0;
      const page = parseInt(pageNumber, 10) || 0;
      const size = parseInt(pageSize, 10) || 100;
      const reviews = await this.reviewService.findProductReviews(pId, page, size);
      return keyedResponse("reviewList", reviews || []);
    } catch (err) {
      console.error("[retrieveProductReviewsForCustomer error]:", err);
      return keyedResponse("reviewList", []);
    }
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
    @Query("page") page: string = "0",
    @Query("size") size: string = "20"
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
  @ApiOperation({ summary: "Submit a new customer review." })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: "Review successfully created." })
  async addReview(@Body() rawBody: CreateReviewDto) {
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
  @ApiOperation({ summary: "Update customer review by author." })
  @ApiBody({ type: UpdateCustomerReviewDto })
  @ApiResponse({ status: 200, description: "Customer review successfully updated." })
  async updateReviewCustomer(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() rawBody: UpdateCustomerReviewDto
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
  @ApiOperation({ summary: "Update review status by super user (e.g. APPROVED, REJECTED)." })
  @ApiBody({ type: UpdateSuperUserReviewDto })
  @ApiResponse({ status: 200, description: "Review status successfully updated." })
  async updateReviewSuperUser(@Body() rawBody: UpdateSuperUserReviewDto) {
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
