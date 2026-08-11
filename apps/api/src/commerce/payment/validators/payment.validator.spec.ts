import { describe, it, expect } from "vitest";
import {
  validateRazorpayPaymentInput,
  validateRazorpayPaymentSuccessInput,
  validateRazorpayPaymentFailureInput,
  validateRazorpayPaymentUpdateInput,
  validateStripePaymentOrderInput,
} from "./payment.validator.js";

// Contract: docs/backend/commerce/02-api-documentation.md §E.1 (E1) and §E.2 (E8);
// stub note: docs/backend/commerce/04-migration-checklist.md, Payment row "E1–E7 (Razorpay)".

describe("validateRazorpayPaymentInput", () => {
  it("accepts a valid input", () => {
    expect(validateRazorpayPaymentInput({ orderId: 1n, paymentType: "advance" })).toBeNull();
  });

  it("rejects a non-positive orderId (current port behaviour)", () => {
    expect(validateRazorpayPaymentInput({ orderId: 0n, paymentType: "advance" })).toMatch(/Order ID/);
  });

  // Doc + checklist: `RazorpayPaymentOrderValidator` is documented as a stub that
  // "always returns true" (checklist row "Payment | E1–E7 (Razorpay)" — pending team
  // decision, must not be strengthened). This port's `validateRazorpayPaymentInput`
  // diverges from that documented stub by actually rejecting a non-positive orderId.
  // Testing the documented contract per docs/TESTING.md §4; not "fixing" the port.
  it.fails("documented contract: validator is a stub and never rejects (diverges from port)", () => {
    expect(validateRazorpayPaymentInput({ orderId: 0n, paymentType: "" })).toBeNull();
  });
});

describe("validateRazorpayPaymentSuccessInput", () => {
  const valid = {
    loomOrderId: 1n,
    paymentType: "advance",
    razorpayOrderId: "order_1",
    transactionId: "txn_1",
    transactionSignature: "sig",
  };

  it("accepts a valid input", () => {
    expect(validateRazorpayPaymentSuccessInput(valid)).toBeNull();
  });

  it("rejects a missing loomOrderId", () => {
    expect(validateRazorpayPaymentSuccessInput({ ...valid, loomOrderId: 0n })).toMatch(/Loom Order ID/);
  });

  it("rejects a blank transactionSignature", () => {
    expect(validateRazorpayPaymentSuccessInput({ ...valid, transactionSignature: "  " })).toMatch(/signature/);
  });
});

describe("validateRazorpayPaymentFailureInput", () => {
  const valid = { loomOrderId: 1n, razorpayOrderId: "order_1", error: { code: "x" } };

  it("accepts a valid input", () => {
    expect(validateRazorpayPaymentFailureInput(valid)).toBeNull();
  });

  it("rejects a missing error payload", () => {
    expect(validateRazorpayPaymentFailureInput({ ...valid, error: undefined })).toMatch(/Error details/);
  });
});

describe("validateRazorpayPaymentUpdateInput", () => {
  const valid = { loomOrderId: 1n, paymentType: "advance", transactionId: "txn_1" };

  it("accepts a valid input", () => {
    expect(validateRazorpayPaymentUpdateInput(valid)).toBeNull();
  });

  it("rejects a blank transactionId", () => {
    expect(validateRazorpayPaymentUpdateInput({ ...valid, transactionId: "" })).toMatch(/Transaction ID/);
  });
});

describe("validateStripePaymentOrderInput", () => {
  const valid = {
    loomOrderId: 1n,
    paymentType: "advance",
    currency: "USD",
    totalAmount: 100n,
    customerEmail: "a@b.com",
    customerName: "A",
    customerPhone: "1",
    customerCountryCode: "IN",
    customerShippingCountryCode: "IN",
  };

  it("accepts a valid input", () => {
    expect(validateStripePaymentOrderInput(valid)).toBeNull();
  });

  it("rejects totalAmount <= 0", () => {
    expect(validateStripePaymentOrderInput({ ...valid, totalAmount: 0n })).toMatch(/Total amount/);
  });

  it("rejects loomOrderId <= 0", () => {
    expect(validateStripePaymentOrderInput({ ...valid, loomOrderId: 0n })).toMatch(/Loom Order ID/);
  });

  // Doc §E.2 (E8): `paymentType` must be exactly "advance" or "remaining". The port
  // only checks non-blank, so an arbitrary string is wrongly accepted.
  it.fails("documented contract: paymentType must be advance|remaining (port only checks non-blank)", () => {
    expect(validateStripePaymentOrderInput({ ...valid, paymentType: "bogus" })).not.toBeNull();
  });

  // Doc §E.2 (E8): `customerEmail` must be 5-255 chars. The port never inspects
  // customerEmail at all.
  it.fails("documented contract: customerEmail length is checked (port ignores customerEmail)", () => {
    expect(validateStripePaymentOrderInput({ ...valid, customerEmail: "a@b" })).not.toBeNull();
  });

  // Doc §E.2 (E8): `currency` must be a valid CURRENCY_ENUM. The port only checks
  // non-blank, so any non-empty string passes.
  it.fails("documented contract: currency must be a valid enum (port only checks non-blank)", () => {
    expect(validateStripePaymentOrderInput({ ...valid, currency: "NOT_A_CURRENCY" })).not.toBeNull();
  });
});
