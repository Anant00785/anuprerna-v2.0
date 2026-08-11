import { Injectable, Inject } from "@nestjs/common";
import { ActionCode } from "../../../common/errors/action-code.js";
import { StripeTransactionRepository } from "../repository/payment.repository.js";
import { StripePaymentOrderInput } from "../dto/payment.dto.js";
import { TransactionStatus, TransactionFailureCode } from "../types/payment.types.js";
import { ORDER_SERVICE, OrderServicePort, EMAIL_SERVICE, EmailServicePort, WHATSAPP_SERVICE, WhatsappServicePort, CART_SERVICE, CartServicePort } from "../ports/payment.ports.js";

@Injectable()
export class StripePaymentService {
    constructor(
        private readonly repository: StripeTransactionRepository,
        @Inject(ORDER_SERVICE) private readonly orderService: OrderServicePort,
        @Inject(EMAIL_SERVICE) private readonly emailService: EmailServicePort,
        @Inject(WHATSAPP_SERVICE) private readonly whatsappService: WhatsappServicePort,
        @Inject(CART_SERVICE) private readonly cartService: CartServicePort
    ) {}

    async createSession(tenant: any, request: StripePaymentOrderInput) {
        const order = await this.orderService.getOrderById(request.loomOrderId);
        if (!order) {
            throw new Error("Irrelevant payment session create request");
        }
        
        if (!this.orderService.isAnyPaymentDue(order)) {
            throw new Error("No payment due");
        }

        // Mock Stripe API call
        const session = {
            id: "cs_test_" + Date.now(),
            paymentIntent: "pi_test_" + Date.now(),
            url: "https://checkout.stripe.com/pay/cs_test_" + Date.now(),
            amountTotal: Number(request.totalAmount) * 100,
            currency: request.currency
        };

        const result = await this.repository.create({
            stripeSessionId: session.id,
            stripePaymentIntentId: session.paymentIntent,
            loomOrderId: request.loomOrderId,
            amount: (session.amountTotal / 100).toString(),
            paymentType: request.paymentType,
            currency: session.currency,
            checkoutUrl: session.url,
            status: TransactionStatus.CREATED,
            createdAt: Date.now(),
            dataDump: session,
        });

        if (result) {
            return { sessionId: session.id, checkoutUrl: session.url };
        } else {
            await this.orderService.updateOrderStatusToFailed(request.loomOrderId, 1);
            throw new Error("Payment session log error");
        }
    }

    async handlePaymentSuccess(session: any, event: any) {
        const loomOrderId = BigInt(session.client_reference_id);
        const transaction = await this.repository.findByOrderAndStripeSessionId(loomOrderId, session.id);
        
        if (!transaction) throw new Error("Unauthorized payment transaction update request");

        transaction.status = TransactionStatus.PAID;
        transaction.webhookReceived = true;
        transaction.webhookReceivedAt = Date.now();
        transaction.stripePaymentIntentId = session.payment_intent;
        transaction.dataDump = session;

        const updated = await this.repository.update(transaction.id, transaction);
        if (updated) {
            if (transaction.paymentType === "advance") {
                const updatedOrder = await this.orderService.updateOrderStatusToProcessing(loomOrderId);
                if (updatedOrder) {
                    const order = await this.orderService.getOrderById(loomOrderId);
                    await this.emailService.sendOrderConfirmationEmail(order.tenant, order);
                    await this.whatsappService.orderConfirmationNotification(order);
                    if (event.type === "checkout.session.completed") {
                        await this.cartService.deleteAllCartItem(order.tenant);
                    }
                }
            } else if (transaction.paymentType === "remaining") {
                const updatedOrder = await this.orderService.updatePreOrderPaymentStatusToPaid(loomOrderId);
                if (updatedOrder) {
                    const order = await this.orderService.getOrderById(loomOrderId);
                    await this.emailService.sendPreOrderConfirmationEmail(order.tenant, order, order.orderItems || []);
                }
            }
        } else {
            await this.orderService.updateOrderStatusToFailed(loomOrderId, 2);
        }
    }

    async handlePaymentFailure(session: any, event: any) {
        const loomOrderId = BigInt(session.client_reference_id);
        const transaction = await this.repository.findByOrderAndStripeSessionId(loomOrderId, session.id);
        
        if (!transaction) throw new Error("Unauthorized payment transaction update request");

        transaction.status = TransactionStatus.FAILED;
        transaction.failedErrorCode = TransactionFailureCode.PAYMENT_FAILURE;
        transaction.failedErrorMessage = "Checkout session expired";
        transaction.webhookReceived = true;
        transaction.webhookReceivedAt = Date.now();
        transaction.dataDump = session;

        await this.repository.update(transaction.id, transaction);

        if (transaction.paymentType === "advance") {
            await this.orderService.updateOrderStatusToFailed(loomOrderId, 3);
        }
    }

    async getTransactionData(page: number, size: number) {
        return this.repository.findPaginated(page, size);
    }

    async getTransactionById(id: bigint) {
        return this.repository.findById(id);
    }
}
