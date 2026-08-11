import { describe, it, expect, vi, beforeEach } from "vitest";
import { StripePaymentService } from "./stripe-payment.service.js";
import type { StripeTransactionRepository } from "../repository/payment.repository.js";
import type { OrderServicePort, EmailServicePort, WhatsappServicePort, CartServicePort } from "../ports/payment.ports.js";
import { TransactionStatus, TransactionFailureCode } from "../types/payment.types.js";

// Fakes implement only the port methods this path touches, per the ports.ts contract
// (docs/backend/commerce/02-api-documentation.md §E.2/E.3).
function makeFakes() {
  const repository = {
    findById: vi.fn(),
    findByOrderAndStripeSessionId: vi.fn(),
    findByStripePaymentIntentId: vi.fn(),
    findByOrderAndPaymentTypeOrderByCreatedAtDesc: vi.fn(),
    findPaginated: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as StripeTransactionRepository;

  const orderService: OrderServicePort = {
    updateOrderStatusToProcessing: vi.fn(),
    updatePreOrderPaymentStatusToPaid: vi.fn(),
    updateOrderStatusToFailed: vi.fn(),
    updateOrderCheckoutUrlStripe: vi.fn(),
    getOrderById: vi.fn(),
    isAnyPaymentDue: vi.fn(),
  };

  const emailService: EmailServicePort = {
    sendOrderConfirmationEmail: vi.fn(),
    sendPreOrderConfirmationEmail: vi.fn(),
    sendOrderCancelNotification: vi.fn(),
  };

  const whatsappService: WhatsappServicePort = {
    orderConfirmationNotification: vi.fn(),
    orderCancelledNotification: vi.fn(),
  };

  const cartService: CartServicePort = {
    deleteAllCartItem: vi.fn(),
  };

  const service = new StripePaymentService(repository, orderService, emailService, whatsappService, cartService);

  return { service, repository, orderService, emailService, whatsappService, cartService };
}

describe("StripePaymentService.createSession", () => {
  let fakes: ReturnType<typeof makeFakes>;
  beforeEach(() => {
    fakes = makeFakes();
  });

  it("rejects when the order does not exist (E8 boundary)", async () => {
    fakes.orderService.getOrderById = vi.fn().mockResolvedValue(null);
    await expect(fakes.service.createSession({}, { loomOrderId: 1n, paymentType: "advance" } as any)).rejects.toThrow(
      "Irrelevant payment session create request",
    );
  });

  it("rejects when no payment is due on the order", async () => {
    fakes.orderService.getOrderById = vi.fn().mockResolvedValue({ id: 1n });
    fakes.orderService.isAnyPaymentDue = vi.fn().mockReturnValue(false);
    await expect(fakes.service.createSession({}, { loomOrderId: 1n, paymentType: "advance" } as any)).rejects.toThrow("No payment due");
  });

  it("persists a CREATED transaction and returns sessionId + checkoutUrl on success", async () => {
    fakes.orderService.getOrderById = vi.fn().mockResolvedValue({ id: 1n });
    fakes.orderService.isAnyPaymentDue = vi.fn().mockReturnValue(true);
    (fakes.repository.create as any).mockResolvedValue({ id: 99n });

    const result = await fakes.service.createSession({}, { loomOrderId: 1n, paymentType: "advance", totalAmount: 500n, currency: "usd" } as any);

    expect(result).toHaveProperty("sessionId");
    expect(result).toHaveProperty("checkoutUrl");
    expect(fakes.repository.create).toHaveBeenCalledWith(expect.objectContaining({ status: TransactionStatus.CREATED, loomOrderId: 1n }));
  });

  it("marks the order failed and throws when the transaction log write fails", async () => {
    fakes.orderService.getOrderById = vi.fn().mockResolvedValue({ id: 1n });
    fakes.orderService.isAnyPaymentDue = vi.fn().mockReturnValue(true);
    (fakes.repository.create as any).mockResolvedValue(undefined);

    await expect(fakes.service.createSession({}, { loomOrderId: 1n, paymentType: "advance", totalAmount: 500n, currency: "usd" } as any)).rejects.toThrow(
      "Payment session log error",
    );
    expect(fakes.orderService.updateOrderStatusToFailed).toHaveBeenCalledWith(1n, 1);
  });
});

describe("StripePaymentService.handlePaymentSuccess (webhook dispatch target, E11)", () => {
  let fakes: ReturnType<typeof makeFakes>;
  beforeEach(() => {
    fakes = makeFakes();
  });

  const session = (over: Record<string, unknown> = {}) => ({
    client_reference_id: "1",
    id: "cs_test_1",
    payment_intent: "pi_test_1",
    ...over,
  });

  it("throws when no matching transaction is found (unauthorized/replayed webhook)", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue(null);
    await expect(fakes.service.handlePaymentSuccess(session(), { type: "checkout.session.completed" })).rejects.toThrow(
      "Unauthorized payment transaction update request",
    );
  });

  it("advance payment: marks PAID, moves order to processing, sends confirmation email + WhatsApp", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });
    (fakes.orderService.updateOrderStatusToProcessing as any).mockResolvedValue(true);
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, tenant: { id: 7n } });

    await fakes.service.handlePaymentSuccess(session(), { type: "checkout.session.async_payment_succeeded" });

    expect(fakes.repository.update).toHaveBeenCalledWith(5n, expect.objectContaining({ status: TransactionStatus.PAID, webhookReceived: true }));
    expect(fakes.orderService.updateOrderStatusToProcessing).toHaveBeenCalledWith(1n);
    expect(fakes.emailService.sendOrderConfirmationEmail).toHaveBeenCalled();
    expect(fakes.whatsappService.orderConfirmationNotification).toHaveBeenCalled();
  });

  it("clears the cart only on checkout.session.completed, not on async_payment_succeeded", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });
    (fakes.orderService.updateOrderStatusToProcessing as any).mockResolvedValue(true);
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, tenant: { id: 7n } });

    await fakes.service.handlePaymentSuccess(session(), { type: "checkout.session.completed" });
    expect(fakes.cartService.deleteAllCartItem).toHaveBeenCalledWith({ id: 7n });

    fakes.cartService.deleteAllCartItem = vi.fn();
    await fakes.service.handlePaymentSuccess(session(), { type: "checkout.session.async_payment_succeeded" });
    expect(fakes.cartService.deleteAllCartItem).not.toHaveBeenCalled();
  });

  it("remaining payment: moves pre-order to paid and sends the pre-order confirmation with order items", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue({ id: 5n, paymentType: "remaining" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });
    (fakes.orderService.updatePreOrderPaymentStatusToPaid as any).mockResolvedValue(true);
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, tenant: { id: 7n }, orderItems: [{ id: 1n }] });

    await fakes.service.handlePaymentSuccess(session(), { type: "checkout.session.completed" });

    expect(fakes.orderService.updatePreOrderPaymentStatusToPaid).toHaveBeenCalledWith(1n);
    expect(fakes.emailService.sendPreOrderConfirmationEmail).toHaveBeenCalledWith({ id: 7n }, expect.anything(), [{ id: 1n }]);
    expect(fakes.cartService.deleteAllCartItem).not.toHaveBeenCalled();
  });

  it("falls back to an empty item list for the pre-order email when the order has no orderItems", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue({ id: 5n, paymentType: "remaining" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });
    (fakes.orderService.updatePreOrderPaymentStatusToPaid as any).mockResolvedValue(true);
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, tenant: { id: 7n } });

    await fakes.service.handlePaymentSuccess(session(), { type: "checkout.session.completed" });

    expect(fakes.emailService.sendPreOrderConfirmationEmail).toHaveBeenCalledWith({ id: 7n }, expect.anything(), []);
  });

  it("marks the order failed when the transaction update itself fails", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue(undefined);

    await fakes.service.handlePaymentSuccess(session(), { type: "checkout.session.completed" });

    expect(fakes.orderService.updateOrderStatusToFailed).toHaveBeenCalledWith(1n, 2);
    expect(fakes.emailService.sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });
});

describe("StripePaymentService.handlePaymentFailure (webhook dispatch target, E11)", () => {
  let fakes: ReturnType<typeof makeFakes>;
  beforeEach(() => {
    fakes = makeFakes();
  });

  const session = { client_reference_id: "1", id: "cs_test_1" };

  it("throws when no matching transaction is found", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue(null);
    await expect(fakes.service.handlePaymentFailure(session, { type: "checkout.session.expired" })).rejects.toThrow(
      "Unauthorized payment transaction update request",
    );
  });

  it("advance payment: marks FAILED with the checkout-session-expired reason and fails the order", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });

    await fakes.service.handlePaymentFailure(session, { type: "checkout.session.expired" });

    expect(fakes.repository.update).toHaveBeenCalledWith(
      5n,
      expect.objectContaining({
        status: TransactionStatus.FAILED,
        failedErrorCode: TransactionFailureCode.PAYMENT_FAILURE,
        failedErrorMessage: "Checkout session expired",
      }),
    );
    expect(fakes.orderService.updateOrderStatusToFailed).toHaveBeenCalledWith(1n, 3);
  });

  it("remaining payment: records the failed transaction but does not fail the order (characterization)", async () => {
    (fakes.repository.findByOrderAndStripeSessionId as any).mockResolvedValue({ id: 5n, paymentType: "remaining" });

    await fakes.service.handlePaymentFailure(session, { type: "checkout.session.async_payment_failed" });

    expect(fakes.repository.update).toHaveBeenCalled();
    expect(fakes.orderService.updateOrderStatusToFailed).not.toHaveBeenCalled();
  });
});

describe("StripePaymentService admin projections", () => {
  it("getTransactionData delegates paging straight to the repository", async () => {
    const fakes = makeFakes();
    (fakes.repository.findPaginated as any).mockResolvedValue(["row"]);
    const result = await fakes.service.getTransactionData(2, 10);
    expect(fakes.repository.findPaginated).toHaveBeenCalledWith(2, 10);
    expect(result).toEqual(["row"]);
  });

  it("getTransactionById delegates to the repository by id", async () => {
    const fakes = makeFakes();
    (fakes.repository.findById as any).mockResolvedValue({ id: 5n });
    const result = await fakes.service.getTransactionById(5n);
    expect(fakes.repository.findById).toHaveBeenCalledWith(5n);
    expect(result).toEqual({ id: 5n });
  });
});
