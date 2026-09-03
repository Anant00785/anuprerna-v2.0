import { Injectable, Inject, Logger } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ActionCode, type ActionCodeValue } from "../../../common/errors/action-code.js";
import { RazorpayTransactionRepository } from "../repository/payment.repository.js";
import {
  RazorpayPaymentInput,
  RazorpayPaymentSuccessInput,
  RazorpayPaymentFailureInput,
  RazorpayPaymentUpdateInput,
} from "../dto/payment.dto.js";
import {
  TransactionStatus,
  TransactionFailureCode,
  transactionFailureMessage,
  OrderFailureCode,
} from "../types/payment.types.js";
import {
  ORDER_SERVICE,
  OrderServicePort,
  EMAIL_SERVICE,
  EmailServicePort,
  WHATSAPP_SERVICE,
  WhatsappServicePort,
} from "../ports/payment.ports.js";

/**
 * Razorpay payments, ported from Loom's RazorpayTransactionDAOController +
 * RazorpayPaymentService.
 *
 * Two rules this file exists to enforce, both regressions found by the audit:
 *
 *  - Every client-reported success is signature-verified (Loom's
 *    `isValidSignature` / `Utils.verifyPaymentSignature`) BEFORE any status
 *    mutation. No secret configured => the payment is rejected, never accepted.
 *  - A payment with no matching transaction row is NO_ACTION. The service never
 *    invents a row, and never falls back to a default order id.
 *
 * Secrets are read from process.env (validated at boot by common/config/env.schema.ts)
 * rather than through ConfigService: the constructor signature is pinned by the
 * co-located specs, which construct this service with exactly its four collaborators.
 */
@Injectable()
export class RazorpayPaymentService {
  private readonly logger = new Logger(RazorpayPaymentService.name);

  constructor(
    private readonly repository: RazorpayTransactionRepository,
    @Inject(ORDER_SERVICE) private readonly orderService: OrderServicePort,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailServicePort,
    @Inject(WHATSAPP_SERVICE) private readonly whatsappService: WhatsappServicePort,
  ) {}

  /**
   * HMAC-SHA256 of `<razorpay_order_id>|<razorpay_payment_id>` keyed with the
   * Razorpay key secret, compared in constant time. Throws when the secret is
   * missing so the caller fails closed instead of accepting an unverifiable payment.
   */
  private isValidSignature(razorpayOrderId: string, transactionId: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not configured");
    if (!signature) return false;

    const expected = Buffer.from(
      createHmac("sha256", secret).update(`${razorpayOrderId}|${transactionId}`).digest("hex"),
      "utf8",
    );
    const received = Buffer.from(signature, "utf8");

    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  private async requireOrder(orderId: bigint | number) {
    const order = await this.orderService.getOrderById(BigInt(orderId));
    if (!order) throw new Error("Irrelevant payment session create request");
    return order;
  }

  async createSession(tenant: any, request: RazorpayPaymentInput) {
    const orderId = BigInt(request.orderId);
    const order = await this.requireOrder(orderId);

    if (!this.orderService.isAnyPaymentDue(order)) {
      throw new Error("No payment due for this order");
    }

    const amount = request.paymentType === "advance" ? order.advancePay : order.remainingPay;
    const currency = order.currency;

    let razorpayOrderId: string;
    try {
      razorpayOrderId = await this.createRazorpayOrder(orderId, request.paymentType, amount, currency);
    } catch (error) {
      this.logger.error(`Razorpay order creation failed for order ${orderId}`, error as Error);
      await this.orderService.updateOrderStatusToFailed(orderId, OrderFailureCode.PAYMENT_SESSION_CREATE_FAILURE);
      throw new Error("Payment session creation error");
    }

    const created = await this.repository.create({
      razorpayOrderId,
      loomOrderId: Number(orderId),
      amount,
      paymentType: request.paymentType,
      currency,
      status: TransactionStatus.CREATED,
      failedErrorCode: -1,
      createdAt: Date.now(),
    } as any);

    if (!created) {
      await this.orderService.updateOrderStatusToFailed(orderId, OrderFailureCode.PAYMENT_SESSION_LOG_FAILURE);
      throw new Error("Payment session log error");
    }

    return {
      razorpayOrderId,
      key: process.env.RAZORPAY_KEY_ID ?? "",
      amount: Math.round(Number(amount) * 100),
      currency,
    };
  }

  private async createRazorpayOrder(
    orderId: bigint,
    paymentType: string,
    amount: unknown,
    currency: string,
  ): Promise<string> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100),
        currency,
        receipt: `receipt_#${orderId}_${paymentType}`,
      }),
    });

    if (!response.ok) throw new Error(`Razorpay responded ${response.status}`);

    const created = (await response.json()) as { id?: string };
    if (!created?.id) throw new Error("Razorpay order response carried no id");
    return created.id;
  }

  private async recordSignatureFailure(
    request: RazorpayPaymentSuccessInput,
    transaction: any,
    failureCode: number,
    orderFailureCode: number,
  ): Promise<ActionCodeValue> {
    transaction.transactionId = request.transactionId;
    transaction.transactionSignature = request.transactionSignature;
    transaction.failedErrorCode = failureCode;
    transaction.failedErrorMessage = transactionFailureMessage(failureCode);

    await this.repository.update(transaction.id, transaction);
    await this.orderService.updateOrderStatusToFailed(BigInt(request.loomOrderId), orderFailureCode);

    return ActionCode.UPDATE_FAILURE;
  }

  async updateTransactionSuccess(tenant: any, request: RazorpayPaymentSuccessInput): Promise<ActionCodeValue> {
    const orderId = BigInt(request.loomOrderId);

    const transaction = await this.repository.findByOrderAndRazorpayOrderId(orderId, request.razorpayOrderId);
    if (!transaction) return ActionCode.NO_ACTION;

    let signatureValid: boolean;
    try {
      signatureValid = this.isValidSignature(
        request.razorpayOrderId,
        request.transactionId,
        request.transactionSignature,
      );
    } catch (error) {
      this.logger.error(`Razorpay signature validation errored for order ${orderId}`, error as Error);
      return this.recordSignatureFailure(
        request,
        transaction,
        TransactionFailureCode.TRANSACTION_SIGNATURE_VALIDATION_ERROR,
        OrderFailureCode.TRANSACTION_SIGNATURE_VALIDATION_ERROR,
      );
    }

    if (!signatureValid) {
      this.logger.warn(`Rejected Razorpay success with an invalid signature for order ${orderId}`);
      return this.recordSignatureFailure(
        request,
        transaction,
        TransactionFailureCode.INVALID_TRANSACTION_SIGNATURE,
        OrderFailureCode.INVALID_TRANSACTION_SIGNATURE,
      );
    }

    transaction.transactionId = request.transactionId;
    transaction.transactionSignature = request.transactionSignature;
    transaction.status = TransactionStatus.PAID;

    const updated = await this.repository.update(transaction.id, transaction);
    if (!updated) {
      await this.orderService.updateOrderStatusToFailed(orderId, OrderFailureCode.TRANSACTION_SUCCESS_UPDATE_FAILURE);
      return ActionCode.UPDATE_FAILURE;
    }

    return this.notifyPaymentSuccess(tenant, orderId, request.paymentType);
  }

  /** Advance -> order processing + confirmation notifications; remaining -> pre-order paid + pre-order email. */
  private async notifyPaymentSuccess(tenant: any, orderId: bigint, paymentType: string): Promise<ActionCodeValue> {
    if (paymentType === "advance") {
      if (!(await this.orderService.updateOrderStatusToProcessing(orderId))) return ActionCode.UPDATE_FAILURE;
      const order = await this.orderService.getOrderById(orderId);
      await this.emailService.sendOrderConfirmationEmail(tenant, order);
      await this.whatsappService.orderConfirmationNotification(order);
      return ActionCode.UPDATE_SUCCESS;
    }

    if (paymentType === "remaining") {
      if (!(await this.orderService.updatePreOrderPaymentStatusToPaid(orderId))) return ActionCode.UPDATE_FAILURE;
      const order = await this.orderService.getOrderById(orderId);
      await this.emailService.sendPreOrderConfirmationEmail(tenant, order, order?.orderItems ?? []);
      return ActionCode.UPDATE_SUCCESS;
    }

    return ActionCode.NO_ACTION;
  }

  async updateTransactionFailure(request: RazorpayPaymentFailureInput): Promise<ActionCodeValue> {
    const orderId = BigInt(request.loomOrderId);

    const transaction = await this.repository.findByOrderAndRazorpayOrderId(orderId, request.razorpayOrderId);
    if (!transaction) return ActionCode.NO_ACTION;

    transaction.status = TransactionStatus.FAILED;
    transaction.dataDump = JSON.stringify(request.error ?? {});
    transaction.failedErrorCode = TransactionFailureCode.PAYMENT_FAILURE;
    transaction.failedErrorMessage = transactionFailureMessage(TransactionFailureCode.PAYMENT_FAILURE);

    const updated = await this.repository.update(transaction.id, transaction);

    const order = await this.orderService.getOrderById(orderId);
    if (order?.tenant?.email) {
      const adminEmail = process.env.ADMIN_EMAIL_ADDRESS || "admin@example.com";
      try {
        await this.emailService.sendOrderCancelNotification(
          [order.tenant.email],
          [adminEmail],
          null,
          order,
          transaction.failedErrorMessage,
        );
      } catch (error) {
        // Notification is best-effort; the failed transaction is already persisted.
        this.logger.error(`Order-cancel notification failed for order ${orderId}`, error as Error);
      }
    }

    // Only an advance-payment failure invalidates the order; a failed remaining
    // payment leaves the (already dispatched) order alone. Loom does the same.
    if (transaction.paymentType === "advance") {
      await this.orderService.updateOrderStatusToFailed(orderId, OrderFailureCode.PAYMENT_FAILURE);
    }

    return updated ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }

  async getTransactionDataDump() {
    return this.repository.findPaginated(0, 100);
  }

  /** Superuser correction path: rewrites the existing transactions of an order, never creates one. */
  async updateTransaction(request: RazorpayPaymentUpdateInput): Promise<ActionCodeValue> {
    const orderId = BigInt(request.loomOrderId);
    const transactions = await this.repository.findByOrder(orderId);

    if (!transactions?.length) return ActionCode.NO_ACTION;

    for (const transaction of transactions) {
      transaction.transactionId = request.transactionId;
      transaction.status = TransactionStatus.PAID;
      transaction.failedErrorCode = -1;
      transaction.failedErrorMessage = "";
      transaction.dataDump = "";
      await this.repository.update(transaction.id, transaction);
    }

    const order = await this.orderService.getOrderById(orderId);
    return this.notifyPaymentSuccess(order?.tenant, orderId, request.paymentType);
  }

  async getTransactionData(page: number, size: number) {
    return this.repository.findPaginated(page, size);
  }

  async getTransactionById(id: bigint) {
    return this.repository.findById(id);
  }
}
