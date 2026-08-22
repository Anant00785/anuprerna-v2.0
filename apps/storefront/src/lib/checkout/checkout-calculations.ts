import { CartItem } from "@/types/domain/cart";
import { CheckoutPriceBreakdown, ShipmentOption } from "@/types/domain/checkout";

const DOMESTIC_FREE_SHIPPING_THRESHOLD = 2000;
const INTERNATIONAL_FREE_SHIPPING_THRESHOLD = 50000; // in INR

/**
 * Calculates delivery date timestamps from current time + days offset
 */
export function calculateDeliveryTimestamp(daysOffset: number): number {
  const d = new Date();
  d.setDate(d.getDate() + (daysOffset || 0));
  return d.getTime();
}

/**
 * Formats timestamps or dates into "DD MMM YYYY" string matching Angular formatDate pipe.
 */
export function formatDeliveryDate(timestampOrDate: number | Date | string | undefined): string {
  if (!timestampOrDate) return "";
  const d = new Date(timestampOrDate);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculates shipping cost for selected shipment option, items by order type, and country.
 * Matches Angular ShippingChargeCalculationService 1:1.
 */
export function calculateShippingCost(
  shipment: ShipmentOption | undefined,
  items: CartItem[],
  subtotal: number,
  country: string = "India",
  isExplicitFreeShipping: boolean = false
): {
  shippingCost: number;
  inStockShipmentCost: number;
  mtoShipmentCost: number;
  preOrderShipmentCost: number;
  isShippingFree: boolean;
} {
  if (items.length === 0) {
    return {
      shippingCost: 0,
      inStockShipmentCost: 0,
      mtoShipmentCost: 0,
      preOrderShipmentCost: 0,
      isShippingFree: true,
    };
  }

  if (isExplicitFreeShipping) {
    return {
      shippingCost: 0,
      inStockShipmentCost: 0,
      mtoShipmentCost: 0,
      preOrderShipmentCost: 0,
      isShippingFree: true,
    };
  }

  const isDomestic = country.toLowerCase() === "india";
  const baseQty = shipment?.baseQuantity ?? (isDomestic ? 5 : 4);
  const baseAmt = shipment?.baseAmount ?? (isDomestic ? 110 : 1500);
  const addAmt = shipment?.additionalAmount ?? (isDomestic ? 9 : 80);

  // Group quantities by order type matching Angular inStockShippingCalculation
  let inStockQty = 0;
  let madeToOrderQty = 0;
  let preOrderQty = 0;
  let swatchCount = 0;

  for (const item of items) {
    const isSwatch =
      item.productGroup === "swatch" ||
      item.product.name.toLowerCase().includes("swatch") ||
      Boolean(item.product.sku?.toLowerCase().includes("swatch"));

    const qty = Number(item.quantity) || 1;

    if (isSwatch) {
      swatchCount += qty;
      inStockQty += qty;
    } else if (item.orderType === "PRE_ORDER") {
      preOrderQty += qty;
    } else if (item.orderType === "MADE_TO_ORDER") {
      madeToOrderQty += qty;
    } else {
      inStockQty += qty;
    }
  }

  const calcBucket = (qty: number, isSwatchBucket: boolean = false): number => {
    if (!qty || qty <= 0) return 0;
    if (qty >= baseQty && !isSwatchBucket) {
      const excess = qty - baseQty;
      return baseAmt + excess * addAmt;
    }
    return baseAmt;
  };

  const isAllSwatches = swatchCount > 0 && inStockQty === swatchCount;
  const inStockShipmentCost = calcBucket(inStockQty, isAllSwatches);
  const mtoShipmentCost = calcBucket(madeToOrderQty, false);
  const preOrderShipmentCost = calcBucket(preOrderQty, false);

  const totalShipping = inStockShipmentCost + mtoShipmentCost + preOrderShipmentCost;
  const shippingCost = Math.round(totalShipping * 100) / 100;

  return {
    shippingCost,
    inStockShipmentCost,
    mtoShipmentCost,
    preOrderShipmentCost,
    isShippingFree: shippingCost === 0,
  };
}

/**
 * Calculates complete price breakdown for checkout items, discounts, shipping, and advance pay.
 */
export function calculateCheckoutPrices(
  items: CartItem[],
  shipment: ShipmentOption | undefined,
  country: string = "India",
  couponPercentage: number = 0,
  couponCode?: string,
  wholesaleDiscountPercent: number = 0
): CheckoutPriceBreakdown {
  let subtotal = 0;
  let totalWithoutDiscount = 0;
  let inStockItemsPrice = 0;
  let madeToOrderItemsPrice = 0;
  let preOrderItemsPrice = 0;
  let containsSwatch = false;

  for (const item of items) {
    const isSwatch =
      item.productGroup === "swatch" ||
      item.product.name.toLowerCase().includes("swatch") ||
      Boolean(item.product.sku?.toLowerCase().includes("swatch"));
    if (isSwatch) containsSwatch = true;

    const basePrice = item.unitPrice * item.quantity;
    const effectivePrice = (item.discountedUnitPrice ?? item.unitPrice) * item.quantity;

    totalWithoutDiscount += basePrice;
    subtotal += effectivePrice;

    if (item.orderType === "PRE_ORDER") {
      preOrderItemsPrice += effectivePrice;
    } else if (item.orderType === "MADE_TO_ORDER") {
      madeToOrderItemsPrice += effectivePrice;
    } else {
      inStockItemsPrice += effectivePrice;
    }
  }

  const volumeDiscountAmount = Math.max(0, totalWithoutDiscount - subtotal);

  // Wholesale membership loyalty discount
  let wholesaleDiscountAmount = 0;
  if (wholesaleDiscountPercent > 0 && subtotal > 0) {
    wholesaleDiscountAmount = Math.round(((subtotal * wholesaleDiscountPercent) / 100) * 100) / 100;
  }

  const priceAfterWholesale = Math.max(0, subtotal - wholesaleDiscountAmount);

  // Coupon discount
  let couponDiscountAmount = 0;
  if (couponPercentage > 0 && priceAfterWholesale > 0) {
    couponDiscountAmount = Math.round(((priceAfterWholesale * couponPercentage) / 100) * 100) / 100;
  }

  const discountedItemsTotal = Math.max(0, priceAfterWholesale - couponDiscountAmount);

  const {
    shippingCost,
    inStockShipmentCost,
    mtoShipmentCost,
    preOrderShipmentCost,
    isShippingFree,
  } = calculateShippingCost(shipment, items, discountedItemsTotal, country);

  const grandTotal = Math.round((discountedItemsTotal + shippingCost) * 100) / 100;

  // Advance Payment Calculation (Matching Angular price.component.ts lines 162-185 1:1):
  // - In-Stock: 100% item price + in-stock shipping -> Payable Now
  // - Made to Order: 50% advance + MTO shipping -> Payable Now; 50% -> Payable Before Dispatch
  // - Pre-Order: 50% advance -> Payable Now; 50% + pre-order shipping -> Payable Before Dispatch
  let advancePay = 0;
  let remainingBalance = 0;
  const partialAdvanceItemsPrice = madeToOrderItemsPrice + preOrderItemsPrice;

  if (partialAdvanceItemsPrice > 0) {
    const ratio = subtotal > 0 ? discountedItemsTotal / subtotal : 1;
    const discountedInStock = inStockItemsPrice * ratio;
    const discountedMTO = madeToOrderItemsPrice * ratio;
    const discountedPreOrder = preOrderItemsPrice * ratio;

    const mtoAdvance = discountedMTO * 0.5;
    const preOrderAdvance = discountedPreOrder * 0.5;

    const mtoRemaining = discountedMTO - mtoAdvance;
    const preOrderRemaining = discountedPreOrder - preOrderAdvance;

    advancePay =
      Math.round(
        (discountedInStock +
          mtoAdvance +
          preOrderAdvance +
          (isShippingFree ? 0 : inStockShipmentCost + mtoShipmentCost)) *
          100
      ) / 100;
    remainingBalance =
      Math.round(
        (mtoRemaining +
          preOrderRemaining +
          (isShippingFree ? 0 : preOrderShipmentCost)) *
          100
      ) / 100;

    // Ensure grand total balances
    const sum = Math.round((advancePay + remainingBalance) * 100) / 100;
    if (sum !== grandTotal) {
      advancePay = Math.round((grandTotal - remainingBalance) * 100) / 100;
    }
  } else {
    advancePay = Math.round(grandTotal);
    remainingBalance = 0;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    volumeDiscountAmount: Math.round(volumeDiscountAmount * 100) / 100,
    wholesaleDiscountAmount,
    autoDiscountAmount: 0,
    couponCode,
    couponPercentage,
    couponDiscountAmount,
    shippingCost,
    isShippingFree,
    total: grandTotal,
    advancePay,
    remainingBalance,
    inStockItemsPrice: Math.round(inStockItemsPrice * 100) / 100,
    madeToOrderItemsPrice: Math.round(madeToOrderItemsPrice * 100) / 100,
    preOrderItemsPrice: Math.round(preOrderItemsPrice * 100) / 100,
    containsSwatch,
  };
}
