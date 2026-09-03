/**
 * OrderService's preview merging — Loom OrderDAOController
 * retrieveAllOrderListByTenant / getProcessingOrderStatus.
 */
import { describe, it, expect, vi } from "vitest";
import { OrderService } from "./order.service.js";
import type { OrderRepository } from "../repository/order.repository.js";

const p = (orderId: number, createdAt: number, status = "DISPATCHED", orderType = "ORDER") =>
  ({ orderId, createdAt, status, orderType }) as never;

function make(orders: unknown[], customOrders: unknown[]) {
  const repo = {
    findOrderPreviewsByTenant: vi.fn().mockResolvedValue(orders),
    findCustomOrderPreviewsByTenant: vi.fn().mockResolvedValue(customOrders),
  };
  return { repo, service: new OrderService(repo as unknown as OrderRepository, {} as never) };
}

describe("OrderService.getCustomerAllOrderPreviews", () => {
  it("merges both sources and re-sorts newest-first across them", async () => {
    const { service } = make(
      [p(1, 300), p(2, 100)],
      [p(9, 200, "PROCESSING", "CUSTOM_ORDER")],
    );
    const result = await service.getCustomerAllOrderPreviews(7, 0, 50);
    expect(result.map((r) => r.orderId)).toEqual([1, 9, 2]);
  });

  it("passes the tenant and paging straight through to both queries", async () => {
    const { service, repo } = make([], []);
    await service.getCustomerAllOrderPreviews(7, 2, 25);
    expect(repo.findOrderPreviewsByTenant).toHaveBeenCalledWith(7, 2, 25);
    expect(repo.findCustomOrderPreviewsByTenant).toHaveBeenCalledWith(7, 2, 25);
  });

  it("returns [] when the tenant has neither kind of order", async () => {
    const { service } = make([], []);
    await expect(service.getCustomerAllOrderPreviews(7, 0, 50)).resolves.toEqual([]);
  });
});

describe("OrderService.getProcessingOrderStatus", () => {
  it("is true when any regular order is PROCESSING", async () => {
    const { service } = make([p(1, 1, "PROCESSING")], []);
    await expect(service.getProcessingOrderStatus(7, 0, 50)).resolves.toEqual({ hasProcessingOrder: true });
  });

  it("is true when any CUSTOM order is PROCESSING", async () => {
    const { service } = make([p(1, 1, "DISPATCHED")], [p(9, 1, "PROCESSING", "CUSTOM_ORDER")]);
    await expect(service.getProcessingOrderStatus(7, 0, 50)).resolves.toEqual({ hasProcessingOrder: true });
  });

  it("defaults to false when the tenant has no orders at all", async () => {
    const { service } = make([], []);
    await expect(service.getProcessingOrderStatus(7, 0, 50)).resolves.toEqual({ hasProcessingOrder: false });
  });

  it("is false when orders exist but none are PROCESSING", async () => {
    const { service } = make([p(1, 1, "DELIVERED")], [p(9, 1, "CANCELLED", "CUSTOM_ORDER")]);
    await expect(service.getProcessingOrderStatus(7, 0, 50)).resolves.toEqual({ hasProcessingOrder: false });
  });
});
