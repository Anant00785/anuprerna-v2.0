import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { RazorpayPaymentService } from "./razorpay-payment.service.js";
import type { RazorpayTransactionRepository } from "../repository/payment.repository.js";
import type { OrderServicePort, EmailServicePort, WhatsappServicePort } from "../ports/payment.ports.js";
import { ActionCode } from "../../../common/errors/action-code.js";
import { TransactionStatus, TransactionFailureCode } from "../types/payment.types.js";

// Fakes implement only the port methods this path touches, per the ports.ts contract
// (docs/backend/commerce/02-api-documentation.md §E.1).
const KEY_ID = "rzp_test_key_id";
const KEY_SECRET = "rzp_test_key_secret";

/** The signature Razorpay's checkout would return for this (order, payment) pair. */
function sign(razorpayOrderId: string, transactionId: string, secret = KEY_SECRET) {
  return createHmac("sha256", secret).update(`${razorpayOrderId}|${transactionId}`).digest("hex");
}

function makeFakes() {
  const repository = {
    findById: vi.fn(),
    findByOrderAndRazorpayOrderId: vi.fn(),
    findByOrder: vi.fn(),
    findPaginated: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as RazorpayTransactionRepository;

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

  const service = new RazorpayPaymentService(repository, orderService, emailService, whatsappService);

  return { service, repository, orderService, emailService, whatsappService };
}

// The gateway credentials and the HTTP call are stubbed for every test in this
// file: no spec may reach api.razorpay.com, and signature verification needs a
// deterministic secret rather than whatever the developer's .env happens to hold.
beforeEach(() => {
  process.env.RAZORPAY_KEY_ID = KEY_ID;
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "order_gateway_1" }) }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RazorpayPaymentService.createSession", () => {
  let fakes: ReturnType<typeof makeFakes>;
  beforeEach(() => {
    fakes = makeFakes();
  });

  it("rejects when the order does not exist (E1 boundary)", async () => {
    (fakes.orderService.getOrderById as any).mockResolvedValue(null);
    await expect(fakes.service.createSession({}, { orderId: 1n, paymentType: "advance" })).rejects.toThrow("Irrelevant payment session create request");
  });

  it("rejects when no payment is due on the order", async () => {
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n });
    (fakes.orderService.isAnyPaymentDue as any).mockReturnValue(false);
    await expect(fakes.service.createSession({}, { orderId: 1n, paymentType: "advance" })).rejects.toThrow("No payment due");
  });

  it("uses advancePay for an advance session and remainingPay for a remaining session", async () => {
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, advancePay: "100", remainingPay: "250", currency: "INR" });
    (fakes.orderService.isAnyPaymentDue as any).mockReturnValue(true);
    (fakes.repository.create as any).mockResolvedValue({ id: 1n });

    await fakes.service.createSession({}, { orderId: 1n, paymentType: "advance" });
    expect(fakes.repository.create).toHaveBeenCalledWith(expect.objectContaining({ amount: "100" }));

    await fakes.service.createSession({}, { orderId: 1n, paymentType: "remaining" });
    expect(fakes.repository.create).toHaveBeenCalledWith(expect.objectContaining({ amount: "250" }));
  });

  it("marks the order failed and throws when the transaction log write fails", async () => {
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, advancePay: "100", currency: "INR" });
    (fakes.orderService.isAnyPaymentDue as any).mockReturnValue(true);
    (fakes.repository.create as any).mockResolvedValue(undefined);

    await expect(fakes.service.createSession({}, { orderId: 1n, paymentType: "advance" })).rejects.toThrow("Payment session log error");
    expect(fakes.orderService.updateOrderStatusToFailed).toHaveBeenCalledWith(1n, 1);
  });
});

// E2 (audit C3/C4): every client-reported success is signature-verified against the
// Razorpay key secret before any status mutation, and a success for which no
// transaction row exists is NO_ACTION — the service never fabricates a PAID row.
describe("RazorpayPaymentService.updateTransactionSuccess (client-reported, checklist row E2)", () => {
  let fakes: ReturnType<typeof makeFakes>;
  beforeEach(() => {
    fakes = makeFakes();
  });

  it("returns NO_ACTION when no matching transaction is found, without touching the order", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue(null);
    const result = await fakes.service.updateTransactionSuccess({}, {
      loomOrderId: 1n,
      paymentType: "advance",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: sign("r1", "t1"),
    });
    expect(result).toBe(ActionCode.NO_ACTION);
    expect(fakes.orderService.updateOrderStatusToProcessing).not.toHaveBeenCalled();
  });

  it("creates no transaction row for an unknown order/payment pair", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue(null);
    await fakes.service.updateTransactionSuccess({}, {
      loomOrderId: 999n,
      paymentType: "advance",
      razorpayOrderId: "r-unknown",
      transactionId: "t-unknown",
      transactionSignature: sign("r-unknown", "t-unknown"),
    });
    expect(fakes.repository.create).not.toHaveBeenCalled();
    expect(fakes.repository.update).not.toHaveBeenCalled();
  });

  it("marks PAID when the signature verifies", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });
    (fakes.orderService.updateOrderStatusToProcessing as any).mockResolvedValue(true);
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n });

    const result = await fakes.service.updateTransactionSuccess({}, {
      loomOrderId: 1n,
      paymentType: "advance",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: sign("r1", "t1"),
    });

    expect(result).toBe(ActionCode.UPDATE_SUCCESS);
    expect(fakes.repository.update).toHaveBeenCalledWith(5n, expect.objectContaining({ status: TransactionStatus.PAID }));
  });

  it("rejects a forged signature: never PAID, order failed, no row created", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });

    const result = await fakes.service.updateTransactionSuccess({}, {
      loomOrderId: 1n,
      paymentType: "advance",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: "not-a-real-signature",
    });

    expect(result).toBe(ActionCode.UPDATE_FAILURE);
    expect(fakes.repository.create).not.toHaveBeenCalled();
    expect(fakes.repository.update).toHaveBeenCalledWith(
      5n,
      expect.objectContaining({ failedErrorCode: TransactionFailureCode.INVALID_TRANSACTION_SIGNATURE }),
    );
    expect(fakes.repository.update).not.toHaveBeenCalledWith(5n, expect.objectContaining({ status: TransactionStatus.PAID }));
    expect(fakes.orderService.updateOrderStatusToProcessing).not.toHaveBeenCalled();
  });

  it("rejects a signature computed with the wrong secret", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });

    const result = await fakes.service.updateTransactionSuccess({}, {
      loomOrderId: 1n,
      paymentType: "advance",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: sign("r1", "t1", "someone-elses-secret"),
    });

    expect(result).toBe(ActionCode.UPDATE_FAILURE);
    expect(fakes.orderService.updateOrderStatusToProcessing).not.toHaveBeenCalled();
  });

  it("rejects a signature bound to a different payment id (replay across payments)", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });

    const result = await fakes.service.updateTransactionSuccess({}, {
      loomOrderId: 1n,
      paymentType: "advance",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: sign("r1", "t-other"),
    });

    expect(result).toBe(ActionCode.UPDATE_FAILURE);
  });

  it("fails closed when no key secret is configured", async () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });

    const result = await fakes.service.updateTransactionSuccess({}, {
      loomOrderId: 1n,
      paymentType: "advance",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: sign("r1", "t1"),
    });

    expect(result).toBe(ActionCode.UPDATE_FAILURE);
    expect(fakes.repository.update).toHaveBeenCalledWith(
      5n,
      expect.objectContaining({ failedErrorCode: TransactionFailureCode.TRANSACTION_SIGNATURE_VALIDATION_ERROR }),
    );
    expect(fakes.orderService.updateOrderStatusToProcessing).not.toHaveBeenCalled();
  });

  it("advance payment: moves order to processing and sends confirmation email + WhatsApp", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });
    (fakes.orderService.updateOrderStatusToProcessing as any).mockResolvedValue(true);
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n });
    const tenant = { id: 7n };

    await fakes.service.updateTransactionSuccess(tenant, {
      loomOrderId: 1n,
      paymentType: "advance",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: sign("r1", "t1"),
    });

    expect(fakes.emailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(tenant, { id: 1n });
    expect(fakes.whatsappService.orderConfirmationNotification).toHaveBeenCalledWith({ id: 1n });
  });

  it("remaining payment: moves pre-order to paid and sends the pre-order confirmation with order items", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "remaining" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });
    (fakes.orderService.updatePreOrderPaymentStatusToPaid as any).mockResolvedValue(true);
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, orderItems: [{ id: 9n }] });
    const tenant = { id: 7n };

    const result = await fakes.service.updateTransactionSuccess(tenant, {
      loomOrderId: 1n,
      paymentType: "remaining",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: sign("r1", "t1"),
    });

    expect(result).toBe(ActionCode.UPDATE_SUCCESS);
    expect(fakes.emailService.sendPreOrderConfirmationEmail).toHaveBeenCalledWith(tenant, expect.anything(), [{ id: 9n }]);
  });

  it("returns UPDATE_FAILURE and fails the order when the transaction write itself fails", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue(undefined);

    const result = await fakes.service.updateTransactionSuccess({}, {
      loomOrderId: 1n,
      paymentType: "advance",
      razorpayOrderId: "r1",
      transactionId: "t1",
      transactionSignature: sign("r1", "t1"),
    });

    expect(result).toBe(ActionCode.UPDATE_FAILURE);
    expect(fakes.orderService.updateOrderStatusToFailed).toHaveBeenCalledWith(1n, 2);
  });
});

describe("RazorpayPaymentService.updateTransactionFailure", () => {
  let fakes: ReturnType<typeof makeFakes>;
  beforeEach(() => {
    fakes = makeFakes();
  });

  it("returns NO_ACTION when no matching transaction is found", async () => {
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue(null);
    const result = await fakes.service.updateTransactionFailure({ loomOrderId: 1n, razorpayOrderId: "r1", error: { code: "E" } });
    expect(result).toBe(ActionCode.NO_ACTION);
  });

  it("advance payment: marks FAILED, fails the order, and sends the cancel notification email", async () => {
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, tenant: { email: "buyer@example.com" } });
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "advance" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });
    (fakes.orderService.updateOrderStatusToFailed as any).mockResolvedValue(true);

    const result = await fakes.service.updateTransactionFailure({ loomOrderId: 1n, razorpayOrderId: "r1", error: { code: "declined" } });

    expect(result).toBe(ActionCode.UPDATE_SUCCESS);
    expect(fakes.repository.update).toHaveBeenCalledWith(
      5n,
      expect.objectContaining({ status: TransactionStatus.FAILED, failedErrorCode: TransactionFailureCode.PAYMENT_FAILURE }),
    );
    expect(fakes.emailService.sendOrderCancelNotification).toHaveBeenCalledWith(["buyer@example.com"], ["admin@example.com"], null, expect.anything(), "Payment Failure");
  });

  it("remaining payment: records the failure but does not touch order status (characterization)", async () => {
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n, tenant: { email: "buyer@example.com" } });
    (fakes.repository.findByOrderAndRazorpayOrderId as any).mockResolvedValue({ id: 5n, paymentType: "remaining" });
    (fakes.repository.update as any).mockResolvedValue({ id: 5n });

    const result = await fakes.service.updateTransactionFailure({ loomOrderId: 1n, razorpayOrderId: "r1", error: {} });

    expect(fakes.orderService.updateOrderStatusToFailed).not.toHaveBeenCalled();
    expect(result).toBe(ActionCode.UPDATE_SUCCESS);
  });
});

describe("RazorpayPaymentService.updateTransaction (superuser correction, E5)", () => {
  let fakes: ReturnType<typeof makeFakes>;
  beforeEach(() => {
    fakes = makeFakes();
  });

  it("returns NO_ACTION when the order has no transactions", async () => {
    (fakes.repository.findByOrder as any).mockResolvedValue([]);
    const result = await fakes.service.updateTransaction({ loomOrderId: 1n, paymentType: "advance", transactionId: "t1" });
    expect(result).toBe(ActionCode.NO_ACTION);
  });

  it("advance payment: rewrites every transaction on the order to PAID and notifies", async () => {
    (fakes.repository.findByOrder as any).mockResolvedValue([{ id: 1n }, { id: 2n }]);
    (fakes.orderService.getOrderById as any).mockResolvedValue({ id: 1n });
    (fakes.orderService.updateOrderStatusToProcessing as any).mockResolvedValue(true);

    const result = await fakes.service.updateTransaction({ loomOrderId: 1n, paymentType: "advance", transactionId: "t1" });

    expect(fakes.repository.update).toHaveBeenCalledTimes(2);
    expect(fakes.repository.update).toHaveBeenCalledWith(1n, expect.objectContaining({ status: TransactionStatus.PAID, transactionId: "t1" }));
    expect(result).toBe(ActionCode.UPDATE_SUCCESS);
  });
});

describe("RazorpayPaymentService admin projections", () => {
  it("getTransactionData delegates paging straight to the repository", async () => {
    const fakes = makeFakes();
    (fakes.repository.findPaginated as any).mockResolvedValue(["row"]);
    const result = await fakes.service.getTransactionData(1, 20);
    expect(fakes.repository.findPaginated).toHaveBeenCalledWith(1, 20);
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
