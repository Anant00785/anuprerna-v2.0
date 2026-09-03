/**
 * OrderService — the live one (registered in order.module.ts and injected by
 * controller/order.controller.ts and controller/custom-order.controller.ts).
 *
 * Not to be confused with `src/commerce/order/order.service.ts`, the generic
 * blob-table service, which no module registers and no controller injects —
 * see the note at the top of `src/commerce/order/order.service.spec.ts`.
 *
 * Authority: loom/.../order/dao/controller/OrderDAOController.java
 *   addOrder (L535), updateOrderStatusToCancelled (L643),
 *   updateOrderStatusToProcessing (L678).
 */
import { describe, it, expect, vi } from "vitest";
import { OrderService } from "./order.service.js";
import type { OrderRepository } from "../repository/order.repository.js";

function make(repoOverrides: Record<string, unknown> = {}) {
  const inserted: Record<string, unknown>[] = [];
  const repo = {
    cancelOrder: vi.fn().mockResolvedValue({ id: 5n }),
    updateOrder: vi.fn().mockResolvedValue({ id: 5n }),
    createOrder: vi.fn().mockResolvedValue({ id: 5n }),
    deleteOrder: vi.fn().mockResolvedValue({ id: 5n }),
    db: {
      select: () => ({ from: () => ({ limit: () => Promise.resolve([{ id: 77 }]) }) }),
      insert: () => ({
        values: (v: Record<string, unknown>) => {
          inserted.push(v);
          return Promise.resolve([]);
        },
      }),
    },
    ...repoOverrides,
  };
  return {
    repo,
    inserted,
    service: new OrderService(repo as unknown as OrderRepository, repo.db as never),
  };
}

describe("OrderService.cancelOrder / updateOrderStatus", () => {
  it("cancelOrder goes through the repository cancel (header + item cascade)", async () => {
    // Regression guard: this used to call updateOrder with only cancelledAt +
    // cancellationReason, leaving every order_item untouched. The customer-facing
    // status in findOrderPreviewsByTenant is derived from oi.order_status, so a
    // cancelled order still read PROCESSING/DISPATCHED to its owner.
    const { service, repo } = make();
    await service.cancelOrder(5n);
    expect(repo.cancelOrder).toHaveBeenCalledWith(5n, "Cancelled by user");
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it("updateOrderStatus('CANCELLED') takes the same cancel path, attributed to admin", async () => {
    const { service, repo } = make();
    await service.updateOrderStatus({ orderId: 5n, status: "CANCELLED" } as never);
    expect(repo.cancelOrder).toHaveBeenCalledWith(5n, "Cancelled by admin");
    expect(repo.updateOrder).not.toHaveBeenCalled();
  });

  it("propagates the repository's null for an order that could not be cancelled", async () => {
    const { service } = make({ cancelOrder: vi.fn().mockResolvedValue(null) });
    await expect(service.cancelOrder(404n)).resolves.toBeNull();
  });

  it("does not swallow a DB failure into a successful-looking cancel", async () => {
    const { service } = make({ cancelOrder: vi.fn().mockRejectedValue(new Error("boom")) });
    await expect(service.cancelOrder(5n)).rejects.toThrow("boom");
  });

  it("PINS AN UNBUILT PATH: any non-CANCELLED status writes only an audit note", async () => {
    // Loom's updateOrderStatusToProcessing also moves each eligible item to
    // PROCESSING and its paymentStatus to PAID/PREPAID by order type. None of
    // that is ported. This test pins the absence so it fails loudly the moment
    // the transition is implemented. See docs/KNOWN-GAPS.md.
    const { service, repo } = make();
    await service.updateOrderStatus({ orderId: 5n, status: "PROCESSING" } as never);
    expect(repo.updateOrder).toHaveBeenCalledWith(5n, { note: "Status updated to PROCESSING" });
    expect(repo.cancelOrder).not.toHaveBeenCalled();
  });
});

describe("OrderService.createOrder — money defaults", () => {
  const totals = async (body: Record<string, unknown>) => {
    const { service, repo } = make();
    await service.createOrder(body, 42);
    return (repo.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
  };

  it("defaults every money column to '0.00' and the currency to INR", async () => {
    const d = await totals({ tenantId: 42 });
    expect(d).toMatchObject({
      subTotal: "0.00",
      shippingCost: "0.00",
      total: "0.00",
      remainingPay: "0.00",
      autoDiscount: "0.00",
      couponDiscount: "0.00",
      couponDiscountAmount: "0.00",
      currency: "INR",
      couponApplied: false,
      couponCode: "",
    });
  });

  it("keeps an explicit zero total at zero rather than falling back to a default", async () => {
    // ?? not ||, so a legitimately free order is not re-priced.
    const d = await totals({ tenantId: 42, total: "0.00", subTotal: "0.00" });
    expect(d.total).toBe("0.00");
    expect(d.subTotal).toBe("0.00");
  });

  it("advancePay falls back to the full total when the caller omits it", async () => {
    const d = await totals({ tenantId: 42, total: "1200.00" });
    expect(d.advancePay).toBe("1200.00");
    expect(d.remainingPay).toBe("0.00");
  });

  it("an explicit advancePay is preserved and not overwritten by total", async () => {
    const d = await totals({ tenantId: 42, total: "1200.00", advancePay: "300.00", remainingPay: "900.00" });
    expect(d.advancePay).toBe("300.00");
    expect(d.remainingPay).toBe("900.00");
  });

  it("accepts the legacy lowercase `subtotal` spelling", async () => {
    const d = await totals({ tenantId: 42, subtotal: "500.00" });
    expect(d.subTotal).toBe("500.00");
  });

  it("stamps version 1 and a creation time", async () => {
    const before = Date.now();
    const d = await totals({ tenantId: 42 });
    expect(d.version).toBe(1n);
    expect(d.createdAt as number).toBeGreaterThanOrEqual(before);
  });

  it("PINS AN UNBUILT PATH: no forex exchange rate is snapshotted onto the order", async () => {
    // Loom addOrder ends with a switch on order.getCurrency() writing
    // rate.getUsd()/getEur()/getGbp(), defaulting to 1.0. The port writes
    // nothing, so orders.exchange_rate is NULL for every order it creates and a
    // foreign-currency order cannot be converted back to INR downstream.
    // See docs/KNOWN-GAPS.md. Delete this assertion when the snapshot lands.
    const d = await totals({ tenantId: 42, currency: "USD" });
    expect(d).not.toHaveProperty("exchangeRate");
  });
});

describe("OrderService.createOrder — order items", () => {
  it("initialises each item to INITIATED/PENDING, as Loom addOrder does", async () => {
    const { service, inserted } = make();
    await service.createOrder(
      { tenantId: 42, orderItems: [{ price: "100.00", quantity: 2 }] },
      42,
    );
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      orderStatus: "INITIATED",
      paymentStatus: "PENDING",
      orderType: "IN_STOCK",
      productGroup: "finished",
      unit: "METER",
      version: 1n,
    });
  });

  it("inherits the order currency when an item does not carry its own", async () => {
    const { service, inserted } = make();
    await service.createOrder({ tenantId: 42, currency: "GBP", orderItems: [{ price: "10" }] }, 42);
    expect(inserted[0].currency).toBe("GBP");
  });

  it("creates the order header even when the item list is empty", async () => {
    const { service, repo, inserted } = make();
    await service.createOrder({ tenantId: 42, orderItems: [] }, 42);
    expect(repo.createOrder).toHaveBeenCalledOnce();
    expect(inserted).toHaveLength(0);
  });

  it("prefers the body's tenantId over the authenticated tenant", async () => {
    const { service, repo } = make();
    await service.createOrder({ tenantId: 7 }, 42);
    expect((repo.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0].tenantId).toBe(7);
  });

  it("falls back to the authenticated tenant when the body carries none", async () => {
    const { service, repo } = make();
    await service.createOrder({}, 42);
    expect((repo.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0].tenantId).toBe(42);
  });

  it("PINS A HAZARD: with no tenant anywhere it adopts an arbitrary existing tenant", async () => {
    // `SELECT id FROM loom_tenant LIMIT 1` — the new order is attached to
    // whichever tenant the database happens to return first. Loom's addOrder
    // takes the authenticated LoomTenant and has no such fallback. Recorded in
    // docs/KNOWN-GAPS.md rather than changed here: the controller supplying the
    // tenant is out of this change's scope.
    const { service, repo } = make();
    await service.createOrder({}, undefined);
    expect((repo.createOrder as ReturnType<typeof vi.fn>).mock.calls[0][0].tenantId).toBe(77);
  });

  it("falls back to tenant 1 when even that lookup fails", async () => {
    const db = {
      select: () => ({ from: () => ({ limit: () => Promise.reject(new Error("db down")) }) }),
      insert: () => ({ values: () => Promise.resolve([]) }),
    };
    const repo = { createOrder: vi.fn().mockResolvedValue({ id: 5n }), db };
    const service = new OrderService(repo as unknown as OrderRepository, db as never);
    await service.createOrder({}, undefined);
    expect(repo.createOrder.mock.calls[0][0].tenantId).toBe(1);
  });

  it("does not abort the whole order when one item insert fails", async () => {
    // Deliberate: the per-item insert is wrapped in try/catch. Pinning it so the
    // partial-write behaviour is visible rather than assumed.
    const db = {
      select: () => ({ from: () => ({ limit: () => Promise.resolve([{ id: 77 }]) }) }),
      insert: () => ({ values: () => Promise.reject(new Error("bad item")) }),
    };
    const repo = { createOrder: vi.fn().mockResolvedValue({ id: 5n }), db };
    const service = new OrderService(repo as unknown as OrderRepository, db as never);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      service.createOrder({ tenantId: 42, orderItems: [{ price: "1" }] }, 42),
    ).resolves.toEqual({ id: 5n });
    warn.mockRestore();
  });
});
