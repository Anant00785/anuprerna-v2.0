/**
 * apps/api/src/commerce/checkout/service/checkout.service.ts
 *
 * The /checkout/* lane the storefront's real checkout drives:
 *   POST /checkout/order            create a PENDING order
 *   POST /checkout/payment-session  open a gateway session (wired to the
 *                                   EXISTING RazorpayPaymentService /
 *                                   StripePaymentService — never reimplemented)
 *   POST /checkout/payment-callback verify the gateway result server-side
 *   GET  /checkout/order-status/:token  the guest's tokenised status read
 *
 * SECURITY INVARIANTS (each pinned by checkout.service.spec.ts):
 *
 *  MONEY IS COMPUTED HERE. The client's subTotal / total / shippingCost /
 *  discount figures are never read. Subtotal comes from server-verified line
 *  prices x quantities; shipping is priced from the chosen `shipment` DB row;
 *  every line price is checked against the catalogue price floor (base price
 *  minus the best applicable sale/volume discount) so an understated price is
 *  rejected, not billed. Loom's own addOrder carries the TODO "reconstruct
 *  order at the backend" and trusts the payload — this service is that TODO
 *  done.
 *
 *  IDENTITY IS NEVER BODY-NAMED. With a bearer token the customer is the
 *  token's subject and body.guest / body.tenantId are ignored. Without one,
 *  body.guest ({email,name}, injected by the storefront BFF from the httpOnly
 *  ap_guest_checkout cookie) names a GUEST identity only: it can never attach
 *  to a registered account (that returns 409 {exists:true} so the UI offers
 *  sign-in), and the guest tenant row it resolves to cannot authenticate.
 *
 *  GUEST TOKENS ARE UNGUESSABLE AND HASHED. 32 random bytes (base64url),
 *  returned once; only the SHA-256 hex is stored. Order access for a guest is
 *  by hash equality on that order's own sidecar row — one order's token can
 *  never read another order.
 */
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { GatekeeperService } from "../../../auth/service/gatekeeper.service.js";
import { GateCode, type AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { ActionCode } from "../../../common/errors/action-code.js";
import { RazorpayPaymentService } from "../../payment/service/razorpay-payment.service.js";
import { StripePaymentService } from "../../payment/service/stripe-payment.service.js";
import { ShipmentRepository } from "../../shipment/repository/shipment.repository.js";
import type { ShipmentEntity } from "../../shipment/types/shipment.types.js";
import { ForexRepository } from "../../forex/repository/forex.repository.js";
import {
  CheckoutRepository,
  type CheckoutProductRow,
  type CheckoutStore,
  type NewCheckoutOrderItem,
  type OrderCheckoutSidecar,
  type VolumeTierRow,
} from "../repository/checkout.repository.js";

const ORDER_TYPES = new Set(["IN_STOCK", "MADE_TO_ORDER", "PRE_ORDER"]);
const CURRENCIES = new Set(["INR", "USD", "EUR", "GBP"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Tolerance for client-side rounding of a legitimately discounted price. */
const PRICE_EPSILON = 0.01;

export interface CheckoutOrderLine {
  productId: number;
  orderType: "IN_STOCK" | "MADE_TO_ORDER" | "PRE_ORDER";
  productGroup: string;
  price: number;
  quantity: number;
  unit: "UNIT" | "METER";
}

interface ParsedOrderBody {
  currency: string;
  shipmentId: number;
  address: Record<string, unknown>;
  note: string;
  lines: CheckoutOrderLine[];
  guest: { email: string; name: string } | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

@Injectable()
export class CheckoutService {
  // Deps are typed as Picks of the real classes (specs supply structural
  // in-memory fakes without type assertions); the @Inject tokens keep Nest
  // resolving the real providers.
  constructor(
    @Inject(CheckoutRepository) private readonly repository: CheckoutStore,
    @Inject(ShipmentRepository) private readonly shipmentRepository: Pick<ShipmentRepository, "findById">,
    @Inject(ForexRepository) private readonly forexRepository: Pick<ForexRepository, "findLatestExchangeRate">,
    @Inject(GatekeeperService)
    private readonly gatekeeper: Pick<GatekeeperService, "verifyToken" | "userHasAppropriateAuthority">,
    @Inject(RazorpayPaymentService)
    private readonly razorpayService: Pick<RazorpayPaymentService, "createSession" | "updateTransactionSuccess">,
    @Inject(StripePaymentService)
    private readonly stripeService: Pick<StripePaymentService, "createSession" | "handlePaymentSuccess">,
  ) {}

  // ─── Identity ──────────────────────────────────────────────────────────────

  /**
   * The authenticated CUSTOMER behind an Authorization header, or null when
   * none is present. A header that is present but invalid, or valid for a
   * non-customer role, is rejected — it never silently downgrades to guest.
   */
  private resolveCustomer(authHeader: string | undefined): AuthenticatedTenant | null {
    if (!authHeader) return null;
    let token = authHeader.trim();
    while (token.toLowerCase().startsWith("bearer ")) token = token.slice(7).trim();
    if (!token) throw new UnauthorizedException("Missing or malformed Authorization token.");
    const tenant = this.gatekeeper.verifyToken(token);
    if (!this.gatekeeper.userHasAppropriateAuthority(tenant, GateCode.CODE_CU)) {
      throw new UnauthorizedException("Checkout requires a customer account.");
    }
    return tenant;
  }

  // ─── Order creation ────────────────────────────────────────────────────────

  private parseOrderBody(body: Record<string, unknown>, hasToken: boolean): ParsedOrderBody {
    const currencyRaw = String(body.currency ?? "INR").toUpperCase();
    if (!CURRENCIES.has(currencyRaw)) {
      throw new BadRequestException("Unsupported currency.");
    }

    const shipmentId = Number(body.shipmentId ?? 0);
    if (!Number.isInteger(shipmentId) || shipmentId <= 0) {
      throw new BadRequestException("A shipping method is required.");
    }

    const rawItems = body.orderItems;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new BadRequestException("The order has no items.");
    }
    const lines: CheckoutOrderLine[] = rawItems.map((raw, i) => {
      const item = (raw ?? {}) as Record<string, unknown>;
      const productId = Number(item.productId ?? 0);
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      const orderType = String(item.orderType ?? "");
      if (!Number.isInteger(productId) || productId <= 0) {
        throw new BadRequestException(`Order line ${i + 1} names no product.`);
      }
      if (!Number.isFinite(price) || price <= 0) {
        throw new BadRequestException(`Order line ${i + 1} has no usable price.`);
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`Order line ${i + 1} has no usable quantity.`);
      }
      if (!ORDER_TYPES.has(orderType)) {
        throw new BadRequestException(`Order line ${i + 1} has an unknown order type.`);
      }
      const unitRaw = String(item.unit ?? "UNIT").toUpperCase();
      return {
        productId,
        orderType: orderType as CheckoutOrderLine["orderType"],
        productGroup: String(item.productGroup ?? ""),
        price,
        quantity,
        unit: unitRaw === "METER" ? "METER" : "UNIT",
      };
    });

    // GUEST IDENTITY: read ONLY when there is no token. The storefront BFF
    // deletes any body-supplied `guest` and re-injects it from the httpOnly
    // cookie; a token-bearing request must never be re-identified by its body.
    let guest: ParsedOrderBody["guest"] = null;
    if (!hasToken) {
      const rawGuest = (body.guest ?? null) as Record<string, unknown> | null;
      const email = String(rawGuest?.email ?? "").trim().toLowerCase();
      if (!rawGuest || !EMAIL_RE.test(email)) {
        throw new UnauthorizedException("Start checkout with your email first.");
      }
      guest = { email, name: String(rawGuest.name ?? "").trim().slice(0, 150) };
    }

    return {
      currency: currencyRaw,
      shipmentId,
      address: (body.address ?? {}) as Record<string, unknown>,
      note: String(body.note ?? "").slice(0, 2000),
      lines,
      guest,
    };
  }

  /**
   * The lowest unit price the catalogue can legitimately produce for this
   * product at this quantity: base price minus the LARGER of the sale discount
   * and the best matching volume tier (the storefront applies tier discounts
   * off the base price; sale pricing is an alternative path to a lower price).
   */
  private priceFloor(product: CheckoutProductRow, quantity: number, tiers: VolumeTierRow[]): number {
    let pct = 0;
    if (product.sale && product.discount > 0) pct = product.discount;
    if (product.volumeDiscountProfileEnabled && product.volumeDiscountProfileId !== null) {
      const eligible = tiers
        .filter((t) => t.profileId === product.volumeDiscountProfileId && t.minimumOrderQuantity <= quantity)
        .sort((a, b) => b.minimumOrderQuantity - a.minimumOrderQuantity);
      const tierPct = eligible[0]?.discount ?? 0;
      if (tierPct > pct) pct = tierPct;
    }
    return product.price * (1 - Math.min(100, Math.max(0, pct)) / 100);
  }

  /**
   * Shipping priced from the chosen shipment DB row — the exact formula the
   * live checkout displays to the buyer (components/checkout/types.ts
   * `shipmentCost`): baseAmount plus additionalAmount for every unit above
   * baseQuantity, over the order's TOTAL quantity. Live Loom never priced
   * shipping at all (Orders.java stores whatever the request said); this is
   * where the figure now comes from, and the only place.
   */
  private shippingCostFor(shipmentRow: ShipmentEntity, lines: CheckoutOrderLine[]): number {
    const totalQty = lines.reduce((sum, line) => sum + line.quantity, 0);
    const base = Number(shipmentRow.baseAmount);
    const baseQty = Number(shipmentRow.baseQuantity);
    const add = Number(shipmentRow.additionalAmount);
    return round2(base + add * Math.max(0, totalQty - baseQty));
  }

  async createOrder(authHeader: string | undefined, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const customer = this.resolveCustomer(authHeader);
    const parsed = this.parseOrderBody(body, customer !== null);

    // ── Server-side pricing. Every line must resolve to a catalogue product,
    // and its price must not undercut the catalogue floor. Overpaying is legal
    // (customisation add-ons raise the price above the base catalogue figure);
    // underpaying is not.
    const productRows = await this.repository.findProductsByIds([...new Set(parsed.lines.map((l) => l.productId))]);
    const products = new Map(productRows.map((p) => [p.id, p]));
    const tierProfileIds = [
      ...new Set(
        productRows
          .filter((p) => p.volumeDiscountProfileEnabled && p.volumeDiscountProfileId !== null)
          .map((p) => p.volumeDiscountProfileId as number),
      ),
    ];
    const tiers = await this.repository.findVolumeTiers(tierProfileIds);

    let subtotalInr = 0;
    for (const line of parsed.lines) {
      const product = products.get(line.productId);
      if (!product) {
        throw new BadRequestException(`Order line names a product that does not exist (${line.productId}).`);
      }
      const floor = this.priceFloor(product, line.quantity, tiers);
      if (line.price < floor - PRICE_EPSILON) {
        throw new BadRequestException("An order line is priced below the catalogue price.");
      }
      subtotalInr += line.price * line.quantity;
    }
    subtotalInr = round2(subtotalInr);

    // ── Shipping from the chosen shipment record — the client's shipping
    // figure (if it sent one) is never read.
    const shipmentRow = await this.shipmentRepository.findById(BigInt(parsed.shipmentId));
    if (!shipmentRow) {
      throw new BadRequestException("The chosen shipping method does not exist.");
    }
    const shippingInr = this.shippingCostFor(shipmentRow, parsed.lines);
    const totalInr = round2(subtotalInr + shippingInr);

    // The live checkout lane charges the FULL total at checkout ("Pay <total>"
    // is the button) — no advance/remaining split exists in it. advancePay is
    // what the payment services charge, so it carries the whole total.

    // ── Currency conversion, server-side. Rates are per 1 INR (the day's
    // market rate, Loom forex_exchange_rate). No rate on file for a non-INR
    // order is a hard failure — a rate is money and is never invented.
    let rate = 1;
    if (parsed.currency !== "INR") {
      const forex = await this.forexRepository.findLatestExchangeRate();
      const found = forex
        ? { USD: forex.usd, EUR: forex.eur, GBP: forex.gbp }[parsed.currency as "USD" | "EUR" | "GBP"]
        : undefined;
      if (!found || !Number.isFinite(found) || found <= 0) {
        throw new BadRequestException(`No exchange rate is available for ${parsed.currency}.`);
      }
      rate = found;
    }
    const total = round2(totalInr * rate);
    const advancePay = total;
    const remainingPay = 0;

    // ── The customer. Token subject, or the guest identity from the cookie.
    let tenantId: number;
    let guestOrder = false;
    if (customer) {
      tenantId = Number(customer.tenantId ?? customer.id);
      if (!Number.isInteger(tenantId) || tenantId <= 0) {
        throw new UnauthorizedException("No authenticated tenant on the request.");
      }
    } else {
      const guest = parsed.guest as { email: string; name: string };
      const existing = await this.repository.findTenantByEmail(guest.email);
      if (existing && existing.userType !== "guest") {
        throw new ConflictException({
          success: false,
          exists: true,
          message: "This email already has an account. Sign in to continue.",
        });
      }
      tenantId = existing ? existing.id : await this.repository.createGuestTenant(guest.email, guest.name);
      guestOrder = true;
    }

    // ── Provider routing is the SERVER's decision, recorded at creation:
    // INR orders go to Razorpay, everything else to Stripe.
    const paymentMode: "RAZORPAY" | "STRIPE" = parsed.currency === "INR" ? "RAZORPAY" : "STRIPE";

    // ── Guest order-status token: 32 random bytes, stored only as SHA-256.
    const guestToken = guestOrder ? randomBytes(32).toString("base64url") : "";

    const orderId = await this.repository.createOrderWithItems(
      {
        tenantId,
        subTotal: subtotalInr.toFixed(2),
        shippingMode: {
          id: Number(shipmentRow.id),
          name: shipmentRow.name,
          locationType: shipmentRow.locationType,
        },
        shippingCost: shippingInr.toFixed(2),
        total: total.toFixed(2),
        currency: parsed.currency,
        advancePay: advancePay.toFixed(2),
        remainingPay: remainingPay.toFixed(2),
        exchangeRate: String(rate),
        address: parsed.address,
        note: parsed.note,
        paymentMode,
      },
      parsed.lines.map(
        (line): NewCheckoutOrderItem => ({
          orderType: line.orderType,
          productGroup: line.productGroup || products.get(line.productId)?.productGroup || "finished",
          quantity: String(line.quantity),
          unit: line.unit,
          // Line prices are catalogue rupees, exactly as verified above.
          price: line.price.toFixed(2),
          currency: "INR",
          customization: { productId: line.productId },
        }),
      ),
      {
        guestOrder,
        guestTokenHash: guestOrder ? sha256Hex(guestToken) : "",
        paymentProvider: paymentMode.toLowerCase(),
      },
    );

    const response: Record<string, unknown> = {
      success: true,
      orderId,
      orderNumber: `AP-${orderId}`,
      amount: total,
      currency: parsed.currency,
      guestOrder,
    };
    if (guestOrder) response.guestToken = guestToken;
    return response;
  }

  // ─── Order access (token OR guest token) ───────────────────────────────────

  /**
   * The ONE authorisation gate for payment-session and payment-callback:
   * a bearer token must belong to the order's own tenant; a guest token must
   * hash-match the order's OWN sidecar row. Anything else is a 404/401 —
   * never a fall-through.
   */
  private async authorizeOrderAccess(
    orderId: number,
    authHeader: string | undefined,
    guestTokenHeader: string | undefined,
  ): Promise<{ sidecar: OrderCheckoutSidecar }> {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new BadRequestException("orderId is required.");
    }
    const sidecar = await this.repository.findSidecarByOrderId(orderId);
    if (!sidecar) throw new NotFoundException("Order not found.");

    const customer = this.resolveCustomer(authHeader);
    if (customer) {
      const status = await this.repository.findOrderForStatus(orderId);
      const tenantId = Number(customer.tenantId ?? customer.id);
      if (!status || Number(status.order.tenantId) !== tenantId) {
        throw new NotFoundException("Order not found.");
      }
      return { sidecar };
    }

    if (!guestTokenHeader || !sidecar.guestOrder || sha256Hex(guestTokenHeader) !== sidecar.guestTokenHash) {
      throw new UnauthorizedException("No checkout in progress.");
    }
    return { sidecar };
  }

  // ─── Payment session ───────────────────────────────────────────────────────

  async createPaymentSession(
    authHeader: string | undefined,
    guestTokenHeader: string | undefined,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const orderId = Number(body?.orderId ?? 0);
    const { sidecar } = await this.authorizeOrderAccess(orderId, authHeader, guestTokenHeader);

    const status = await this.repository.findOrderForStatus(orderId);
    if (!status) throw new NotFoundException("Order not found.");
    const order = status.order;

    // The provider was decided and recorded at order creation; a client's
    // preference cannot reroute an order to a different gateway.
    if (sidecar.paymentProvider === "razorpay") {
      const session = await this.razorpayService.createSession(null, { orderId: BigInt(orderId), paymentType: "advance" });
      await this.repository.updateSidecarSession(orderId, session.razorpayOrderId, session.razorpayOrderId);
      return {
        success: true,
        session: {
          provider: "razorpay",
          sessionId: session.razorpayOrderId,
          providerOrderId: session.razorpayOrderId,
          orderId,
          // Major units; the client converts to paise for the modal.
          amount: Number(order.advancePay),
          currency: order.currency,
          keyId: session.key,
          checkoutUrl: null,
          expiresAt: 0,
        },
      };
    }

    if (sidecar.paymentProvider === "stripe") {
      const session = await this.stripeService.createSession(null, {
        loomOrderId: BigInt(orderId),
        paymentType: "advance",
        currency: order.currency,
        // The ORDER's server-computed advance, never a client figure.
        totalAmount: BigInt(Math.round(Number(order.advancePay))),
        customerEmail: status.buyerEmail,
        customerName: "",
        customerPhone: "",
        customerCountryCode: "",
        customerShippingCountryCode: "",
      });
      await this.repository.updateSidecarSession(orderId, session.sessionId, session.sessionId);
      return {
        success: true,
        session: {
          provider: "stripe",
          sessionId: session.sessionId,
          providerOrderId: session.sessionId,
          orderId,
          amount: Number(order.advancePay),
          currency: order.currency,
          keyId: "",
          checkoutUrl: session.checkoutUrl,
          expiresAt: 0,
        },
      };
    }

    throw new BadRequestException("No payment provider is recorded for this order.");
  }

  // ─── Payment callback ──────────────────────────────────────────────────────

  async paymentCallback(
    authHeader: string | undefined,
    guestTokenHeader: string | undefined,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const orderId = Number(body?.orderId ?? 0);
    const { sidecar } = await this.authorizeOrderAccess(orderId, authHeader, guestTokenHeader);

    if (sidecar.paymentProvider === "razorpay") {
      const providerOrderId = String(body?.providerOrderId ?? "");
      const providerPaymentId = String(body?.providerPaymentId ?? "");
      const signature = String(body?.signature ?? "");
      if (!providerOrderId || !providerPaymentId || !signature) {
        throw new BadRequestException("Payment could not be verified.");
      }
      // Delegated to the EXISTING hardened service: HMAC-SHA256 over
      // `<order>|<payment>` in constant time, no secret => reject, unknown
      // transaction => NO_ACTION (which is a failure here, not a success).
      const code = await this.razorpayService.updateTransactionSuccess(null, {
        loomOrderId: BigInt(orderId),
        paymentType: "advance",
        razorpayOrderId: providerOrderId,
        transactionId: providerPaymentId,
        transactionSignature: signature,
      });
      if (code !== ActionCode.UPDATE_SUCCESS) {
        throw new BadRequestException("Payment could not be verified.");
      }
      return { success: true, paymentProvider: "razorpay" };
    }

    if (sidecar.paymentProvider === "stripe") {
      // The browser return carries no signature (that exists only on webhook
      // bodies). Stripe itself is the source of truth: fetch the session with
      // the SECRET key and require payment_status=paid for THIS order before
      // handing it to the existing success handler (which additionally
      // refuses any session id the API did not itself create).
      const sessionId = String(body?.sessionId ?? "");
      if (!sessionId.startsWith("cs_")) {
        throw new BadRequestException("Payment could not be verified.");
      }
      const secret = process.env.STRIPE_KEY_SECRET;
      if (!secret) throw new BadRequestException("Stripe is not configured.");
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (!response.ok) throw new BadRequestException("Payment could not be verified.");
      const session = (await response.json()) as {
        id?: string;
        payment_status?: string;
        client_reference_id?: string;
      };
      if (session?.payment_status !== "paid" || String(session?.client_reference_id) !== String(orderId)) {
        throw new BadRequestException("Payment could not be verified.");
      }
      await this.stripeService.handlePaymentSuccess(session, { type: "checkout.session.completed" });
      return { success: true, paymentProvider: "stripe" };
    }

    throw new BadRequestException("No payment provider is recorded for this order.");
  }

  // ─── Payment mode ──────────────────────────────────────────────────────────

  /** Which gateway would take an order in this currency, and whether it charges. */
  paymentMode(currency: string): Record<string, unknown> {
    const cur = String(currency || "INR").toUpperCase();
    if (cur === "INR") {
      const configured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
      return { success: configured, provider: configured ? "razorpay" : "", charges: configured };
    }
    const configured = Boolean(process.env.STRIPE_KEY_SECRET);
    return { success: configured, provider: configured ? "stripe" : "", charges: configured };
  }

  // ─── Guest order-status read ───────────────────────────────────────────────

  /**
   * The tokenised status read. The token IS the authorisation: it is matched
   * by SHA-256 hash against the sidecar row it was minted with, so it can
   * read exactly one order. The projection is explicit — never a raw entity
   * dump (no tenant id, no internal codes).
   */
  async orderStatus(token: string): Promise<Record<string, unknown>> {
    const clean = String(token ?? "").trim();
    // 32 random bytes base64url-encode to 43 chars; anything shorter is junk.
    if (clean.length < 32) throw new NotFoundException("Order not found.");
    const sidecar = await this.repository.findSidecarByTokenHash(sha256Hex(clean));
    if (!sidecar) throw new NotFoundException("Order not found.");

    const status = await this.repository.findOrderForStatus(sidecar.orderId);
    if (!status) throw new NotFoundException("Order not found.");
    const { order, items, buyerEmail } = status;

    const paid = items.length > 0 && items.every((it) => it.paymentStatus === "PAID");
    return {
      success: true,
      order: {
        id: Number(order.id),
        orderNumber: `AP-${order.id}`,
        createdAt: Number(order.createdAt ?? 0),
        subTotal: Number(order.subTotal),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        currency: order.currency,
        address: order.address,
        orderItems: items.map((it) => ({
          id: Number(it.id),
          orderType: it.orderType,
          productGroup: it.productGroup,
          quantity: Number(it.quantity),
          unit: it.unit,
          price: Number(it.price),
          currency: it.currency,
          orderStatus: it.orderStatus,
          paymentStatus: it.paymentStatus,
        })),
        buyerEmail,
        guestOrder: sidecar.guestOrder,
        paymentState: paid ? "PAID" : "PENDING",
        paymentProvider: sidecar.paymentProvider || null,
        accountInvite: { available: false },
      },
    };
  }
}
