// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { PaymentController } from "./controller/payment.controller.js";
import { RazorpayPaymentService } from "./service/razorpay-payment.service.js";
import { StripePaymentService } from "./service/stripe-payment.service.js";
import { RazorpayTransactionRepository, StripeTransactionRepository } from "./repository/payment.repository.js";
import { ORDER_SERVICE, EMAIL_SERVICE, WHATSAPP_SERVICE, CART_SERVICE } from "./ports/payment.ports.js";

import { DATABASE_CONNECTION } from "../../database/database.module.js";
import * as schema from "../../database/schema/schema.js";
import { eq } from "drizzle-orm";

const realOrderServiceFactory = (db: any) => ({
  getOrderById: async (id: bigint) => {
    try {
      const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, BigInt(id))).limit(1);
      return rows[0] || null;
    } catch {
      return null;
    }
  },
  isAnyPaymentDue: () => false,
  updateOrderStatusToProcessing: async (orderId: bigint) => {
    try {
      await db.update(schema.orders).set({ deleted: false }).where(eq(schema.orders.id, BigInt(orderId)));
      return true;
    } catch {
      return false;
    }
  },
  updatePreOrderPaymentStatusToPaid: async () => true,
  updateOrderStatusToFailed: async () => true,
  updateOrderCheckoutUrlStripe: async () => true,
});

const realCartServiceFactory = (db: any) => ({
  deleteAllCartItem: async (tenantId: number) => {
    try {
      await db.delete(schema.cartItem).where(eq(schema.cartItem.tenantId, BigInt(tenantId)));
    } catch {}
  },
});

const mockEmailServicePort = {
  sendOrderConfirmationEmail: async () => {},
  sendPreOrderConfirmationEmail: async () => {},
  sendOrderCancelNotification: async () => {},
};

const mockWhatsappServicePort = {
  orderConfirmationNotification: async () => {},
  orderCancelledNotification: async () => {},
};

@Module({
  imports: [AuthModule],
  controllers: [PaymentController],
  providers: [
    RazorpayPaymentService,
    StripePaymentService,
    RazorpayTransactionRepository,
    StripeTransactionRepository,
    {
      provide: ORDER_SERVICE,
      useFactory: realOrderServiceFactory,
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: CART_SERVICE,
      useFactory: realCartServiceFactory,
      inject: [DATABASE_CONNECTION],
    },
    { provide: EMAIL_SERVICE, useValue: mockEmailServicePort },
    { provide: WHATSAPP_SERVICE, useValue: mockWhatsappServicePort },
  ],
  exports: [RazorpayPaymentService, StripePaymentService, RazorpayTransactionRepository, StripeTransactionRepository],
})
export class PaymentModule {}
