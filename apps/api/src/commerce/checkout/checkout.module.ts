import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { PaymentModule } from "../payment/payment.module.js";
import { ShipmentModule } from "../shipment/shipment.module.js";
import { ForexModule } from "../forex/forex.module.js";
import { CheckoutController } from "./controller/checkout.controller.js";
import { CheckoutService } from "./service/checkout.service.js";
import { CheckoutRepository } from "./repository/checkout.repository.js";

/**
 * The /checkout/* lane: order creation with server-side money, guest identity,
 * and payment session/callback wiring onto the EXISTING payment services.
 */
@Module({
  imports: [AuthModule, PaymentModule, ShipmentModule, ForexModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutRepository],
  exports: [CheckoutService],
})
export class CheckoutModule {}
