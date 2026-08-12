import { Injectable, Inject } from "@nestjs/common";
import { ActionCode, type ActionCodeValue } from "../../../common/errors/action-code.js";
import { RazorpayTransactionRepository } from "../repository/payment.repository.js";
import { RazorpayPaymentInput, RazorpayPaymentSuccessInput, RazorpayPaymentFailureInput, RazorpayPaymentUpdateInput } from "../dto/payment.dto.js";
import { TransactionStatus, TransactionFailureCode } from "../types/payment.types.js";
import { ORDER_SERVICE, OrderServicePort, EMAIL_SERVICE, EmailServicePort, WHATSAPP_SERVICE, WhatsappServicePort } from "../ports/payment.ports.js";

@Injectable()
export class RazorpayPaymentService {
    constructor(
        private readonly repository: RazorpayTransactionRepository,
        @Inject(ORDER_SERVICE) private readonly orderService: OrderServicePort,
        @Inject(EMAIL_SERVICE) private readonly emailService: EmailServicePort,
        @Inject(WHATSAPP_SERVICE) private readonly whatsappService: WhatsappServicePort
    ) {}

    async createSession(tenant: any, request: RazorpayPaymentInput) {
        const order = await this.orderService.getOrderById(request.orderId);
        if (!order) {
            throw new Error("Irrelevant payment session create request");
        }
        
        if (!this.orderService.isAnyPaymentDue(order)) {
            throw new Error("No payment due");
        }

        const amount = request.paymentType === "advance" ? order.advancePay : order.remainingPay;
        const currency = order.currency;

        // Mock Razorpay API call
        const session = {
            razorpayOrderId: "mock_order_" + Date.now(),
            amount: Math.round(Number(amount) * 100),
            currency: currency
        };

        const result = await this.repository.create({
            razorpayOrderId: session.razorpayOrderId,
            // Drizzle maps loom_order_id as bigint({ mode: "number" }), so the
            // column is typed number here. Order ids are well inside the safe
            // integer range; the broken import previously hid this mismatch.
            loomOrderId: Number(request.orderId),
            amount: amount,
            paymentType: request.paymentType,
            currency: session.currency,
            status: TransactionStatus.CREATED,
            createdAt: Date.now(),
        });

        if (result) {
            return session;
        } else {
            await this.orderService.updateOrderStatusToFailed(request.orderId, 1); // Failure code
            throw new Error("Payment session log error");
        }
    }

    async updateTransactionSuccess(tenant: any, request: RazorpayPaymentSuccessInput) {
        const transaction = await this.repository.findByOrderAndRazorpayOrderId(request.loomOrderId, request.razorpayOrderId);
        if (!transaction) return ActionCode.NO_ACTION;

        // Verify signature here

        transaction.transactionId = request.transactionId;
        transaction.transactionSignature = request.transactionSignature;
        transaction.status = TransactionStatus.PAID;

        const updated = await this.repository.update(transaction.id, transaction);
        if (updated) {
            if (request.paymentType === "advance") {
                const updatedOrder = await this.orderService.updateOrderStatusToProcessing(request.loomOrderId);
                if (updatedOrder) {
                    const order = await this.orderService.getOrderById(request.loomOrderId);
                    await this.emailService.sendOrderConfirmationEmail(tenant, order);
                    await this.whatsappService.orderConfirmationNotification(order);
                }
                return ActionCode.UPDATE_SUCCESS;
            } else if (request.paymentType === "remaining") {
                const updatedOrder = await this.orderService.updatePreOrderPaymentStatusToPaid(request.loomOrderId);
                if (updatedOrder) {
                    const order = await this.orderService.getOrderById(request.loomOrderId);
                    await this.emailService.sendPreOrderConfirmationEmail(tenant, order, order.orderItems || []);
                }
                return ActionCode.UPDATE_SUCCESS;
            }
        } else {
            await this.orderService.updateOrderStatusToFailed(request.loomOrderId, 2);
            return ActionCode.UPDATE_FAILURE;
        }
        return ActionCode.NO_ACTION;
    }

    async updateTransactionFailure(request: RazorpayPaymentFailureInput) {
        const order = await this.orderService.getOrderById(request.loomOrderId);
        const transaction = await this.repository.findByOrderAndRazorpayOrderId(request.loomOrderId, request.razorpayOrderId);
        if (!transaction) return ActionCode.NO_ACTION;

        transaction.status = TransactionStatus.FAILED;
        transaction.dataDump = JSON.stringify(request.error);
        transaction.failedErrorCode = TransactionFailureCode.PAYMENT_FAILURE;
        transaction.failedErrorMessage = "Payment Failure";

        const transactionOpCode = await this.repository.update(transaction.id, transaction);
        let orderOpCode: ActionCodeValue = ActionCode.UPDATE_SUCCESS;

        if (transaction.paymentType === "advance") {
            orderOpCode = await this.orderService.updateOrderStatusToFailed(request.loomOrderId, 3) ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
        }

        if (transactionOpCode && orderOpCode === ActionCode.UPDATE_SUCCESS) {
            await this.emailService.sendOrderCancelNotification([order.tenant.email], ["admin@example.com"], null, order, transaction.failedErrorMessage);
            return ActionCode.UPDATE_SUCCESS;
        }
        return ActionCode.UPDATE_FAILURE;
    }

    async getTransactionDataDump() {
        return this.repository.findPaginated(0, 100);
    }
    
    async updateTransaction(request: RazorpayPaymentUpdateInput) {
        // Implementation mirroring updateTransaction in DAO controller
        const transactions = await this.repository.findByOrder(request.loomOrderId);
        if (!transactions.length) return ActionCode.NO_ACTION;
        
        for (const transaction of transactions) {
            transaction.transactionId = request.transactionId;
            transaction.status = TransactionStatus.PAID;
            transaction.failedErrorCode = -1;
            transaction.failedErrorMessage = "";
            transaction.dataDump = "";
            await this.repository.update(transaction.id, transaction);
        }

        const order = await this.orderService.getOrderById(request.loomOrderId);
        if (request.paymentType === "advance") {
            const opCode = await this.orderService.updateOrderStatusToProcessing(request.loomOrderId);
            if (opCode) {
                await this.emailService.sendOrderConfirmationEmail(order.tenant, order);
                await this.whatsappService.orderConfirmationNotification(order);
            }
            return opCode ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
        } else if (request.paymentType === "remaining") {
            const opCode = await this.orderService.updatePreOrderPaymentStatusToPaid(request.loomOrderId);
            if (opCode) {
                await this.emailService.sendPreOrderConfirmationEmail(order.tenant, order, order.orderItems || []);
            }
            return opCode ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
        }
        return ActionCode.NO_ACTION;
    }

    async getTransactionData(page: number, size: number) {
        return this.repository.findPaginated(page, size);
    }

    async getTransactionById(id: bigint) {
        return this.repository.findById(id);
    }
}
