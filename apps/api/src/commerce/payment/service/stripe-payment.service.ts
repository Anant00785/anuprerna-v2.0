import { Injectable, Inject, Logger } from "@nestjs/common";
import { StripeTransactionRepository } from "../repository/payment.repository.js";
import { StripePaymentOrderInput } from "../dto/payment.dto.js";
import {
  TransactionStatus,
  TransactionFailureCode,
  OrderFailureCode,
} from "../types/payment.types.js";
import {
  ORDER_SERVICE,
  OrderServicePort,
  EMAIL_SERVICE,
  EmailServicePort,
  WHATSAPP_SERVICE,
  WhatsappServicePort,
  CART_SERVICE,
  CartServicePort,
} from "../ports/payment.ports.js";

/**
 * Stripe payments, ported from Loom's StripeTransactionDAOController.
 *
 * The webhook handlers below are only ever reached from
 * PaymentController#checkoutStripeWebhook, which verifies the Stripe signature
 * over the raw request body first. They additionally require the session to
 * match a transaction row this API itself created — an unknown session is an
 * unauthorized update, not a new PAID row.
 */
@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name);

  constructor(
    private readonly repository: StripeTransactionRepository,
    @Inject(ORDER_SERVICE) private readonly orderService: OrderServicePort,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailServicePort,
    @Inject(WHATSAPP_SERVICE) private readonly whatsappService: WhatsappServicePort,
    @Inject(CART_SERVICE) private readonly cartService: CartServicePort,
  ) {}

  async createSession(tenant: any, request: StripePaymentOrderInput) {
    const orderId = BigInt(request.loomOrderId);

    const order = await this.orderService.getOrderById(orderId);
    if (!order) throw new Error("Irrelevant payment session create request");

    if (!this.orderService.isAnyPaymentDue(order)) {
      throw new Error("No payment due for this order");
    }

    let session: { id: string; paymentIntent: string; url: string; amountTotal: number; currency: string };
    try {
      session = await this.createCheckoutSession(orderId, request);
    } catch (error) {
      this.logger.error(`Stripe checkout session creation failed for order ${orderId}`, error as Error);
      await this.orderService.updateOrderStatusToFailed(orderId, OrderFailureCode.PAYMENT_SESSION_CREATE_FAILURE);
      throw new Error("Payment session creation error");
    }

    const created = await this.repository.create({
      stripeSessionId: session.id,
      stripePaymentIntentId: session.paymentIntent,
      loomOrderId: Number(orderId),
      amount: (session.amountTotal / 100).toString(),
      paymentType: request.paymentType,
      currency: session.currency,
      checkoutUrl: session.url,
      status: TransactionStatus.CREATED,
      failedErrorCode: -1,
      createdAt: Date.now(),
      dataDump: session,
    } as any);

    if (!created) {
      await this.orderService.updateOrderStatusToFailed(orderId, OrderFailureCode.PAYMENT_SESSION_LOG_FAILURE);
      throw new Error("Payment session log error");
    }

    await this.orderService.updateOrderCheckoutUrlStripe(orderId, session.url);

    return { sessionId: session.id, checkoutUrl: session.url };
  }

  private async createCheckoutSession(orderId: bigint, request: StripePaymentOrderInput) {
    const currency = (request.currency || "USD").toLowerCase();
    const baseUrl = process.env.STOREFRONT_URL || "http://localhost:3000";

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("payment_method_types[0]", "card");
    params.append("client_reference_id", orderId.toString());
    params.append("line_items[0][price_data][currency]", currency);
    params.append("line_items[0][price_data][unit_amount]", Math.round(Number(request.totalAmount) * 100).toString());
    params.append("line_items[0][price_data][product_data][name]", `Anuprerna Order #${orderId}`);
    params.append("line_items[0][quantity]", "1");
    if (request.customerEmail) params.append("customer_email", request.customerEmail);
    params.append(
      "success_url",
      `${baseUrl}/profile/thank-you/${orderId}?session_id={CHECKOUT_SESSION_ID}&gateway=stripe`,
    );
    params.append("cancel_url", `${baseUrl}/checkout?step=payment&cancelled=true`);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_KEY_SECRET ?? ""}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) throw new Error(`Stripe responded ${response.status}`);

    const created = (await response.json()) as any;
    if (!created?.id || !created?.url) throw new Error("Stripe checkout session response was incomplete");

    return {
      id: created.id,
      paymentIntent: created.payment_intent ?? "",
      url: created.url,
      amountTotal: created.amount_total ?? Math.round(Number(request.totalAmount) * 100),
      currency: created.currency ?? currency,
    };
  }

  /**
   * Looks the transaction up by (order, session id). Anything the API did not
   * itself create is refused — this is what stops a forged or replayed webhook
   * from marking an order paid.
   */
  private async requireTransaction(session: any) {
    const orderId = BigInt(session.client_reference_id);
    const transaction = await this.repository.findByOrderAndStripeSessionId(orderId, session.id);

    if (!transaction) {
      this.logger.warn(`Rejected Stripe webhook for unknown session ${session.id} on order ${orderId}`);
      throw new Error("Unauthorized payment transaction update request");
    }

    return { orderId, transaction };
  }

  async handlePaymentSuccess(session: any, event: any) {
    const { orderId, transaction } = await this.requireTransaction(session);

    transaction.status = TransactionStatus.PAID;
    transaction.stripePaymentIntentId = session.payment_intent;
    transaction.webhookReceived = true;
    transaction.webhookReceivedAt = Date.now();
    transaction.webhookEventType = event.type;
    transaction.webhookDataDump = event;
    transaction.dataDump = session;

    const updated = await this.repository.update(transaction.id, transaction);
    if (!updated) {
      this.logger.error(`Stripe transaction ${transaction.id} could not be marked PAID`);
      await this.orderService.updateOrderStatusToFailed(orderId, OrderFailureCode.TRANSACTION_SUCCESS_UPDATE_FAILURE);
      return;
    }

    if (transaction.paymentType === "advance") {
      if (!(await this.orderService.updateOrderStatusToProcessing(orderId))) return;
      const order = await this.orderService.getOrderById(orderId);
      await this.emailService.sendOrderConfirmationEmail(order?.tenant, order);
      await this.whatsappService.orderConfirmationNotification(order);
      // Only the synchronous completion clears the cart; an async success arrives
      // after the shopper has already moved on.
      if (event.type === "checkout.session.completed") {
        await this.cartService.deleteAllCartItem(order?.tenant);
      }
      return;
    }

    if (transaction.paymentType === "remaining") {
      if (!(await this.orderService.updatePreOrderPaymentStatusToPaid(orderId))) return;
      const order = await this.orderService.getOrderById(orderId);
      await this.emailService.sendPreOrderConfirmationEmail(order?.tenant, order, order?.orderItems ?? []);
    }
  }

  async handlePaymentFailure(session: any, event: any) {
    const { orderId, transaction } = await this.requireTransaction(session);

    transaction.status = TransactionStatus.FAILED;
    transaction.failedErrorCode = TransactionFailureCode.PAYMENT_FAILURE;
    transaction.failedErrorMessage = "Checkout session expired";
    transaction.stripePaymentIntentId = session.payment_intent;
    transaction.webhookReceived = true;
    transaction.webhookReceivedAt = Date.now();
    transaction.webhookEventType = event.type;
    transaction.webhookDataDump = event;
    transaction.dataDump = session;

    await this.repository.update(transaction.id, transaction);

    if (transaction.paymentType === "advance") {
      await this.orderService.updateOrderStatusToFailed(orderId, OrderFailureCode.PAYMENT_FAILURE);
    }
  }

  async getTransactionData(page: number, size: number) {
    return this.repository.findPaginated(page, size);
  }

  async getTransactionById(id: bigint) {
    return this.repository.findById(id);
  }
}
