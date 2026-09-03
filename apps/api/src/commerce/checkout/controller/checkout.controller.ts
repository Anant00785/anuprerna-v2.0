/**
 * apps/api/src/commerce/checkout/controller/checkout.controller.ts
 *
 * The /checkout/* endpoint family the storefront's real checkout calls.
 * These endpoints existed NOWHERE before this controller — not in live Loom,
 * not in this API — which is why guest checkout died with "Could not create
 * the order."
 *
 * THE GATE BOUNDARY, deliberately: every route here is public to the
 * RolesGuard (no @RequireGate), because a guest by definition has no token —
 * gating any of these CODE_CU would make guest checkout impossible. Public
 * does NOT mean ungated-and-trusting:
 *   - a bearer token, when present, is fully verified (signature + CODE_CU
 *     authority) inside CheckoutService.resolveCustomer, and names the buyer;
 *   - without one, order creation requires the guest identity the storefront
 *     BFF injects from its httpOnly cookie, and every later step requires the
 *     unguessable per-order guest token (X-Guest-Token), matched by SHA-256
 *     hash against that order's own sidecar row;
 *   - the order-status read is authorised by the token in the URL alone —
 *     that token is 32 random bytes and stored only as a hash.
 * The gates spec pins all of this as intentionally-public, so a future
 * @RequireGate cannot silently break guests, and an accidental removal of the
 * in-handler checks is caught by checkout.service.spec.ts.
 */
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Headers, Inject, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse } from "../../../common/response/rain-response.js";
import { ShipmentService } from "../../shipment/service/shipment.service.js";
import { CheckoutService } from "../service/checkout.service.js";

@ApiTags("Checkout")
@Controller()
@UseGuards(RolesGuard)
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    @Inject(ShipmentService) private readonly shipmentService: Pick<ShipmentService, "getShipmentList">,
  ) {}

  @Get("/checkout/payment-mode")
  @ApiOperation({ summary: "Which gateway takes an order in this currency, and whether it charges." })
  @ApiQuery({ name: "currency", required: false, example: "INR" })
  paymentMode(@Query("currency") currency = "INR") {
    return this.checkoutService.paymentMode(currency);
  }

  /**
   * The GUEST-readable shipping rate card. /get/shipment-list is CODE_SUCU and
   * unreachable without a token; a guest must still see (and be priced by) the
   * same records. Rate-card rows carry no customer data.
   */
  @Get("/checkout/shipment-list")
  @ApiOperation({ summary: "Shipping options (guest-readable rate card)." })
  async shipmentList() {
    const list = await this.shipmentService.getShipmentList();
    return keyedResponse("shipmentList", list);
  }

  @Post("/checkout/order")
  @ApiOperation({ summary: "Create a PENDING order. Money is computed server-side; identity from token or guest cookie." })
  @ApiBody({ description: "{ currency, shipmentId, address, orderItems, note, guest? }" })
  async createOrder(
    @Headers("authorization") authHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.checkoutService.createOrder(authHeader, body ?? {});
  }

  @Post("/checkout/payment-session")
  @ApiOperation({ summary: "Open a payment session for an order (Razorpay/Stripe, decided at order creation)." })
  @ApiBody({ description: "{ orderId }" })
  async createPaymentSession(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-guest-token") guestToken: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.checkoutService.createPaymentSession(authHeader, guestToken, body ?? {});
  }

  @Post("/checkout/payment-callback")
  @ApiOperation({ summary: "Verify a gateway result server-side and mark the order paid." })
  @ApiBody({ description: "{ orderId, sessionId, providerOrderId, providerPaymentId, signature }" })
  async paymentCallback(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-guest-token") guestToken: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.checkoutService.paymentCallback(authHeader, guestToken, body ?? {});
  }

  @Get("/checkout/order-status/:token")
  @ApiOperation({ summary: "Guest order status. The unguessable token IS the authorisation." })
  @ApiParam({ name: "token", description: "The 32-random-byte order-status token" })
  async orderStatus(@Param("token") token: string) {
    return this.checkoutService.orderStatus(token);
  }

  /**
   * The mocked sandbox gateway. This API has no sandbox payment provider —
   * only the real Razorpay/Stripe integrations — and the storefront contract
   * says this route 404s whenever the active provider is not the sandbox one.
   * Implementing a "sandbox" that self-signs with the real key secret would be
   * a payment bypass, so this is a genuine 404, always.
   */
  @Post("/checkout/sandbox-gateway/complete")
  @ApiOperation({ summary: "Sandbox gateway stand-in — always 404: no sandbox provider exists in this API." })
  sandboxGateway(): never {
    throw new NotFoundException("The sandbox gateway is not available for the active payment provider.");
  }
}
