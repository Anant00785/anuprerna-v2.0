import { describe, it, expect } from "vitest";
import {
  toOrderDetails,
  toOrderListItem,
  toOrderStatus,
  toWholesaleMembershipInfo,
  toWholesaleOrderInfo,
} from "./adapters";

// Field names below are Loom's real ones, taken from the legacy storefront's
// interfaces (fabric-master/src/app/profile/interface/*.ts). The pages previously
// mapped `o.orderDate` / `o.totalAmount` / `o.items`, which Loom never sends.
describe("toOrderListItem", () => {
  const raw = {
    id: 9021,
    total: 12500,
    currency: "INR",
    createdAt: 1786534438000,
    orderStatus: "DISPATCHED",
    itemCount: 3,
    trackingUrl: "https://track.example/9021",
    dispatchedOn: 1786534500000,
    estimatedDeliveryTo: 1786900000000,
  };

  it("maps Loom's order-list row onto the domain type", () => {
    expect(toOrderListItem(raw)).toEqual({
      orderId: 9021,
      orderType: "ORDER",
      loyaltyOrder: false,
      status: "DISPATCHED",
      createdAt: 1786534438000,
      estimatedDeliveryDate: 1786900000000,
      totalItemCount: 3,
      dispatchedOn: 1786534500000,
      trackingUrl: "https://track.example/9021",
      currency: "INR",
      totalAmount: 12500,
    });
  });

  it("keeps a zero total instead of falling back (the falsy-zero bug class)", () => {
    expect(toOrderListItem({ ...raw, total: 0 }).totalAmount).toBe(0);
    expect(toOrderListItem({ ...raw, itemCount: 0 }).totalItemCount).toBe(0);
  });

  it("does not invent a status for an unknown value", () => {
    expect(toOrderStatus("SOMETHING_NEW")).toBe("PROCESSING");
    expect(toOrderStatus(undefined)).toBe("PROCESSING");
    expect(toOrderStatus("delivered")).toBe("DELIVERED");
  });
});

describe("toOrderDetails", () => {
  it("reads `orderItems`, not `items`, and preserves explicit zeros", () => {
    const details = toOrderDetails({
      id: 77,
      createdAt: 1786534438000,
      currency: "INR",
      subTotal: 1000,
      shippingCost: 0,
      total: 1000,
      shippingMode: { name: "Standard" },
      address: { shippingAddress: { city: "Kolkata" }, billingAddress: { city: "Kolkata" } },
      orderItems: [
        { id: 1, quantity: 2, unit: "m", price: 500, orderStatus: "PROCESSING", customization: { productName: "Khadi" } },
      ],
    });

    expect(details.orderId).toBe(77);
    expect(details.shippingCost).toBe(0);
    expect(details.items).toHaveLength(1);
    expect(details.items[0].productName).toBe("Khadi");
    expect(details.items[0].quantity).toBe(2);
  });

  it("yields empty collections rather than throwing when they are absent", () => {
    const details = toOrderDetails({ id: 1 });
    expect(details.items).toEqual([]);
    expect(details.fulfillments).toEqual([]);
  });
});

describe("wholesale adapters", () => {
  it("returns null membership when the customer is not enrolled", () => {
    // Loom answers `{"success":true,"message":""}` with no membership object for a
    // customer who never joined — that must render as "not enrolled", not as an
    // invented membership with fabricated cycle dates.
    expect(toWholesaleMembershipInfo(null)).toBeNull();
  });

  it("maps the live loyaltyProgramInfo aggregates", () => {
    expect(
      toWholesaleOrderInfo({
        tenantId: 166329453,
        totalOrderCount: 4,
        averageOrderValue: 3200,
        percentileUtilization: 12.5,
        totalAbsoluteDiscount: 800,
      })
    ).toEqual({
      totalOrderCount: 4,
      averageOrderValue: 3200,
      percentileUtilization: 12.5,
      totalAbsoluteDiscount: 800,
    });
  });

  it("zeroes the aggregates instead of inventing them when absent", () => {
    expect(toWholesaleOrderInfo(null)).toEqual({
      totalOrderCount: 0,
      averageOrderValue: 0,
      percentileUtilization: 0,
      totalAbsoluteDiscount: 0,
    });
  });
});
