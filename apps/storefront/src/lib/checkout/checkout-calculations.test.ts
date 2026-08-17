import { describe, it, expect } from "vitest";
import {
  calculateCheckoutPrices,
  calculateShippingCost,
  calculateDeliveryTimestamp,
  formatDeliveryDate,
} from "./checkout-calculations";
import { CartItem } from "@/types/domain/cart";
import { ShipmentOption } from "@/types/domain/checkout";

const sampleInStockItem: CartItem = {
  id: "1",
  productId: "101",
  product: {
    id: "101",
    sku: "FAB01",
    slug: "cotton-khadi",
    name: "Pure Cotton Khadi",
    price: 500,
    currency: "INR",
    thumbnail: "/hero.jpg",
    gallery: ["/hero.jpg"],
    inStock: true,
  },
  quantity: 2,
  unit: "METER",
  unitPrice: 500,
  totalPrice: 1000,
  orderType: "IN_STOCK",
  productGroup: "fabric",
};

const sampleMadeToOrderItem: CartItem = {
  id: "2",
  productId: "201",
  product: {
    id: "201",
    sku: "FP01",
    slug: "trench-coat",
    name: "Trench Coat",
    price: 3500,
    currency: "INR",
    thumbnail: "/coat.jpg",
    gallery: ["/coat.jpg"],
    inStock: true,
  },
  quantity: 1,
  unit: "UNIT",
  unitPrice: 5725,
  totalPrice: 5725,
  orderType: "MADE_TO_ORDER",
  productGroup: "finished",
};

const domesticShipment: ShipmentOption = {
  id: 1,
  name: "Air Standard",
  locationType: "DOMESTIC",
  baseAmount: 150,
  additionalAmount: 50,
  baseQuantity: 1,
  estimatedFromDay: 3,
  estimatedToDay: 6,
};

describe("checkout-calculations", () => {
  describe("calculateShippingCost", () => {
    it("calculates shipping charge based on baseAmount and excess quantity per shipment option", () => {
      const { shippingCost, isShippingFree } = calculateShippingCost(
        domesticShipment,
        [sampleMadeToOrderItem], // 1 qty, baseQty 1, baseAmount 150
        5725,
        "India"
      );
      expect(isShippingFree).toBe(false);
      expect(shippingCost).toBe(150);
    });

    it("calculates shipping charge based on baseAmount + excess qty * additionalAmount", () => {
      const { shippingCost, isShippingFree } = calculateShippingCost(
        domesticShipment,
        [sampleInStockItem], // qty 2, baseQty 1, baseAmount 150, additional 50
        1000,
        "India"
      );
      expect(isShippingFree).toBe(false);
      // 150 base + (2-1)*50 = 200
      expect(shippingCost).toBe(200);
    });

    it("supports explicit free shipping when flag is passed", () => {
      const { shippingCost, isShippingFree } = calculateShippingCost(
        domesticShipment,
        [sampleInStockItem],
        1000,
        "India",
        true
      );
      expect(isShippingFree).toBe(true);
      expect(shippingCost).toBe(0);
    });
  });

  describe("calculateCheckoutPrices", () => {
    it("computes 100% advance for in-stock orders", () => {
      const prices = calculateCheckoutPrices(
        [sampleInStockItem],
        domesticShipment,
        "India"
      );
      expect(prices.subtotal).toBe(1000);
      expect(prices.inStockItemsPrice).toBe(1000);
      expect(prices.madeToOrderItemsPrice).toBe(0);
      expect(prices.advancePay).toBe(1200); // 1000 + 200 shipping
      expect(prices.remainingBalance).toBe(0);
    });

    it("computes 50% advance for made-to-order items plus shipping", () => {
      const prices = calculateCheckoutPrices(
        [sampleMadeToOrderItem],
        domesticShipment,
        "India"
      );
      expect(prices.subtotal).toBe(5725);
      expect(prices.madeToOrderItemsPrice).toBe(5725);
      expect(prices.shippingCost).toBe(150);
      expect(prices.isShippingFree).toBe(false);
      // 5725 * 0.5 + 150 shipping = 3012.5
      expect(prices.advancePay).toBe(3012.5);
      expect(prices.remainingBalance).toBe(2862.5);
      expect(prices.total).toBe(5875);
    });

    it("applies coupon percentage discounts correctly", () => {
      const prices = calculateCheckoutPrices(
        [sampleInStockItem],
        domesticShipment,
        "India",
        10, // 10% coupon
        "WELCOME10"
      );
      expect(prices.subtotal).toBe(1000);
      expect(prices.couponDiscountAmount).toBe(100);
      // 900 + 200 shipping = 1100
      expect(prices.total).toBe(1100);
    });
  });

  describe("formatDeliveryDate", () => {
    it("formats dates properly", () => {
      const timestamp = calculateDeliveryTimestamp(5);
      const formatted = formatDeliveryDate(timestamp);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
    });
  });
});
