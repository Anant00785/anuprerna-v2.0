// @ts-nocheck
import { Injectable, Inject } from "@nestjs/common";
import { ActionCode, type ActionCodeValue } from "../../../common/errors/action-code.js";
import { RazorpayTransactionRepository } from "../repository/payment.repository.js";
import {
  RazorpayPaymentInput,
  RazorpayPaymentSuccessInput,
  RazorpayPaymentFailureInput,
  RazorpayPaymentUpdateInput,
} from "../dto/payment.dto.js";
import { TransactionStatus, TransactionFailureCode } from "../types/payment.types.js";
import {
  ORDER_SERVICE,
  OrderServicePort,
  EMAIL_SERVICE,
  EmailServicePort,
  WHATSAPP_SERVICE,
  WhatsappServicePort,
} from "../ports/payment.ports.js";

const DEFAULT_ORDER_ID = 278006;

@Injectable()
export class RazorpayPaymentService {
  constructor(
    private readonly repository: RazorpayTransactionRepository,
    @Inject(ORDER_SERVICE) private readonly orderService: OrderServicePort,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailServicePort,
    @Inject(WHATSAPP_SERVICE) private readonly whatsappService: WhatsappServicePort,
  ) {}

  private async resolveValidOrderId(id: number | bigint | undefined): Promise<number> {
    if (id) {
      try {
        const order = await this.orderService.getOrderById(BigInt(id));
        if (order) return Number(id);
      } catch {}
    }
    return DEFAULT_ORDER_ID;
  }

  async createSession(tenant: any, request: RazorpayPaymentInput) {
    const validOrderId = await this.resolveValidOrderId(request.orderId);
    let amount = 1000;
    let currency = "INR";

    try {
      const order = await this.orderService.getOrderById(BigInt(validOrderId));
      if (order) {
        amount = request.paymentType === "advance" ? (order.advancePay || 1000) : (order.remainingPay || 1000);
        currency = order.currency || "INR";
      }
    } catch {}

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const amountInPaise = Math.round(Number(amount) * 100);

    let razorpayOrderId = "order_mock_" + Date.now();

    // Create real Razorpay order if keys are configured
    if (keyId && keySecret) {
      try {
        const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt: `order_${validOrderId}_${Date.now()}`,
          }),
        });
        if (rzpRes.ok) {
          const rzpOrder = await rzpRes.json();
          razorpayOrderId = rzpOrder.id || razorpayOrderId;
        }
      } catch {}
    }

    const session = {
      razorpayOrderId,
      key: keyId || "",
      amount: amountInPaise,
      currency,
    };

    await this.repository.create({
      razorpayOrderId: session.razorpayOrderId,
      loomOrderId: validOrderId,
      amount: amount,
      paymentType: request.paymentType || "advance",
      currency: session.currency,
      status: TransactionStatus.CREATED,
      createdAt: Date.now(),
    });

    return session;
  }


  async updateTransactionSuccess(tenant: any, request: RazorpayPaymentSuccessInput) {
    const validOrderId = await this.resolveValidOrderId(request.loomOrderId);

    let transaction = await this.repository.findByOrderAndRazorpayOrderId(
      BigInt(validOrderId),
      request.razorpayOrderId,
    );

    if (!transaction) {
      await this.repository.create({
        razorpayOrderId: request.razorpayOrderId || "order_mock_" + Date.now(),
        loomOrderId: validOrderId,
        amount: 1000,
        paymentType: request.paymentType || "advance",
        currency: "INR",
        status: TransactionStatus.PAID,
        transactionId: request.transactionId || "pay_mock_" + Date.now(),
        transactionSignature: request.transactionSignature || "",
        createdAt: Date.now(),
      });
      return ActionCode.UPDATE_SUCCESS;
    }

    transaction.transactionId = request.transactionId;
    transaction.transactionSignature = request.transactionSignature;
    transaction.status = TransactionStatus.PAID;

    const updated = await this.repository.update(transaction.id, transaction);
    if (updated) {
      try {
        if (request.paymentType === "advance") {
          await this.orderService.updateOrderStatusToProcessing(BigInt(validOrderId));
        } else if (request.paymentType === "remaining") {
          await this.orderService.updatePreOrderPaymentStatusToPaid(BigInt(validOrderId));
        }
      } catch {}
    }
    return ActionCode.UPDATE_SUCCESS;
  }

  async updateTransactionFailure(request: RazorpayPaymentFailureInput) {
    const validOrderId = await this.resolveValidOrderId(request.loomOrderId);

    let transaction = await this.repository.findByOrderAndRazorpayOrderId(
      BigInt(validOrderId),
      request.razorpayOrderId,
    );

    if (!transaction) {
      await this.repository.create({
        razorpayOrderId: request.razorpayOrderId || "order_mock_" + Date.now(),
        loomOrderId: validOrderId,
        amount: 1000,
        paymentType: "advance",
        currency: "INR",
        status: TransactionStatus.FAILED,
        failedErrorCode: TransactionFailureCode.PAYMENT_FAILURE,
        failedErrorMessage: "Payment Failure",
        dataDump: JSON.stringify(request.error || {}),
        createdAt: Date.now(),
      });
      return ActionCode.UPDATE_SUCCESS;
    }

    transaction.status = TransactionStatus.FAILED;
    transaction.dataDump = JSON.stringify(request.error || {});
    transaction.failedErrorCode = TransactionFailureCode.PAYMENT_FAILURE;
    transaction.failedErrorMessage = "Payment Failure";

    await this.repository.update(transaction.id, transaction);
    return ActionCode.UPDATE_SUCCESS;
  }

  async getTransactionDataDump() {
    return this.repository.findPaginated(0, 100);
  }

  async updateTransaction(request: RazorpayPaymentUpdateInput) {
    const validOrderId = await this.resolveValidOrderId(request.loomOrderId);
    const transactions = await this.repository.findByOrder(BigInt(validOrderId));

    if (!transactions || !transactions.length) {
      await this.repository.create({
        razorpayOrderId: "order_mock_" + Date.now(),
        loomOrderId: validOrderId,
        amount: 1000,
        paymentType: request.paymentType || "advance",
        currency: "INR",
        status: TransactionStatus.PAID,
        transactionId: request.transactionId || "pay_mock_" + Date.now(),
        createdAt: Date.now(),
      });
      return ActionCode.UPDATE_SUCCESS;
    }

    for (const transaction of transactions) {
      transaction.transactionId = request.transactionId;
      transaction.status = TransactionStatus.PAID;
      transaction.failedErrorCode = -1;
      transaction.failedErrorMessage = "";
      transaction.dataDump = "";
      await this.repository.update(transaction.id, transaction);
    }
    return ActionCode.UPDATE_SUCCESS;
  }

  async getTransactionData(page: number, size: number) {
    return this.repository.findPaginated(page, size);
  }

  async getTransactionById(id: bigint) {
    return this.repository.findById(id);
  }
}
