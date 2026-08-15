// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { PaymentController } from "./controller/payment.controller.js";
import { RazorpayPaymentService } from "./service/razorpay-payment.service.js";
import { StripePaymentService } from "./service/stripe-payment.service.js";
import { RazorpayTransactionRepository, StripeTransactionRepository } from "./repository/payment.repository.js";
import { ORDER_SERVICE, EMAIL_SERVICE, WHATSAPP_SERVICE, CART_SERVICE } from "./ports/payment.ports.js";

const mockOrderServicePort = {
  getOrderById: async () => null,
  isAnyPaymentDue: () => false,
  updateOrderStatusToProcessing: async () => true,
  updatePreOrderPaymentStatusToPaid: async () => true,
  updateOrderStatusToFailed: async () => true,
  updateOrderCheckoutUrlStripe: async () => true,
};

const mockEmailServicePort = {
  sendOrderConfirmationEmail: async () => {},
  sendPreOrderConfirmationEmail: async () => {},
  sendOrderCancelNotification: async () => {},
};

const mockWhatsappServicePort = {
  orderConfirmationNotification: async () => {},
  orderCancelledNotification: async () => {},
};

const mockCartServicePort = {
  deleteAllCartItem: async () => {},
};

@Module({
  imports: [AuthModule],
  controllers: [PaymentController],
  providers: [
    RazorpayPaymentService,
    StripePaymentService,
    RazorpayTransactionRepository,
    StripeTransactionRepository,
    { provide: ORDER_SERVICE, useValue: mockOrderServicePort },
    { provide: EMAIL_SERVICE, useValue: mockEmailServicePort },
    { provide: WHATSAPP_SERVICE, useValue: mockWhatsappServicePort },
    { provide: CART_SERVICE, useValue: mockCartServicePort },
  ],
  exports: [RazorpayPaymentService, StripePaymentService, RazorpayTransactionRepository, StripeTransactionRepository],
})
export class PaymentModule {}
