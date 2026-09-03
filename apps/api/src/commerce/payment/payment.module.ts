import { Logger, Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { PaymentController } from "./controller/payment.controller.js";
import { RazorpayPaymentService } from "./service/razorpay-payment.service.js";
import { StripePaymentService } from "./service/stripe-payment.service.js";
import { RazorpayTransactionRepository, StripeTransactionRepository } from "./repository/payment.repository.js";
import { ORDER_SERVICE, EMAIL_SERVICE, WHATSAPP_SERVICE, CART_SERVICE } from "./ports/payment.ports.js";

import { DATABASE_CONNECTION } from "../../database/database.module.js";
import * as schema from "../../database/schema/schema.js";
import { and, eq } from "drizzle-orm";

const portLogger = new Logger("PaymentPorts");

/**
 * Payment-path ports. None of these may swallow an error: a silent failure here
 * used to be indistinguishable from "order not found", which is what let an
 * unresolvable order fall through to a hardcoded default (audit C5/M6).
 */
const realOrderServiceFactory = (db: any) => ({
  getOrderById: async (id: bigint) => {
    const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, BigInt(id))).limit(1);
    const order = rows[0];
    if (!order) return null;

    const items = await db.select().from(schema.orderItem).where(eq(schema.orderItem.orderId, Number(id)));
    const tenantRows = await db
      .select()
      .from(schema.loomTenant)
      .where(eq(schema.loomTenant.id, order.tenantId))
      .limit(1);

    return { ...order, orderItems: items, tenant: tenantRows[0] ?? null };
  },
  // Mirrors Loom's OrderService.isAnyPaymentDue: a payment is due while any item
  // is still PENDING or PREPAID.
  isAnyPaymentDue: (order: any) =>
    (order?.orderItems ?? []).some(
      (item: any) => item.paymentStatus === "PENDING" || item.paymentStatus === "PREPAID",
    ),
  // Order status lives on order_item in this schema; there is no orders.status column.
  updateOrderStatusToProcessing: async (orderId: bigint) => {
    const updated = await db
      .update(schema.orderItem)
      .set({ orderStatus: "PROCESSING", paymentStatus: "PAID", updatedAt: Date.now() })
      .where(eq(schema.orderItem.orderId, Number(orderId)))
      .returning();
    return updated.length > 0;
  },
  updatePreOrderPaymentStatusToPaid: async (orderId: bigint) => {
    const updated = await db
      .update(schema.orderItem)
      .set({ paymentStatus: "PAID", updatedAt: Date.now() })
      .where(and(eq(schema.orderItem.orderId, Number(orderId)), eq(schema.orderItem.orderType, "PRE_ORDER")))
      .returning();
    return updated.length > 0;
  },
  updateOrderStatusToFailed: async (orderId: bigint, failureCode: number) => {
    portLogger.warn(`Order ${orderId} marked failed with payment failure code ${failureCode}`);
    await db
      .update(schema.orders)
      .set({ failedErrorCode: failureCode })
      .where(eq(schema.orders.id, BigInt(orderId)));
    const updated = await db
      .update(schema.orderItem)
      .set({ orderStatus: "FAILED", paymentStatus: "FAILED", updatedAt: Date.now() })
      .where(eq(schema.orderItem.orderId, Number(orderId)))
      .returning();
    return updated.length > 0;
  },
  updateOrderCheckoutUrlStripe: async (orderId: bigint, url: string) => {
    const updated = await db
      .update(schema.orders)
      .set({ stripeCheckoutUrl: url })
      .where(eq(schema.orders.id, BigInt(orderId)))
      .returning();
    return updated.length > 0;
  },
});

const realCartServiceFactory = (db: any) => ({
  deleteAllCartItem: async (tenant: any) => {
    const tenantId = tenant?.id ?? tenant;
    if (!tenantId) return;
    await db.delete(schema.cartItem).where(eq(schema.cartItem.tenantId, Number(tenantId)));
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
