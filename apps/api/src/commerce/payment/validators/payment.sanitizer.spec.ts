import { describe, it, expect } from "vitest";
import {
  sanitizeRazorpayPaymentInput,
  sanitizeRazorpayPaymentSuccessInput,
  sanitizeRazorpayPaymentFailureInput,
  sanitizeRazorpayPaymentUpdateInput,
  sanitizeStripePaymentOrderInput,
} from "./payment.sanitizer.js";

describe("sanitizeRazorpayPaymentInput", () => {
  it("trims and HTML-escapes paymentType", () => {
    const out = sanitizeRazorpayPaymentInput({ orderId: 1n, paymentType: '  <b>advance</b>  ' });
    expect(out.paymentType).toBe("&lt;b&gt;advance&lt;/b&gt;");
  });
});

describe("sanitizeRazorpayPaymentSuccessInput", () => {
  it("escapes all string fields, leaves loomOrderId untouched", () => {
    const out = sanitizeRazorpayPaymentSuccessInput({
      loomOrderId: 5n,
      paymentType: "advance",
      razorpayOrderId: "o&1",
      transactionId: "t<1>",
      transactionSignature: "s'1",
    });
    expect(out.razorpayOrderId).toBe("o&amp;1");
    expect(out.transactionId).toBe("t&lt;1&gt;");
    expect(out.transactionSignature).toBe("s&#x27;1");
    expect(out.loomOrderId).toBe(5n);
  });
});

describe("sanitizeRazorpayPaymentFailureInput", () => {
  it("escapes razorpayOrderId only", () => {
    const out = sanitizeRazorpayPaymentFailureInput({ loomOrderId: 1n, razorpayOrderId: '"x"', error: {} });
    expect(out.razorpayOrderId).toBe("&quot;x&quot;");
  });
});

describe("sanitizeRazorpayPaymentUpdateInput", () => {
  it("escapes paymentType and transactionId", () => {
    const out = sanitizeRazorpayPaymentUpdateInput({ loomOrderId: 1n, paymentType: "a<b", transactionId: "c>d" });
    expect(out.paymentType).toBe("a&lt;b");
    expect(out.transactionId).toBe("c&gt;d");
  });
});

describe("sanitizeStripePaymentOrderInput", () => {
  it("escapes every string field on the payload", () => {
    const out = sanitizeStripePaymentOrderInput({
      loomOrderId: 1n,
      paymentType: "advance",
      currency: "USD",
      totalAmount: 100n,
      customerEmail: 'a&b@x.com',
      customerName: "<script>",
      customerPhone: "1'2",
      customerCountryCode: "I<N",
      customerShippingCountryCode: "I>N",
    });
    expect(out.customerEmail).toBe("a&amp;b@x.com");
    expect(out.customerName).toBe("&lt;script&gt;");
    expect(out.customerPhone).toBe("1&#x27;2");
    expect(out.customerCountryCode).toBe("I&lt;N");
    expect(out.customerShippingCountryCode).toBe("I&gt;N");
  });
});
