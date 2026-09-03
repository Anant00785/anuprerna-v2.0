import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { createHmac } from "node:crypto";
import { PaymentController } from "./payment.controller.js";
import type { RazorpayPaymentService } from "../service/razorpay-payment.service.js";
import type { StripePaymentService } from "../service/stripe-payment.service.js";

// Audit C2: the webhook used to accept the request body as the event as soon as a
// Stripe-Signature header existed. These specs pin the Loom contract
// (StripeWebhookController -> Webhook.constructEvent): the HMAC must verify against
// the configured endpoint secret over the RAW body, and nothing else gets through.
//
// "No DB write" is asserted through the payment services: every transaction write on
// this path goes through handlePaymentSuccess / handlePaymentFailure.

const WEBHOOK_SECRET = "whsec_test_secret";

function makeFakes(secret: string | null = WEBHOOK_SECRET) {
  const razorpayService = {} as unknown as RazorpayPaymentService;

  const stripeService = {
    handlePaymentSuccess: vi.fn(),
    handlePaymentFailure: vi.fn(),
  } as unknown as StripePaymentService;

  const config = { get: vi.fn().mockReturnValue(secret ?? undefined) } as any;

  return { controller: new PaymentController(razorpayService, stripeService, config), stripeService };
}

const event = (type: string) => ({ type, data: { object: { id: "cs_test_1", client_reference_id: "1" } } });

function signed(body: string, secret = WEBHOOK_SECRET, timestamp = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

/** Mimics the Nest `rawBody: true` request shape the handler reads. */
const request = (body: string) => ({ rawBody: Buffer.from(body, "utf8") }) as any;

describe("PaymentController stripe webhook signature verification (audit C2)", () => {
  let fakes: ReturnType<typeof makeFakes>;
  beforeEach(() => {
    fakes = makeFakes();
  });

  it("processes a success event whose signature verifies over the raw body", async () => {
    const body = JSON.stringify(event("checkout.session.completed"));

    const result = await fakes.controller.checkoutStripeWebhook(signed(body), request(body));

    expect(result).toEqual({ status: "Success" });
    expect(fakes.stripeService.handlePaymentSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: "cs_test_1" }),
      expect.objectContaining({ type: "checkout.session.completed" }),
    );
  });

  it("routes failure event types to handlePaymentFailure", async () => {
    const body = JSON.stringify(event("checkout.session.expired"));

    await fakes.controller.checkoutStripeWebhook(signed(body), request(body));

    expect(fakes.stripeService.handlePaymentFailure).toHaveBeenCalled();
    expect(fakes.stripeService.handlePaymentSuccess).not.toHaveBeenCalled();
  });

  it("rejects a tampered payload signed for the original body", async () => {
    const original = JSON.stringify(event("checkout.session.completed"));
    const tampered = JSON.stringify({
      ...event("checkout.session.completed"),
      data: { object: { id: "cs_attacker", client_reference_id: "999" } },
    });

    await expect(fakes.controller.checkoutStripeWebhook(signed(original), request(tampered))).rejects.toThrow(
      BadRequestException,
    );
    expect(fakes.stripeService.handlePaymentSuccess).not.toHaveBeenCalled();
    expect(fakes.stripeService.handlePaymentFailure).not.toHaveBeenCalled();
  });

  it("rejects a signature produced with a different secret", async () => {
    const body = JSON.stringify(event("checkout.session.completed"));

    await expect(
      fakes.controller.checkoutStripeWebhook(signed(body, "whsec_attacker"), request(body)),
    ).rejects.toThrow(BadRequestException);
    expect(fakes.stripeService.handlePaymentSuccess).not.toHaveBeenCalled();
  });

  it("rejects an arbitrary non-empty signature header", async () => {
    const body = JSON.stringify(event("checkout.session.completed"));

    await expect(fakes.controller.checkoutStripeWebhook("anything", request(body))).rejects.toThrow(
      BadRequestException,
    );
    expect(fakes.stripeService.handlePaymentSuccess).not.toHaveBeenCalled();
  });

  it("rejects a missing signature header", async () => {
    const body = JSON.stringify(event("checkout.session.completed"));

    await expect(fakes.controller.checkoutStripeWebhook("", request(body))).rejects.toThrow(BadRequestException);
    expect(fakes.stripeService.handlePaymentSuccess).not.toHaveBeenCalled();
  });

  it("rejects a replayed signature outside the tolerance window", async () => {
    const body = JSON.stringify(event("checkout.session.completed"));
    const stale = Math.floor(Date.now() / 1000) - 3600;

    await expect(
      fakes.controller.checkoutStripeWebhook(signed(body, WEBHOOK_SECRET, stale), request(body)),
    ).rejects.toThrow(BadRequestException);
    expect(fakes.stripeService.handlePaymentSuccess).not.toHaveBeenCalled();
  });

  it("rejects when the raw body is unavailable, rather than verifying nothing", async () => {
    const body = JSON.stringify(event("checkout.session.completed"));

    await expect(fakes.controller.checkoutStripeWebhook(signed(body), {} as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(fakes.stripeService.handlePaymentSuccess).not.toHaveBeenCalled();
  });

  it("fails closed when no endpoint secret is configured, even for an otherwise valid signature", async () => {
    const unconfigured = makeFakes(null);
    const body = JSON.stringify(event("checkout.session.completed"));

    await expect(unconfigured.controller.checkoutStripeWebhook(signed(body), request(body))).rejects.toThrow(
      BadRequestException,
    );
    expect(unconfigured.stripeService.handlePaymentSuccess).not.toHaveBeenCalled();
  });
});
