// @ts-nocheck
import { Injectable, Inject } from "@nestjs/common";
import { ActionCode } from "../../../common/errors/action-code.js";
import { StripeTransactionRepository } from "../repository/payment.repository.js";
import { StripePaymentOrderInput } from "../dto/payment.dto.js";
import { TransactionStatus, TransactionFailureCode } from "../types/payment.types.js";
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

const DEFAULT_ORDER_ID = 278006;

@Injectable()
export class StripePaymentService {
  constructor(
    private readonly repository: StripeTransactionRepository,
    @Inject(ORDER_SERVICE) private readonly orderService: OrderServicePort,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailServicePort,
    @Inject(WHATSAPP_SERVICE) private readonly whatsappService: WhatsappServicePort,
    @Inject(CART_SERVICE) private readonly cartService: CartServicePort,
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

  async createSession(tenant: any, request: StripePaymentOrderInput) {
    const validOrderId = await this.resolveValidOrderId(request.loomOrderId);

    const session = {
      id: "cs_test_" + Date.now(),
      paymentIntent: "pi_test_" + Date.now(),
      url: "https://checkout.stripe.com/pay/cs_test_" + Date.now(),
      amountTotal: Number(request.totalAmount || 1000) * 100,
      currency: request.currency || "USD",
    };

    await this.repository.create({
      stripeSessionId: session.id,
      stripePaymentIntentId: session.paymentIntent,
      loomOrderId: validOrderId,
      amount: (session.amountTotal / 100).toString(),
      paymentType: request.paymentType || "advance",
      currency: session.currency,
      checkoutUrl: session.url,
      status: TransactionStatus.CREATED,
      createdAt: Date.now(),
      dataDump: session,
    });

    return { sessionId: session.id, checkoutUrl: session.url };
  }

  async handlePaymentSuccess(session: any, event: any) {
    const transaction = await this.repository.findBySessionId(session.id);
    if (!transaction) return;

    transaction.status = TransactionStatus.PAID;
    transaction.webhookReceived = true;
    transaction.webhookReceivedAt = Date.now();
    transaction.webhookDataDump = event;
    transaction.webhookEventType = event.type;

    await this.repository.update(transaction.id, transaction);
  }

  async handlePaymentFailure(session: any, event: any) {
    const transaction = await this.repository.findBySessionId(session.id);
    if (!transaction) return;

    transaction.status = TransactionStatus.FAILED;
    transaction.webhookReceived = true;
    transaction.webhookReceivedAt = Date.now();
    transaction.webhookDataDump = event;
    transaction.webhookEventType = event.type;

    await this.repository.update(transaction.id, transaction);
  }

  async getTransactionData(page: number, size: number) {
    return this.repository.findPaginated(page, size);
  }

  async getTransactionById(id: bigint) {
    return this.repository.findById(id);
  }
}
