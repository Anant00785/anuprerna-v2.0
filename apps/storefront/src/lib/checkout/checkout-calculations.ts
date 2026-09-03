// ---------------------------------------------------------------------------
// STATUS 2026-09-03: THIS MODULE HAS NO CALLERS.
//
// Its only consumers were CheckoutPage.tsx and its eight exclusive children,
// deleted today as dead code. The LIVE checkout (`/checkout` -> CheckoutShell)
// prices shipping through a different function entirely,
// `components/checkout/types.ts` -> shipmentCost(), and posts `shipmentId` for
// the backend to price.
//
// It is kept, for now, because it is the only non-fabricating checkout price
// helper in the codebase and a new checkout UI would want it — the invented
// 110/1500 fallbacks are gone, so it is no longer a landmine. If nothing has
// picked it up, delete it and its spec. See docs/KNOWN-GAPS.md.
// ---------------------------------------------------------------------------
import { CartItem } from "@/types/domain/cart";
import { CheckoutPriceBreakdown, ShipmentOption } from "@/types/domain/checkout";

// DELETED 2026-09-03: DOMESTIC_FREE_SHIPPING_THRESHOLD (2000) and
// INTERNATIONAL_FREE_SHIPPING_THRESHOLD (50000) lived here and were referenced
// by NOTHING — not by calculateShippingCost, not by any caller, not anywhere in
// the app. No free-shipping threshold is enforced in this storefront: the only
// free shipping that exists is the `isExplicitFreeShipping` flag a caller
// passes in. Two named money constants sitting unused in a pricing module read
// like a live business rule and are not one. See docs/KNOWN-GAPS.md.

/**
 * Delivery date timestamp = now + days offset.
 *
 * Returns `undefined` when the backend gave no day count. It used to coerce a
 * missing offset to 0 with `daysOffset || 0`, which renders as "arriving today"
 * — a delivery promise nobody made. A missing estimate is absent, not guessed.
 */
export function calculateDeliveryTimestamp(daysOffset: number | undefined): number | undefined {
  if (typeof daysOffset !== "number" || !Number.isFinite(daysOffset)) return undefined;
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
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
 * Shipping cost for a CHOSEN shipment option, split by order type.
 *
 * `shipment` is REQUIRED. It used to be optional, and an absent one produced
 *   baseAmount ?? (isDomestic ? 110 : 1500)
 * — inventing ₹110 / ₹1500 that flowed straight into the order total. Since
 * `/api/checkout/shipment` now fails loudly, an absent shipment means "we have
 * no quote", and that must never become a price. Making the parameter required
 * moves the guarantee into the type system: there is no way to ask this
 * function for a cost you do not have a quote for.
 *
 * `country` no longer selects a fallback rate; it is kept only because the
 * caller's copy still reads "your delivery address determines the final rate"
 * and the backend prices the real charge from the shipment record.
 */
export function calculateShippingCost(
  shipment: ShipmentOption,
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

  // Straight off the quote. A `0` here is a real price (free shipping, no
  // per-unit surcharge) and survives, because nothing substitutes for it.
  const baseQty = shipment.baseQuantity;
  const baseAmt = shipment.baseAmount;
  const addAmt = shipment.additionalAmount;

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

  // NO QUOTE, NO TOTAL. Without a shipment option there is no shipping cost to
  // add, so every figure downstream of it — the total, the amount payable now,
  // the balance — is unknown too. Returning items-only numbers here would be
  // the same defect in a quieter form: an understated total presented as the
  // real one, and (in the Razorpay path) charged as it.
  if (!shipment) {
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      volumeDiscountAmount: Math.round(volumeDiscountAmount * 100) / 100,
      wholesaleDiscountAmount,
      autoDiscountAmount: 0,
      couponCode,
      couponPercentage,
      couponDiscountAmount,
      shippingCost: null,
      isShippingFree: false,
      hasShippingQuote: false,
      total: null,
      advancePay: null,
      remainingBalance: null,
      inStockItemsPrice: Math.round(inStockItemsPrice * 100) / 100,
      madeToOrderItemsPrice: Math.round(madeToOrderItemsPrice * 100) / 100,
      preOrderItemsPrice: Math.round(preOrderItemsPrice * 100) / 100,
      containsSwatch,
    };
  }

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
    hasShippingQuote: true,
    total: grandTotal,
    advancePay,
    remainingBalance,
    inStockItemsPrice: Math.round(inStockItemsPrice * 100) / 100,
    madeToOrderItemsPrice: Math.round(madeToOrderItemsPrice * 100) / 100,
    preOrderItemsPrice: Math.round(preOrderItemsPrice * 100) / 100,
    containsSwatch,
  };
}
