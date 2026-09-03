import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ReviewController } from "./controller/review.controller.js";
import { ReviewService } from "./service/review.service.js";
import { ReviewRepository, ORDER_ITEM_PORT, type OrderItemPort } from "./repository/review.repository.js";
import { eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import * as schema from "../../database/schema/schema.js";

@Module({
  imports: [AuthModule],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewRepository,
    {
      /**
       * Real `order_item` writes — the previous mock silently dropped the
       * review<->order_item link, so a submitted review never marked its
       * order item as reviewed and the storefront kept re-prompting.
       */
      provide: ORDER_ITEM_PORT,
      useFactory: (db: Database): OrderItemPort => ({
        updateReviewId: async (orderItemId, reviewId) => {
          await db
            .update(schema.orderItem)
            .set({ reviewId: Number(reviewId) })
            .where(eq(schema.orderItem.id, BigInt(orderItemId)));
        },
        getOrderId: async (orderItemId) => {
          const rows = await db
            .select({ orderId: schema.orderItem.orderId })
            .from(schema.orderItem)
            .where(eq(schema.orderItem.id, BigInt(orderItemId)))
            .limit(1);
          return rows[0]?.orderId ?? null;
        },
      }),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
