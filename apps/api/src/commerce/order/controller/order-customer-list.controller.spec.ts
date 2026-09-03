/**
 * The three customer order-list reads ported from Loom's OrderController.
 *
 * Two things are load-bearing and asserted explicitly:
 *  1. the response envelope key (`orderList` = ResponseParameter.ORDER_LIST for
 *     the two lists; `entity` for the RainEntity-wrapped processing flag), and
 *  2. that the tenant id handed to the service comes from @CurrentTenant and
 *     NOTHING else — passing a client-supplied id would be an IDOR.
 */
import { describe, it, expect, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { OrderController } from "./order.controller.js";
import type { OrderService } from "../service/order.service.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";

const TENANT = { id: 77, uid: "u77", email: "a@b.com", roles: [] } as unknown as AuthenticatedTenant;

const preview = (over: Record<string, unknown> = {}) => ({
  orderId: 1,
  createdAt: 1000,
  dispatchedOn: null,
  trackingUrl: "",
  estimatedDeliveryDate: null,
  totalItemCount: 1,
  processingItemCount: 1,
  readyItemCount: 0,
  dispatchedItemCount: 0,
  cancelledItemCount: 0,
  status: "PROCESSING",
  orderType: "ORDER",
  loyaltyOrder: false,
  ...over,
});

function make(over: Partial<Record<keyof OrderService, unknown>> = {}) {
  const service = {
    getCustomerOrderPreviews: vi.fn().mockResolvedValue([]),
    getCustomerAllOrderPreviews: vi.fn().mockResolvedValue([]),
    getProcessingOrderStatus: vi.fn().mockResolvedValue({ hasProcessingOrder: false }),
    ...over,
  };
  return { service, controller: new OrderController(service as unknown as OrderService) };
}

describe("GET /get/customer/order-list/v2", () => {
  it("returns the tenant's previews keyed `orderList`", async () => {
    const rows = [preview()];
    const { controller, service } = make({ getCustomerOrderPreviews: vi.fn().mockResolvedValue(rows) });

    await expect(controller.getCustomerOrderListV2(TENANT)).resolves.toEqual({
      success: true,
      message: "",
      orderList: rows,
    });
    // Loom's defaults: pageNumber 0, pageSize 50.
    expect(service.getCustomerOrderPreviews).toHaveBeenCalledWith(77, 0, 50);
  });

  it("scopes by the authenticated tenant, never by anything a client sends", async () => {
    const { controller, service } = make();
    await controller.getCustomerOrderListV2({ ...TENANT, id: 5 } as AuthenticatedTenant, "1", "10");
    expect(service.getCustomerOrderPreviews).toHaveBeenCalledWith(5, 1, 10);
  });

  it("rejects rather than widening scope when there is no tenant on the request", async () => {
    const { controller } = make();
    await expect(controller.getCustomerOrderListV2(undefined as never)).rejects.toThrow(UnauthorizedException);
  });

  it("returns an empty orderList when the customer has no orders", async () => {
    const { controller } = make();
    await expect(controller.getCustomerOrderListV2(TENANT)).resolves.toEqual({
      success: true,
      message: "",
      orderList: [],
    });
  });

  it("falls back to Loom's defaults on unparseable paging params", async () => {
    const { controller, service } = make();
    await controller.getCustomerOrderListV2(TENANT, "abc", "-4");
    expect(service.getCustomerOrderPreviews).toHaveBeenCalledWith(77, 0, 50);
  });
});

describe("GET /get/customer/order-list/all", () => {
  it("returns merged regular + custom previews keyed `orderList`", async () => {
    const rows = [preview({ orderId: 2, orderType: "CUSTOM_ORDER" }), preview()];
    const { controller, service } = make({ getCustomerAllOrderPreviews: vi.fn().mockResolvedValue(rows) });

    await expect(controller.getCustomerAllOrderList(TENANT)).resolves.toEqual({
      success: true,
      message: "",
      orderList: rows,
    });
    expect(service.getCustomerAllOrderPreviews).toHaveBeenCalledWith(77, 0, 50);
  });

  it("returns an empty orderList when the customer has no orders", async () => {
    const { controller } = make();
    await expect(controller.getCustomerAllOrderList(TENANT)).resolves.toEqual({
      success: true,
      message: "",
      orderList: [],
    });
  });

  it("rejects when there is no tenant on the request", async () => {
    const { controller } = make();
    await expect(controller.getCustomerAllOrderList(undefined as never)).rejects.toThrow(UnauthorizedException);
  });
});

describe("GET /get/customer/orders/status/processing", () => {
  it("wraps ProcessingOrderStatus under the RainEntity key `entity`", async () => {
    const { controller, service } = make({
      getProcessingOrderStatus: vi.fn().mockResolvedValue({ hasProcessingOrder: true }),
    });

    await expect(controller.getProcessingOrderStatus(TENANT)).resolves.toEqual({
      success: true,
      message: "",
      entity: { hasProcessingOrder: true },
    });
    expect(service.getProcessingOrderStatus).toHaveBeenCalledWith(77, 0, 50);
  });

  it("is a valid object defaulting to false when the customer has no orders", async () => {
    const { controller } = make();
    await expect(controller.getProcessingOrderStatus(TENANT)).resolves.toEqual({
      success: true,
      message: "",
      entity: { hasProcessingOrder: false },
    });
  });

  it("rejects when there is no tenant on the request", async () => {
    const { controller } = make();
    await expect(controller.getProcessingOrderStatus(undefined as never)).rejects.toThrow(UnauthorizedException);
  });
});
