/**
 * CheckoutRepository — pricing reads used directly by the storefront
 * checkout lane (findProductsByIds / findVolumeTiers), the guest-tenant
 * lookup that gates account creation, and the order_checkout sidecar reads
 * that back the guest order-status page.
 */
import { describe, it, expect, vi } from "vitest";
import { CheckoutRepository } from "./checkout.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

/** Chainable select-only fake: select().from().where()[.limit()] -> rows */
function selectDb(rows: unknown[]) {
  const where = vi.fn(() => ({ limit: () => Promise.resolve(rows), then: (res: any) => res(rows) }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { select, where, from };
}

function failingSelectDb() {
  const chain: any = {
    limit: () => Promise.reject(BOOM),
    then: (res: any, rej: any) => Promise.reject(BOOM).then(res, rej),
  };
  const where = vi.fn(() => chain);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { select, where, from };
}

describe("CheckoutRepository.findProductsByIds — pricing at checkout", () => {
  it("returns [] without querying when given no ids", async () => {
    const { select } = selectDb([]);
    const repo = new CheckoutRepository({ select } as never);
    await expect(repo.findProductsByIds([])).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });

  it("maps rows into the checkout pricing projection", async () => {
    const row = {
      id: 1n,
      price: "100.50",
      sale: true,
      discount: "10",
      name: "Silk Saree",
      sku: "SKU-1",
      productGroup: "fabric",
      volumeDiscountProfileEnabled: false,
      volumeDiscountProfileId: null,
    };
    const { select } = selectDb([row]);
    const repo = new CheckoutRepository({ select } as never);
    const result = await repo.findProductsByIds([1]);
    expect(result).toEqual([
      {
        id: 1,
        price: 100.5,
        sale: true,
        discount: 10,
        name: "Silk Saree",
        sku: "SKU-1",
        productGroup: "fabric",
        volumeDiscountProfileEnabled: false,
        volumeDiscountProfileId: null,
      },
    ]);
  });

  it("a query failure propagates instead of pricing the cart at 0 (silent checkout bug)", async () => {
    const { select } = failingSelectDb();
    const repo = new CheckoutRepository({ select } as never);
    await expect(repo.findProductsByIds([1])).rejects.toThrow(BOOM);
  });
});

describe("CheckoutRepository.findVolumeTiers", () => {
  it("returns [] without querying when given no profile ids", async () => {
    const { select } = selectDb([]);
    const repo = new CheckoutRepository({ select } as never);
    await expect(repo.findVolumeTiers([])).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });

  it("a query failure propagates rather than silently applying no volume discount", async () => {
    const { select } = failingSelectDb();
    const repo = new CheckoutRepository({ select } as never);
    await expect(repo.findVolumeTiers([1])).rejects.toThrow(BOOM);
  });
});

describe("CheckoutRepository.findTenantByEmail — guest-vs-registered gate", () => {
  it("returns null for an unknown email (createGuestTenant path taken)", async () => {
    const { select } = selectDb([]);
    const repo = new CheckoutRepository({ select } as never);
    await expect(repo.findTenantByEmail("nobody@example.com")).resolves.toBeNull();
  });

  it("returns the tenant id/userType for a matching email", async () => {
    const { select } = selectDb([{ id: 7n, userType: "registered", userName: "Jane" }]);
    const repo = new CheckoutRepository({ select } as never);
    await expect(repo.findTenantByEmail("Jane@Example.com")).resolves.toEqual({
      id: 7,
      userType: "registered",
      userName: "Jane",
    });
  });

  it("propagates a lookup failure instead of treating every email as guest", async () => {
    const { select } = failingSelectDb();
    const repo = new CheckoutRepository({ select } as never);
    await expect(repo.findTenantByEmail("x@example.com")).rejects.toThrow(BOOM);
  });
});

describe("CheckoutRepository sidecar reads", () => {
  function execDb(result: unknown, opts: { fail?: boolean } = {}) {
    const execute = vi.fn(() => (opts.fail ? Promise.reject(BOOM) : Promise.resolve(result)));
    return { execute };
  }

  it("findSidecarByTokenHash: an empty hash returns null WITHOUT issuing the lookup query — never matches every non-guest row's default ''", async () => {
    const { execute } = execDb({ rows: [] });
    const repo = new CheckoutRepository({ execute } as never);
    await expect(repo.findSidecarByTokenHash("")).resolves.toBeNull();
    // ensureSidecarTable's CREATE TABLE / CREATE INDEX still run (2 calls);
    // the point is no 3rd call (the actual SELECT ... WHERE guest_token_hash = '') happens.
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("findSidecarByTokenHash: maps a found row", async () => {
    const row = {
      id: 1,
      order_id: 42,
      guest_order: true,
      guest_token_hash: "abc123",
      payment_provider: "RAZORPAY",
      session_id: "sess_1",
      provider_order_id: "prov_1",
      created_at: 1000,
    };
    const { execute } = execDb({ rows: [row] });
    const repo = new CheckoutRepository({ execute } as never);
    await expect(repo.findSidecarByTokenHash("abc123")).resolves.toEqual({
      id: 1,
      orderId: 42,
      guestOrder: true,
      guestTokenHash: "abc123",
      paymentProvider: "RAZORPAY",
      sessionId: "sess_1",
      providerOrderId: "prov_1",
      createdAt: 1000,
    });
  });

  it("findSidecarByOrderId: no row is null, a DB failure propagates", async () => {
    const ok = new CheckoutRepository({ execute: vi.fn(() => Promise.resolve({ rows: [] })) } as never);
    await expect(ok.findSidecarByOrderId(1)).resolves.toBeNull();

    const bad = new CheckoutRepository({ execute: vi.fn(() => Promise.reject(BOOM)) } as never);
    await expect(bad.findSidecarByOrderId(1)).rejects.toThrow(BOOM);
  });
});
