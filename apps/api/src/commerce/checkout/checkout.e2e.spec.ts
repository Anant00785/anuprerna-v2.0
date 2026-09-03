/**
 * apps/api/src/commerce/checkout/checkout.e2e.spec.ts
 *
 * Route-level end-to-end specs for the /checkout/* family, with the DB mocked
 * (an in-memory world behind the repository surfaces) and everything above it
 * REAL: the real CheckoutController, the real CheckoutService, the real
 * GatekeeperService verifying real JWTs, and the real RazorpayPaymentService
 * doing real HMAC signature verification against a test key secret. The only
 * network call — Razorpay's order-create — is a stubbed global fetch.
 *
 * What these pin:
 *  - guest order -> payment session -> signed callback marks the order paid
 *  - the same flow for an authenticated buyer
 *  - client-supplied totals/shipping/subtotals are IGNORED for the server's
 *  - a body-supplied `guest` cannot override the token identity
 *  - an invalid or forged callback does not mark an order paid; a replayed
 *    valid callback is an idempotent no-op
 *  - a guest token from one order cannot act on or read another order
 *  - an understated line price is rejected against the catalogue floor
 *  - a guest email belonging to a registered account is refused with
 *    {exists:true} (the storefront then offers sign-in)
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHmac } from "node:crypto";
import * as schema from "../../database/schema/schema.js";
import { GatekeeperService } from "../../auth/service/gatekeeper.service.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { RazorpayPaymentService } from "../payment/service/razorpay-payment.service.js";
import { RazorpayTransactionRepository } from "../payment/repository/payment.repository.js";
import type { EmailServicePort, OrderServicePort, WhatsappServicePort } from "../payment/ports/payment.ports.js";
import type { StripePaymentService } from "../payment/service/stripe-payment.service.js";
import type { ShipmentRepository } from "../shipment/repository/shipment.repository.js";
import type { ShipmentEntity } from "../shipment/types/shipment.types.js";
import type { ForexRepository } from "../forex/repository/forex.repository.js";
import { CheckoutController } from "./controller/checkout.controller.js";
import { CheckoutService } from "./service/checkout.service.js";
import type {
  CheckoutOrderView,
  CheckoutProductRow,
  CheckoutStore,
  NewCheckoutOrder,
  NewCheckoutOrderItem,
  OrderCheckoutSidecar,
  VolumeTierRow,
} from "./repository/checkout.repository.js";

const RZP_KEY_ID = "rzp_test_key";
const RZP_KEY_SECRET = "rzp_test_secret_never_real";

// Real Gatekeeper (same construction as common/testing/gate-spec.ts).
const fakeConfig = {
  get: (key: string) =>
    ({ AUTH_JWT_SECRET: "test-jwt-secret-not-real", AUTH_PASSWORD_PEPPER: "test-pepper", AUTH_JWT_TTL_SECONDS: 3600 })[
      key
    ],
} as never;
const gatekeeper = new GatekeeperService(fakeConfig);

type RzpRow = typeof schema.razorpayTransaction.$inferSelect;

/** In-memory checkout world: orders, items, sidecars, tenants, catalogue. */
class World {
  nextOrderId = 1000;
  nextTenantId = 500;
  orders = new Map<number, CheckoutOrderView>();
  sidecars = new Map<number, OrderCheckoutSidecar>();
  tenants = new Map<string, { id: number; userType: string; userName: string }>();
  products: CheckoutProductRow[] = [
    {
      id: 11,
      price: 1000,
      sale: false,
      discount: 0,
      name: "Handloom Cotton",
      sku: "HC-11",
      productGroup: "fabric",
      volumeDiscountProfileEnabled: false,
      volumeDiscountProfileId: null,
    },
    {
      id: 12,
      price: 1000,
      sale: false,
      discount: 0,
      name: "Silk Blend",
      sku: "SB-12",
      productGroup: "fabric",
      volumeDiscountProfileEnabled: true,
      volumeDiscountProfileId: 9,
    },
  ];
  tiers: VolumeTierRow[] = [{ profileId: 9, minimumOrderQuantity: 10, discount: 10 }];
  shipments: ShipmentEntity[] = [
    {
      id: 5n,
      version: 1n,
      name: "Regular - By Road",
      baseAmount: 150,
      baseQuantity: 1,
      additionalAmount: 50,
      estimatedFromDay: 4,
      estimatedToDay: 9,
      locationType: "DOMESTIC" as ShipmentEntity["locationType"],
    },
  ];
  rzpRows: RzpRow[] = [];
  nextRzpId = 1;

  constructor() {
    this.tenants.set("registered@example.com", { id: 77, userType: "registered", userName: "Reg" });
  }

  store: CheckoutStore = {
    findTenantByEmail: async (email) => this.tenants.get(email.trim().toLowerCase()) ?? null,
    createGuestTenant: async (email, name) => {
      const id = this.nextTenantId++;
      this.tenants.set(email.trim().toLowerCase(), { id, userType: "guest", userName: name || "Guest" });
      return id;
    },
    createOrderWithItems: async (
      order: NewCheckoutOrder,
      items: NewCheckoutOrderItem[],
      sidecar: { guestOrder: boolean; guestTokenHash: string; paymentProvider: string },
    ) => {
      const orderId = this.nextOrderId++;
      const buyer = [...this.tenants.values()].find((t) => t.id === order.tenantId);
      const buyerEmail = [...this.tenants.entries()].find(([, t]) => t.id === order.tenantId)?.[0] ?? "";
      this.orders.set(orderId, {
        order: {
          id: orderId,
          tenantId: order.tenantId,
          subTotal: Number(order.subTotal),
          shippingCost: Number(order.shippingCost),
          total: Number(order.total),
          currency: order.currency,
          advancePay: Number(order.advancePay),
          remainingPay: Number(order.remainingPay),
          address: order.address,
          createdAt: Date.now(),
        },
        items: items.map((it, i) => ({
          id: i + 1,
          orderType: it.orderType,
          productGroup: it.productGroup,
          quantity: Number(it.quantity),
          unit: it.unit,
          price: Number(it.price),
          currency: it.currency,
          orderStatus: "INITIATED",
          paymentStatus: "PENDING",
        })),
        buyerEmail,
        buyerUserType: buyer?.userType ?? "",
      });
      this.sidecars.set(orderId, {
        id: orderId,
        orderId,
        guestOrder: sidecar.guestOrder,
        guestTokenHash: sidecar.guestTokenHash,
        paymentProvider: sidecar.paymentProvider,
        sessionId: "",
        providerOrderId: "",
        createdAt: Date.now(),
      });
      return orderId;
    },
    findSidecarByOrderId: async (orderId) => this.sidecars.get(orderId) ?? null,
    findSidecarByTokenHash: async (hash) => {
      if (!hash) return null;
      for (const sc of this.sidecars.values()) {
        if (sc.guestOrder && sc.guestTokenHash === hash) return sc;
      }
      return null;
    },
    updateSidecarSession: async (orderId, sessionId, providerOrderId) => {
      const sc = this.sidecars.get(orderId);
      if (sc) {
        sc.sessionId = sessionId;
        sc.providerOrderId = providerOrderId;
      }
    },
    findProductsByIds: async (ids) => this.products.filter((p) => ids.includes(p.id)),
    findVolumeTiers: async (profileIds) => this.tiers.filter((t) => profileIds.includes(t.profileId)),
    findOrderForStatus: async (orderId) => this.orders.get(orderId) ?? null,
  };

  shipmentRepo: Pick<ShipmentRepository, "findById"> = {
    findById: async (id: bigint) => this.shipments.find((s) => s.id === id) ?? null,
  };

  forexRepo: Pick<ForexRepository, "findLatestExchangeRate"> = {
    findLatestExchangeRate: async () => ({ id: "1", version: 1, recordDate: 20260901, gbp: 0.0089, eur: 0.0104, usd: 0.0113 }),
  };

  /** The ORDER_SERVICE port RazorpayPaymentService drives, over this world. */
  orderPort: OrderServicePort = {
    getOrderById: async (orderId: bigint) => {
      const view = this.orders.get(Number(orderId));
      if (!view) return null;
      return { ...view.order, orderItems: view.items, tenant: { email: view.buyerEmail } };
    },
    isAnyPaymentDue: (order: { orderItems?: { paymentStatus: string }[] }) =>
      (order?.orderItems ?? []).some((it) => it.paymentStatus === "PENDING" || it.paymentStatus === "PREPAID"),
    updateOrderStatusToProcessing: async (orderId: bigint) => {
      const view = this.orders.get(Number(orderId));
      if (!view) return false;
      for (const it of view.items) {
        it.orderStatus = "PROCESSING";
        it.paymentStatus = "PAID";
      }
      return true;
    },
    updatePreOrderPaymentStatusToPaid: async (orderId: bigint) => {
      const view = this.orders.get(Number(orderId));
      if (!view) return false;
      for (const it of view.items) if (it.orderType === "PRE_ORDER") it.paymentStatus = "PAID";
      return true;
    },
    updateOrderStatusToFailed: async (orderId: bigint) => {
      const view = this.orders.get(Number(orderId));
      if (!view) return false;
      for (const it of view.items) {
        it.orderStatus = "FAILED";
        it.paymentStatus = "FAILED";
      }
      return true;
    },
    updateOrderCheckoutUrlStripe: async () => true,
  };
}

/** Razorpay transaction repository over the world's in-memory rows. */
class FakeRzpRepo extends RazorpayTransactionRepository {
  constructor(private readonly world: World) {
    // No database behind this fake. Every method the payment service calls is
    // overridden below; an unoverridden one would crash loudly on `this.db`,
    // never silently touch a real database.
    super(undefined as never);
  }
  // NOTE on types: the base repository's finders are TYPED non-null but DO
  // return null/undefined at runtime (`rows[0] ?? null`); the service checks
  // `if (!transaction)`. These overrides mirror that exact behaviour.
  override async findByOrderAndRazorpayOrderId(orderId: bigint, razorpayOrderId: string) {
    const found = this.world.rzpRows.find(
      (r) => r.loomOrderId === Number(orderId) && r.razorpayOrderId === razorpayOrderId,
    );
    return found as RzpRow;
  }
  override async findByOrder(orderId: bigint) {
    return this.world.rzpRows.filter((r) => r.loomOrderId === Number(orderId));
  }
  override async create(data: typeof schema.razorpayTransaction.$inferInsert) {
    const row: RzpRow = {
      id: BigInt(this.world.nextRzpId++),
      version: 1n,
      razorpayOrderId: data.razorpayOrderId,
      loomOrderId: data.loomOrderId,
      amount: String(data.amount),
      currency: data.currency,
      transactionId: data.transactionId ?? "",
      transactionSignature: data.transactionSignature ?? "",
      status: data.status,
      failedErrorCode: data.failedErrorCode ?? -1,
      failedErrorMessage: data.failedErrorMessage ?? "",
      dataDump: data.dataDump ?? "",
      createdAt: data.createdAt,
      paymentType: data.paymentType ?? "advance",
      webhookReceived: false,
      webhookReceivedAt: null,
      webhookDataDump: {},
      webhookEventType: "",
      webhookEventId: "",
    };
    this.world.rzpRows.push(row);
    return row;
  }
  override async update(id: bigint, data: Partial<typeof schema.razorpayTransaction.$inferInsert>) {
    const row = this.world.rzpRows.find((r) => r.id === id);
    if (!row) throw new Error(`FakeRzpRepo.update: no transaction row ${id}`);
    Object.assign(row, data);
    return row;
  }
}

const noopEmail: EmailServicePort = {
  sendOrderConfirmationEmail: async () => {},
  sendPreOrderConfirmationEmail: async () => {},
  sendOrderCancelNotification: async () => {},
};
const noopWhatsapp: WhatsappServicePort = {
  orderConfirmationNotification: async () => {},
  orderCancelledNotification: async () => {},
};

function sign(razorpayOrderId: string, paymentId: string, secret = RZP_KEY_SECRET): string {
  return createHmac("sha256", secret).update(`${razorpayOrderId}|${paymentId}`).digest("hex");
}

interface Harness {
  world: World;
  controller: CheckoutController;
  stripeCreateSession: ReturnType<typeof vi.fn>;
  stripeHandleSuccess: ReturnType<typeof vi.fn>;
}

function makeHarness(): Harness {
  const world = new World();
  const razorpay = new RazorpayPaymentService(new FakeRzpRepo(world), world.orderPort, noopEmail, noopWhatsapp);
  const stripeCreateSession = vi.fn(async () => ({ sessionId: "cs_test_1", checkoutUrl: "https://stripe.test/cs_test_1" }));
  const stripeHandleSuccess = vi.fn(async () => {});
  const stripeStub: Pick<StripePaymentService, "createSession" | "handlePaymentSuccess"> = {
    createSession: stripeCreateSession,
    handlePaymentSuccess: stripeHandleSuccess,
  };
  const service = new CheckoutService(world.store, world.shipmentRepo, world.forexRepo, gatekeeper, razorpay, stripeStub);
  const shipmentService = { getShipmentList: async () => world.shipments };
  return { world, controller: new CheckoutController(service, shipmentService), stripeCreateSession, stripeHandleSuccess };
}

/** A well-formed guest order body — WITH client-invented money the API must ignore. */
function guestOrderBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    currency: "INR",
    shipmentId: 5,
    address: { shippingAddress: { name: "G", city: "Kolkata" } },
    note: "",
    orderItems: [
      { productId: 11, orderType: "IN_STOCK", productGroup: "fabric", price: 1000, quantity: 2, unit: "METER" },
    ],
    // Fabricated client money — every one of these must be discarded.
    total: 1,
    subTotal: 5,
    shippingCost: 99999,
    advancePay: 0.01,
    guest: { email: "guest@example.com", name: "Guest Buyer" },
    ...overrides,
  };
}

let customerToken = "";
let strangerToken = "";

beforeAll(async () => {
  customerToken = `Bearer ${await gatekeeper.generateToken({
    id: 77,
    uid: "u77",
    email: "registered@example.com",
    roles: ["ROLE_CUSTOMER"],
  } as AuthenticatedTenant)}`;
  strangerToken = `Bearer ${await gatekeeper.generateToken({
    id: 88,
    uid: "u88",
    email: "someone-else@example.com",
    roles: ["ROLE_CUSTOMER"],
  } as AuthenticatedTenant)}`;
});

beforeEach(() => {
  vi.stubEnv("RAZORPAY_KEY_ID", RZP_KEY_ID);
  vi.stubEnv("RAZORPAY_KEY_SECRET", RZP_KEY_SECRET);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("api.razorpay.com/v1/orders")) {
        return new Response(JSON.stringify({ id: "order_rzp_1" }), { status: 200 });
      }
      throw new Error(`Unexpected fetch in spec: ${String(url)}`);
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// ─── Order creation: server-side money ──────────────────────────────────────

describe("POST /checkout/order — money is computed server-side", () => {
  it("guest order: subtotal from verified line prices, shipping from the shipment record, client totals discarded", async () => {
    const { world, controller } = makeHarness();
    const res = await controller.createOrder(undefined, guestOrderBody());

    expect(res.success).toBe(true);
    // subtotal 2 x 1000 = 2000; shipping = 150 + 50 * (2 - 1) = 200.
    expect(res.amount).toBe(2200);
    expect(res.currency).toBe("INR");
    expect(res.guestOrder).toBe(true);
    expect(res.orderNumber).toBe(`AP-${String(res.orderId)}`);

    const stored = world.orders.get(Number(res.orderId));
    expect(stored?.order.subTotal).toBe(2000);
    expect(stored?.order.shippingCost).toBe(200);
    expect(stored?.order.total).toBe(2200);
    expect(stored?.order.advancePay).toBe(2200);
    // None of the fabricated client figures (1 / 5 / 99999 / 0.01) survived.
    expect([stored?.order.total, stored?.order.subTotal, stored?.order.shippingCost]).not.toContain(99999);
    expect(stored?.items.every((it) => it.orderStatus === "INITIATED" && it.paymentStatus === "PENDING")).toBe(true);
  });

  it("rejects a line priced below the catalogue price", async () => {
    const { controller } = makeHarness();
    await expect(
      controller.createOrder(
        undefined,
        guestOrderBody({
          orderItems: [{ productId: 11, orderType: "IN_STOCK", productGroup: "fabric", price: 1, quantity: 2, unit: "METER" }],
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("accepts a legitimately volume-discounted price at qualifying quantity, rejects it below the tier", async () => {
    const { controller } = makeHarness();
    // Tier: 10% off at qty >= 10 -> floor 900.
    const at10 = await controller.createOrder(
      undefined,
      guestOrderBody({
        orderItems: [{ productId: 12, orderType: "IN_STOCK", productGroup: "fabric", price: 900, quantity: 10, unit: "METER" }],
      }),
    );
    expect(at10.success).toBe(true);

    await expect(
      controller.createOrder(
        undefined,
        guestOrderBody({
          guest: { email: "guest2@example.com", name: "G2" },
          orderItems: [{ productId: 12, orderType: "IN_STOCK", productGroup: "fabric", price: 900, quantity: 2, unit: "METER" }],
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects a line naming a product that does not exist", async () => {
    const { controller } = makeHarness();
    await expect(
      controller.createOrder(
        undefined,
        guestOrderBody({
          orderItems: [{ productId: 424242, orderType: "IN_STOCK", productGroup: "fabric", price: 10, quantity: 1, unit: "METER" }],
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects an unknown shipping method rather than inventing a rate", async () => {
    const { controller } = makeHarness();
    await expect(controller.createOrder(undefined, guestOrderBody({ shipmentId: 999 }))).rejects.toThrow(
      BadRequestException,
    );
  });

  it("prices a non-INR order with the day's stored rate, server-side, and routes it to stripe", async () => {
    const { world, controller } = makeHarness();
    const res = await controller.createOrder(undefined, guestOrderBody({ currency: "USD" }));
    // 2200 INR x 0.0113 = 24.86 USD.
    expect(res.amount).toBe(24.86);
    expect(res.currency).toBe("USD");
    expect(world.sidecars.get(Number(res.orderId))?.paymentProvider).toBe("stripe");
  });

  it("refuses a non-INR order when no exchange rate is on file", async () => {
    const { world, controller } = makeHarness();
    world.forexRepo.findLatestExchangeRate = async () => null;
    await expect(controller.createOrder(undefined, guestOrderBody({ currency: "USD" }))).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── Identity ───────────────────────────────────────────────────────────────

describe("POST /checkout/order — identity is never body-named", () => {
  it("a body-supplied guest cannot override the token identity", async () => {
    const { world, controller } = makeHarness();
    const res = await controller.createOrder(
      customerToken,
      guestOrderBody({ guest: { email: "evil-injected@example.com", name: "Mallory" } }),
    );
    expect(res.success).toBe(true);
    expect(res.guestOrder).toBe(false);
    expect(res.guestToken).toBeUndefined();
    // The order belongs to the TOKEN's tenant, and no guest tenant was minted.
    expect(world.orders.get(Number(res.orderId))?.order.tenantId).toBe(77);
    expect(world.tenants.has("evil-injected@example.com")).toBe(false);
  });

  it("no token and no guest identity -> 401", async () => {
    const { controller } = makeHarness();
    await expect(controller.createOrder(undefined, guestOrderBody({ guest: undefined }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("a guest email that belongs to a registered account is refused with exists:true", async () => {
    const { controller } = makeHarness();
    const err = await controller
      .createOrder(undefined, guestOrderBody({ guest: { email: "registered@example.com", name: "X" } }))
      .then(() => null)
      .catch((e: ConflictException) => e);
    expect(err).toBeInstanceOf(ConflictException);
    const body = (err as ConflictException).getResponse() as Record<string, unknown>;
    expect(body.exists).toBe(true);
  });

  it("an invalid bearer token is rejected, never downgraded to guest", async () => {
    const { controller } = makeHarness();
    await expect(controller.createOrder("Bearer not-a-real-token", guestOrderBody())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("reusing the same guest email reuses the same guest tenant", async () => {
    const { world, controller } = makeHarness();
    const a = await controller.createOrder(undefined, guestOrderBody());
    const b = await controller.createOrder(undefined, guestOrderBody());
    expect(world.orders.get(Number(a.orderId))?.order.tenantId).toBe(
      world.orders.get(Number(b.orderId))?.order.tenantId,
    );
  });
});

// ─── Guest token properties ─────────────────────────────────────────────────

describe("guest order-status token", () => {
  it("is unguessable (32 random bytes) and stored only as a SHA-256 hash", async () => {
    const { world, controller } = makeHarness();
    const res = await controller.createOrder(undefined, guestOrderBody());
    const token = String(res.guestToken);
    // 32 bytes base64url -> 43 chars.
    expect(token.length).toBeGreaterThanOrEqual(43);
    const sidecar = world.sidecars.get(Number(res.orderId));
    expect(sidecar?.guestTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(sidecar?.guestTokenHash).not.toContain(token);

    const again = await controller.createOrder(undefined, guestOrderBody());
    expect(again.guestToken).not.toBe(token);
  });
});

// ─── The full guest Razorpay flow ───────────────────────────────────────────

describe("guest checkout end to end (Razorpay)", () => {
  it("order -> payment session -> signed callback marks the order paid; replay is idempotent", async () => {
    const { world, controller } = makeHarness();

    const created = await controller.createOrder(undefined, guestOrderBody());
    const orderId = Number(created.orderId);
    const guestToken = String(created.guestToken);

    // 2. session, authorised by the guest token header only.
    const sessionRes = await controller.createPaymentSession(undefined, guestToken, { orderId });
    const session = sessionRes.session as Record<string, unknown>;
    expect(sessionRes.success).toBe(true);
    expect(session.provider).toBe("razorpay");
    expect(session.providerOrderId).toBe("order_rzp_1");
    expect(session.keyId).toBe(RZP_KEY_ID);
    // The amount handed to the gateway is the SERVER's computed advance.
    expect(session.amount).toBe(2200);
    expect(world.rzpRows[0]?.amount).toBe("2200");

    // 3. the gateway's signed result.
    const callback = {
      orderId,
      sessionId: "order_rzp_1",
      providerOrderId: "order_rzp_1",
      providerPaymentId: "pay_123",
      signature: sign("order_rzp_1", "pay_123"),
    };
    const confirmed = await controller.paymentCallback(undefined, guestToken, callback);
    expect(confirmed.success).toBe(true);
    expect(confirmed.paymentProvider).toBe("razorpay");
    const view = world.orders.get(orderId);
    expect(view?.items.every((it) => it.paymentStatus === "PAID" && it.orderStatus === "PROCESSING")).toBe(true);

    // 4. replaying the same valid callback changes nothing and still succeeds.
    const replay = await controller.paymentCallback(undefined, guestToken, callback);
    expect(replay.success).toBe(true);
    expect(view?.items.every((it) => it.paymentStatus === "PAID")).toBe(true);
  });

  it("an invalid signature does not mark the order paid", async () => {
    const { world, controller } = makeHarness();
    const created = await controller.createOrder(undefined, guestOrderBody());
    const orderId = Number(created.orderId);
    const guestToken = String(created.guestToken);
    await controller.createPaymentSession(undefined, guestToken, { orderId });

    await expect(
      controller.paymentCallback(undefined, guestToken, {
        orderId,
        sessionId: "order_rzp_1",
        providerOrderId: "order_rzp_1",
        providerPaymentId: "pay_123",
        signature: sign("order_rzp_1", "pay_123", "the-wrong-secret"),
      }),
    ).rejects.toThrow(BadRequestException);
    expect(world.orders.get(orderId)?.items.some((it) => it.paymentStatus === "PAID")).toBe(false);
  });

  it("a callback naming a provider order this API never created is refused", async () => {
    const { world, controller } = makeHarness();
    const created = await controller.createOrder(undefined, guestOrderBody());
    const orderId = Number(created.orderId);
    const guestToken = String(created.guestToken);
    await controller.createPaymentSession(undefined, guestToken, { orderId });

    await expect(
      controller.paymentCallback(undefined, guestToken, {
        orderId,
        sessionId: "order_forged",
        providerOrderId: "order_forged",
        providerPaymentId: "pay_x",
        signature: sign("order_forged", "pay_x"),
      }),
    ).rejects.toThrow(BadRequestException);
    expect(world.orders.get(orderId)?.items.some((it) => it.paymentStatus === "PAID")).toBe(false);
  });

  it("a missing signature is refused before any verification", async () => {
    const { controller } = makeHarness();
    const created = await controller.createOrder(undefined, guestOrderBody());
    const guestToken = String(created.guestToken);
    await expect(
      controller.paymentCallback(undefined, guestToken, {
        orderId: Number(created.orderId),
        sessionId: "order_rzp_1",
        providerOrderId: "order_rzp_1",
        providerPaymentId: "pay_123",
        signature: "",
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── The authenticated buyer flow ───────────────────────────────────────────

describe("authenticated checkout end to end (Razorpay)", () => {
  it("order -> session -> signed callback marks the order paid, all on the bearer token", async () => {
    const { world, controller } = makeHarness();
    const created = await controller.createOrder(customerToken, guestOrderBody({ guest: undefined }));
    const orderId = Number(created.orderId);
    expect(created.guestOrder).toBe(false);

    const sessionRes = await controller.createPaymentSession(customerToken, undefined, { orderId });
    expect((sessionRes.session as Record<string, unknown>).provider).toBe("razorpay");

    const confirmed = await controller.paymentCallback(customerToken, undefined, {
      orderId,
      sessionId: "order_rzp_1",
      providerOrderId: "order_rzp_1",
      providerPaymentId: "pay_777",
      signature: sign("order_rzp_1", "pay_777"),
    });
    expect(confirmed.success).toBe(true);
    expect(world.orders.get(orderId)?.items.every((it) => it.paymentStatus === "PAID")).toBe(true);
  });

  it("another customer's token cannot open a session on the order", async () => {
    const { controller } = makeHarness();
    const created = await controller.createOrder(customerToken, guestOrderBody({ guest: undefined }));
    await expect(
      controller.createPaymentSession(strangerToken, undefined, { orderId: Number(created.orderId) }),
    ).rejects.toThrow(NotFoundException);
  });
});

// ─── Cross-order guest-token isolation ──────────────────────────────────────

describe("a guest token is scoped to its own order", () => {
  it("cannot open a session, post a callback, or read status for another order", async () => {
    const { controller } = makeHarness();
    const a = await controller.createOrder(undefined, guestOrderBody());
    const b = await controller.createOrder(
      undefined,
      guestOrderBody({ guest: { email: "other-guest@example.com", name: "O" } }),
    );
    const tokenA = String(a.guestToken);
    const orderB = Number(b.orderId);

    await expect(controller.createPaymentSession(undefined, tokenA, { orderId: orderB })).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(
      controller.paymentCallback(undefined, tokenA, {
        orderId: orderB,
        sessionId: "s",
        providerOrderId: "o",
        providerPaymentId: "p",
        signature: "sig",
      }),
    ).rejects.toThrow(UnauthorizedException);

    // The status token resolves ONLY to its own order.
    const status = await controller.orderStatus(tokenA);
    expect((status.order as Record<string, unknown>).id).toBe(Number(a.orderId));

    // A wrong/unknown token is a 404, and so is a junk-length one.
    await expect(controller.orderStatus("A".repeat(43))).rejects.toThrow(NotFoundException);
    await expect(controller.orderStatus("short")).rejects.toThrow(NotFoundException);
  });

  it("a guest with no token at all gets 401 on the payment steps", async () => {
    const { controller } = makeHarness();
    const created = await controller.createOrder(undefined, guestOrderBody());
    await expect(
      controller.createPaymentSession(undefined, undefined, { orderId: Number(created.orderId) }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

// ─── Order status projection ────────────────────────────────────────────────

describe("GET /checkout/order-status/:token", () => {
  it("projects the order without leaking internals, and flips to PAID after the callback", async () => {
    const { controller } = makeHarness();
    const created = await controller.createOrder(undefined, guestOrderBody());
    const orderId = Number(created.orderId);
    const guestToken = String(created.guestToken);

    const before = await controller.orderStatus(guestToken);
    const orderBefore = before.order as Record<string, unknown>;
    expect(orderBefore.paymentState).toBe("PENDING");
    expect(orderBefore.total).toBe(2200);
    expect(orderBefore.buyerEmail).toBe("guest@example.com");
    expect(orderBefore.guestOrder).toBe(true);
    // The projection never carries the tenant id.
    expect(orderBefore.tenantId).toBeUndefined();

    await controller.createPaymentSession(undefined, guestToken, { orderId });
    await controller.paymentCallback(undefined, guestToken, {
      orderId,
      sessionId: "order_rzp_1",
      providerOrderId: "order_rzp_1",
      providerPaymentId: "pay_9",
      signature: sign("order_rzp_1", "pay_9"),
    });

    const after = await controller.orderStatus(guestToken);
    expect((after.order as Record<string, unknown>).paymentState).toBe("PAID");
  });
});

// ─── Stripe callback verification ───────────────────────────────────────────

describe("POST /checkout/payment-callback — stripe orders", () => {
  async function stripeOrder(controller: CheckoutController) {
    const created = await controller.createOrder(undefined, guestOrderBody({ currency: "USD" }));
    return { orderId: Number(created.orderId), guestToken: String(created.guestToken) };
  }

  it("verifies the session against Stripe itself before handing it to the success handler", async () => {
    const { controller, stripeHandleSuccess } = makeHarness();
    const { orderId, guestToken } = await stripeOrder(controller);
    vi.stubEnv("STRIPE_KEY_SECRET", "sk_test_x");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ id: "cs_test_1", payment_status: "paid", client_reference_id: String(orderId) }),
          { status: 200 },
        ),
      ),
    );

    const res = await controller.paymentCallback(undefined, guestToken, {
      orderId,
      sessionId: "cs_test_1",
      providerOrderId: "cs_test_1",
      providerPaymentId: "",
      signature: "",
    });
    expect(res.success).toBe(true);
    expect(res.paymentProvider).toBe("stripe");
    expect(stripeHandleSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: "cs_test_1", payment_status: "paid" }),
      expect.objectContaining({ type: "checkout.session.completed" }),
    );
  });

  it("refuses an unpaid session, a session for a different order, and a non-cs id", async () => {
    const { controller, stripeHandleSuccess } = makeHarness();
    const { orderId, guestToken } = await stripeOrder(controller);
    vi.stubEnv("STRIPE_KEY_SECRET", "sk_test_x");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ id: "cs_test_1", payment_status: "unpaid", client_reference_id: String(orderId) }),
          { status: 200 },
        ),
      ),
    );
    await expect(
      controller.paymentCallback(undefined, guestToken, {
        orderId,
        sessionId: "cs_test_1",
        providerOrderId: "cs_test_1",
        providerPaymentId: "",
        signature: "",
      }),
    ).rejects.toThrow(BadRequestException);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ id: "cs_test_1", payment_status: "paid", client_reference_id: "999999" }), {
          status: 200,
        }),
      ),
    );
    await expect(
      controller.paymentCallback(undefined, guestToken, {
        orderId,
        sessionId: "cs_test_1",
        providerOrderId: "cs_test_1",
        providerPaymentId: "",
        signature: "",
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      controller.paymentCallback(undefined, guestToken, {
        orderId,
        sessionId: "not-a-session",
        providerOrderId: "",
        providerPaymentId: "",
        signature: "",
      }),
    ).rejects.toThrow(BadRequestException);

    expect(stripeHandleSuccess).not.toHaveBeenCalled();
  });
});

// ─── The small public reads ─────────────────────────────────────────────────

describe("payment-mode, shipment-list, sandbox gateway", () => {
  it("payment-mode answers from the configured providers, honestly when unconfigured", () => {
    const { controller } = makeHarness();
    expect(controller.paymentMode("INR")).toEqual({ success: true, provider: "razorpay", charges: true });

    vi.stubEnv("RAZORPAY_KEY_ID", "");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");
    expect(controller.paymentMode("INR")).toEqual({ success: false, provider: "", charges: false });

    vi.stubEnv("STRIPE_KEY_SECRET", "sk_test_x");
    expect(controller.paymentMode("USD")).toEqual({ success: true, provider: "stripe", charges: true });
  });

  it("shipment-list is guest-readable and keyed like the Loom envelope", async () => {
    const { world, controller } = makeHarness();
    const res = await controller.shipmentList();
    expect(res.success).toBe(true);
    expect(res.shipmentList).toEqual(world.shipments);
  });

  it("the sandbox gateway is a genuine 404 — no sandbox provider exists in this API", () => {
    const { controller } = makeHarness();
    expect(() => controller.sandboxGateway()).toThrow(NotFoundException);
  });
});
