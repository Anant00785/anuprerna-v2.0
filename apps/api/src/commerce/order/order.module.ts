// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CustomOrderController } from "./controller/custom-order.controller.js";
import { OrderFeedbackController } from "./controller/order-feedback.controller.js";
import { OrderFulfillmentController } from "./controller/order-fulfillment.controller.js";
import { OrderController } from "./controller/order.controller.js";
import { OrderService } from "./service/order.service.js";
import { OrderRepository } from "./repository/order.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [CustomOrderController, OrderFeedbackController, OrderFulfillmentController, OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
