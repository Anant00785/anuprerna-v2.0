// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ReviewController } from "./controller/review.controller.js";
import { ReviewService } from "./service/review.service.js";
import { ReviewRepository, ORDER_ITEM_PORT } from "./repository/review.repository.js";

const mockOrderItemPort = {
  updateReviewId: async () => {},
  getOrderId: async () => null,
};

@Module({
  imports: [AuthModule],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewRepository,
    { provide: ORDER_ITEM_PORT, useValue: mockOrderItemPort },
  ],
  exports: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
