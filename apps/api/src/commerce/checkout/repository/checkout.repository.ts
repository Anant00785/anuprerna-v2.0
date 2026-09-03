/**
 * apps/api/src/commerce/checkout/repository/checkout.repository.ts
 *
 * Data access for the /checkout/* endpoint family. Two concerns:
 *
 *  1. The `order_checkout` SIDECAR — one row per order created through the
 *     checkout lane: whether the buyer was a guest, the SHA-256 hash of the
 *     guest order-status token (never the token itself), the payment provider
 *     the order was routed to at creation, and the provider session ids. The
 *     table is created idempotently on first use, the same pattern
 *     commerce/shared/commerce-data.service.ts already established for
 *     API-owned tables that do not exist in the introspected Loom schema.
 *
 *  2. Guest tenants — a loom_tenant row with userType 'guest' and an
 *     UNUSABLE password (a random marker that is not a bcrypt hash, so
 *     bcrypt.compare can never accept it). A guest tenant satisfies the
 *     orders.tenant_id FK without creating a sign-in-able account.
 */
import { Inject, Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";

export interface OrderCheckoutSidecar {
  id: number;
  orderId: number;
  guestOrder: boolean;
  guestTokenHash: string;
  paymentProvider: string;
  sessionId: string;
  providerOrderId: string;
  createdAt: number;
}

export interface CheckoutProductRow {
  id: number;
  price: number;
  sale: boolean;
  discount: number;
  name: string;
  sku: string;
  productGroup: string;
  volumeDiscountProfileEnabled: boolean;
  volumeDiscountProfileId: number | null;
}

export interface VolumeTierRow {
  profileId: number;
  minimumOrderQuantity: number;
  discount: number;
}

export interface NewCheckoutOrder {
  tenantId: number;
  subTotal: string;
  shippingMode: unknown;
  shippingCost: string;
  total: string;
  currency: string;
  advancePay: string;
  remainingPay: string;
  exchangeRate: string;
  address: unknown;
  note: string;
  paymentMode: "RAZORPAY" | "STRIPE";
}

export interface NewCheckoutOrderItem {
  orderType: "IN_STOCK" | "MADE_TO_ORDER" | "PRE_ORDER";
  productGroup: string;
  quantity: string;
  unit: "UNIT" | "METER";
  price: string;
  currency: string;
  customization: Record<string, unknown>;
}

function rowsOf(result: unknown): Record<string, unknown>[] {
  const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

function mapSidecar(r: Record<string, unknown>): OrderCheckoutSidecar {
  return {
    id: Number(r.id),
    orderId: Number(r.order_id),
    guestOrder: Boolean(r.guest_order),
    guestTokenHash: String(r.guest_token_hash ?? ""),
    paymentProvider: String(r.payment_provider ?? ""),
    sessionId: String(r.session_id ?? ""),
    providerOrderId: String(r.provider_order_id ?? ""),
    createdAt: Number(r.created_at ?? 0),
  };
}

@Injectable()
export class CheckoutRepository {
  private tableReady?: Promise<void>;

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private ensureSidecarTable(): Promise<void> {
    if (!this.tableReady) {
      this.tableReady = (async () => {
        await this.db.execute(sql`
          CREATE TABLE IF NOT EXISTS order_checkout (
            id BIGSERIAL PRIMARY KEY,
            order_id BIGINT NOT NULL UNIQUE,
            guest_order BOOLEAN NOT NULL DEFAULT FALSE,
            guest_token_hash VARCHAR(64) NOT NULL DEFAULT '',
            payment_provider VARCHAR(32) NOT NULL DEFAULT '',
            session_id VARCHAR(255) NOT NULL DEFAULT '',
            provider_order_id VARCHAR(255) NOT NULL DEFAULT '',
            created_at BIGINT NOT NULL
          )
        `);
        await this.db.execute(
          sql`CREATE INDEX IF NOT EXISTS idx_order_checkout_token_hash ON order_checkout (guest_token_hash)`,
        );
      })().catch((err) => {
        // A failed CREATE must not poison every later call with a stale promise.
        this.tableReady = undefined;
        throw err;
      });
    }
    return this.tableReady;
  }

  // ─── Guest tenants ─────────────────────────────────────────────────────────

  /** Case-insensitive tenant lookup; returns enough to tell registered from guest. */
  async findTenantByEmail(email: string): Promise<{ id: number; userType: string; userName: string } | null> {
    const clean = email.trim().toLowerCase();
    const rows = await this.db
      .select({ id: schema.loomTenant.id, userType: schema.loomTenant.userType, userName: schema.loomTenant.userName })
      .from(schema.loomTenant)
      .where(sql`lower(${schema.loomTenant.email}) = ${clean} AND ${schema.loomTenant.deleted} = false`)
      .limit(1);
    const row = rows[0];
    return row ? { id: Number(row.id), userType: String(row.userType), userName: String(row.userName) } : null;
  }

  /**
   * Insert a guest tenant. The password is a random marker that is NOT a
   * bcrypt hash — bcrypt.compare rejects it unconditionally, so a guest
   * tenant can never authenticate. userType 'guest' is what later tells the
   * duplicate-email check that this row is not a real account.
   */
  async createGuestTenant(email: string, name: string): Promise<number> {
    return this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(schema.loomTenant)
        .values({
          loomId: crypto.randomUUID(),
          email: email.trim().toLowerCase(),
          emailVerified: false,
          contactNumber: "",
          contactNumberVerified: false,
          userPassword: `!guest-no-login-${randomBytes(24).toString("hex")}`,
          creationTime: Date.now(),
          active: true,
          suspended: false,
          banned: false,
          deleted: false,
          userName: name || "Guest",
          gender: "UNDEFINED",
          provider: "UNKNOWN",
          userType: "guest",
        })
        .returning({ id: schema.loomTenant.id });
      const tenantId = inserted[0].id;
      await tx.insert(schema.userRole).values({ role: "ROLE_CUSTOMER", userId: tenantId });
      return Number(tenantId);
    });
  }

  // ─── Order + sidecar writes ────────────────────────────────────────────────

  /** Insert the order header, its items and the checkout sidecar in ONE transaction. */
  async createOrderWithItems(
    order: NewCheckoutOrder,
    items: NewCheckoutOrderItem[],
    sidecar: { guestOrder: boolean; guestTokenHash: string; paymentProvider: string },
  ): Promise<number> {
    await this.ensureSidecarTable();
    const now = Date.now();
    return this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(schema.orders)
        .values({
          tenantId: order.tenantId,
          subTotal: order.subTotal,
          shippingMode: order.shippingMode,
          shippingCost: order.shippingCost,
          total: order.total,
          currency: order.currency,
          advancePay: order.advancePay,
          remainingPay: order.remainingPay,
          autoDiscount: "0.00",
          couponApplied: false,
          couponCode: "",
          couponDiscount: "0.00",
          couponDiscountAmount: "0.00",
          exchangeRate: order.exchangeRate,
          address: order.address,
          note: order.note,
          gift: false,
          loyaltyOrder: false,
          paymentMode: order.paymentMode,
          createdAt: now,
        })
        .returning({ id: schema.orders.id });
      const orderId = Number(inserted[0].id);

      for (const item of items) {
        // Loom OrderDAOController.addOrder: every item starts INITIATED/PENDING.
        await tx.insert(schema.orderItem).values({
          orderId,
          orderType: item.orderType,
          productGroup: item.productGroup,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          currency: item.currency,
          customization: item.customization,
          orderStatus: "INITIATED",
          paymentStatus: "PENDING",
          createdAt: now,
          updatedAt: now,
        });
      }

      await tx.execute(sql`
        INSERT INTO order_checkout (order_id, guest_order, guest_token_hash, payment_provider, created_at)
        VALUES (${orderId}, ${sidecar.guestOrder}, ${sidecar.guestTokenHash}, ${sidecar.paymentProvider}, ${now})
      `);

      return orderId;
    });
  }

  async findSidecarByOrderId(orderId: number): Promise<OrderCheckoutSidecar | null> {
    await this.ensureSidecarTable();
    const result = await this.db.execute(sql`SELECT * FROM order_checkout WHERE order_id = ${orderId} LIMIT 1`);
    const row = rowsOf(result)[0];
    return row ? mapSidecar(row) : null;
  }

  async findSidecarByTokenHash(hash: string): Promise<OrderCheckoutSidecar | null> {
    await this.ensureSidecarTable();
    // An empty hash matches every non-guest row's DEFAULT '' — never look one up.
    if (!hash) return null;
    const result = await this.db.execute(
      sql`SELECT * FROM order_checkout WHERE guest_token_hash = ${hash} AND guest_order = true LIMIT 1`,
    );
    const row = rowsOf(result)[0];
    return row ? mapSidecar(row) : null;
  }

  async updateSidecarSession(orderId: number, sessionId: string, providerOrderId: string): Promise<void> {
    await this.ensureSidecarTable();
    await this.db.execute(sql`
      UPDATE order_checkout SET session_id = ${sessionId}, provider_order_id = ${providerOrderId}
      WHERE order_id = ${orderId}
    `);
  }

  // ─── Pricing reads ─────────────────────────────────────────────────────────

  async findProductsByIds(ids: number[]): Promise<CheckoutProductRow[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select({
        id: schema.product.id,
        price: schema.product.price,
        sale: schema.product.sale,
        discount: schema.product.discount,
        name: schema.product.name,
        sku: schema.product.sku,
        productGroup: schema.product.productGroup,
        volumeDiscountProfileEnabled: schema.product.volumeDiscountProfileEnabled,
        volumeDiscountProfileId: schema.product.volumeDiscountProfileId,
      })
      .from(schema.product)
      .where(inArray(schema.product.id, ids.map((id) => BigInt(id))));
    return rows.map((r) => ({
      id: Number(r.id),
      price: Number(r.price),
      sale: Boolean(r.sale),
      discount: Number(r.discount ?? 0),
      name: String(r.name),
      sku: String(r.sku),
      productGroup: String(r.productGroup),
      volumeDiscountProfileEnabled: Boolean(r.volumeDiscountProfileEnabled),
      volumeDiscountProfileId: r.volumeDiscountProfileId === null ? null : Number(r.volumeDiscountProfileId),
    }));
  }

  async findVolumeTiers(profileIds: number[]): Promise<VolumeTierRow[]> {
    if (profileIds.length === 0) return [];
    const rows = await this.db
      .select({
        profileId: schema.volumeDiscountProfileItem.profileId,
        minimumOrderQuantity: schema.volumeDiscountProfileItem.minimumOrderQuantity,
        discount: schema.volumeDiscountProfileItem.discount,
      })
      .from(schema.volumeDiscountProfileItem)
      .where(inArray(schema.volumeDiscountProfileItem.profileId, profileIds));
    return rows.map((r) => ({
      profileId: Number(r.profileId),
      minimumOrderQuantity: Number(r.minimumOrderQuantity),
      discount: Number(r.discount),
    }));
  }

  // ─── Order-status read ─────────────────────────────────────────────────────

  /**
   * The order + its items + the buyer's email, projected to exactly what the
   * checkout lane needs — never a raw entity dump.
   */
  async findOrderForStatus(orderId: number): Promise<CheckoutOrderView | null> {
    const orders = await this.db
      .select()
      .from(schema.orders)
      .where(sql`${schema.orders.id} = ${BigInt(orderId)} AND ${schema.orders.deleted} = false`)
      .limit(1);
    const order = orders[0];
    if (!order) return null;
    const items = await this.db.select().from(schema.orderItem).where(eq(schema.orderItem.orderId, orderId));
    const tenants = await this.db
      .select({ email: schema.loomTenant.email, userType: schema.loomTenant.userType })
      .from(schema.loomTenant)
      .where(eq(schema.loomTenant.id, BigInt(order.tenantId)))
      .limit(1);
    return {
      order: {
        id: Number(order.id),
        tenantId: Number(order.tenantId),
        subTotal: Number(order.subTotal),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        currency: String(order.currency),
        advancePay: Number(order.advancePay),
        remainingPay: Number(order.remainingPay),
        address: order.address,
        createdAt: Number(order.createdAt ?? 0),
      },
      items: items.map((it) => ({
        id: Number(it.id),
        orderType: String(it.orderType),
        productGroup: String(it.productGroup),
        quantity: Number(it.quantity),
        unit: String(it.unit),
        price: Number(it.price),
        currency: String(it.currency),
        orderStatus: String(it.orderStatus),
        paymentStatus: String(it.paymentStatus),
      })),
      buyerEmail: String(tenants[0]?.email ?? ""),
      buyerUserType: String(tenants[0]?.userType ?? ""),
    };
  }
}

/** The explicit checkout projection of an order and its items. */
export interface CheckoutOrderView {
  order: {
    id: number;
    tenantId: number;
    subTotal: number;
    shippingCost: number;
    total: number;
    currency: string;
    advancePay: number;
    remainingPay: number;
    address: unknown;
    createdAt: number;
  };
  items: {
    id: number;
    orderType: string;
    productGroup: string;
    quantity: number;
    unit: string;
    price: number;
    currency: string;
    orderStatus: string;
    paymentStatus: string;
  }[];
  buyerEmail: string;
  buyerUserType: string;
}

/**
 * The repository surface the checkout service consumes. Typed as a Pick so
 * specs can supply structural in-memory fakes without type assertions.
 */
export type CheckoutStore = Pick<
  CheckoutRepository,
  | "findTenantByEmail"
  | "createGuestTenant"
  | "createOrderWithItems"
  | "findSidecarByOrderId"
  | "findSidecarByTokenHash"
  | "updateSidecarSession"
  | "findProductsByIds"
  | "findVolumeTiers"
  | "findOrderForStatus"
>;
