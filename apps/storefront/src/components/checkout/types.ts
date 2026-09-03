// Shared TYPES for the checkout UI (read-only BFF data shapes). No writes.

export interface VolumeTier {
  minimumOrderQuantity: number;
  discount: number; // percent
  preOrder?: boolean;
  deliveryFromDays?: number;
  deliveryToDays?: number;
  advancePayment?: number; // percent paid today for PRE_ORDER, if present
}

export interface CartProduct {
  /** The PRODUCT's own id — distinct from the wrapping preview's id, and the
   *  one order creation must name (the backend rejects a preview id). */
  id?: number;
  name?: string;
  slug?: string;
  sku?: string;
  price?: number; // INR
  heroImage?: string;
  productGroup?: string;
  // Variant attributes — present ONLY when an item is enriched from the
  // catalogue (the thin Loom cart item carries none of these).
  material?: string;
  width?: string | number;
  colour?: string;
  gsm?: number;
  totalQuantity?: number;
  // Made-to-order profile flag (surfaced by /api/cart/enrich) — drives the
  // Made-To-Order badge + order-type sectioning, mirroring live's PDP logic.
  madeToOrderProfileEnabled?: boolean;
  // Universal minimum-order-quantity (from /api/cart/enrich effectiveOrderProfile).
  // >1 => the line stepper floors here and flags a below-minimum quantity.
  minimumOrderQuantity?: number;
  preOrder?: boolean;
  volumeDiscountProfile?: { volumeDiscountProfileItemList?: VolumeTier[] };
  volumeDiscountProfileEnabled?: boolean;
}

export interface CartItem {
  id?: number;
  quantity?: number;
  unit?: string; // 'METER'
  makingCharge?: number;
  // The cart RECORD's OWN authoritative unit price (the add-time customized
  // price). This — NOT makingCharge — is the correct per-line display price.
  price?: number;
  orderType?: string; // 'PRE_ORDER' | ...
  productGroup?: string; // 'fabric'
  fabricProductPreview?: { product?: CartProduct };
  // ---- THIN Loom cart-line ids (present on /get/cart-item/list rows) — used
  // to resolve display data via /api/cart/enrich. ----
  fabricProductId?: number;
  finishedProductId?: number;
  selectedFinishId?: string | number;
  selectedFabricId?: number;
  selectedSizeOptionId?: number;
  customSize?: Record<string, unknown> | null;
  sku?: string;
  // Human customization summary derived by /api/cart/enrich (fabric/finish/size/
  // custom-measurements). Undefined for plain lines.
  customization?: string;
  // Chosen customisation-fabric SKU (from fabricPreview.sku) — display only.
  fabricSku?: string | null;
  // DISPLAY-ONLY add-on breakdown from /api/cart/enrich. base + finishAddOn +
  // customSizeAddOn (+ fabricConsumptionCost) === total === the stored line price.
  priceBreakdown?: {
    base: number;
    finishAddOn: number;
    customSizeAddOn: number;
    fabricConsumptionCost?: number;
    total: number;
  };
  // Structured customisation labels for the per-line details popup.
  customDetails?: {
    fabricName?: string | null;
    fabricSku?: string | null;
    finishName?: string | null;
    sizeLabel?: string | null;
    customSize?: string | null;
  };
}

export interface Address {
  id?: number;
  name?: string;
  companyName?: string;
  addressLineOne?: string;
  addressLineTwo?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  contactEmail?: string;
  addressType?: string; // 'SHIPPING' | 'BILLING'
  primaryBillingAddress?: boolean;
  primaryShippingAddress?: boolean;
}

export interface Shipment {
  id?: number;
  name?: string; // 'Regular - By Road'
  baseAmount?: number; // INR
  baseQuantity?: number;
  additionalAmount?: number;
  estimatedFromDay?: number;
  estimatedToDay?: number;
  locationType?: string; // 'DOMESTIC' | 'INTERNATIONAL'
}

export interface Discount {
  discountType?: string; // 'PERCENTAGE_OFF' | 'FREE_SHIPPING'
  discountMethod?: string;
  discountPercentage?: number;
  minimumOrderValue?: number;
  location?: string; // 'DOMESTIC' | 'INTERNATIONAL'
  couponCode?: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
}

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirm';

// ---- Pure helpers (no I/O) -------------------------------------------------

/** Pick the volume-discount tier that applies for a given quantity (highest min <= qty). */
export function tierForQuantity(p: CartProduct | undefined, qty: number): VolumeTier | null {
  const list = p?.volumeDiscountProfile?.volumeDiscountProfileItemList;
  if (!p?.volumeDiscountProfileEnabled || !Array.isArray(list) || list.length === 0) return null;
  const eligible = list
    .filter((t) => (t.minimumOrderQuantity ?? 0) <= qty)
    .sort((a, b) => (b.minimumOrderQuantity ?? 0) - (a.minimumOrderQuantity ?? 0));
  return eligible[0] ?? null;
}

/** Discounted unit price (INR) after the applicable volume tier. */
export function discountedUnitPrice(p: CartProduct | undefined, qty: number): number {
  const base = p?.price ?? 0;
  const tier = tierForQuantity(p, qty);
  const pct = tier?.discount ?? 0;
  return base * (1 - pct / 100);
}

/** Shipping cost (INR) for a selected method given total quantity. */
export function shipmentCost(s: Shipment | null | undefined, totalQty: number): number {
  if (!s) return 0;
  const base = s.baseAmount ?? 0;
  const baseQty = s.baseQuantity ?? 0;
  const add = s.additionalAmount ?? 0;
  return base + add * Math.max(0, totalQty - baseQty);
}

/** Format a Date as e.g. '13th Aug, 2026'. */
export function formatDeliveryDate(d: Date): string {
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const month = d.toLocaleString('en-US', { month: 'short' });
  return day + suffix + ' ' + month + ', ' + d.getFullYear();
}

// ---------------------------------------------------------------------------
// THIN-CART pricing helpers (added Wave: cart+checkout).
//
// The Loom /get/cart-item/list response is THIN: each item carries ONLY
// { quantity, unit, makingCharge, orderType, productGroup, id, version,
//   selectedFinishId, customSize } — it does NOT carry the product name,
// price, slug, material, colour or stock. The ONLY per-line money on the
// item is makingCharge (the unit price captured at add-time).
//
// fabricProductPreview?.product is therefore (almost) always undefined here,
// so we must price the line off makingCharge, falling back to the (rare)
// enriched product price if a join is ever wired upstream.
// ---------------------------------------------------------------------------

/** Per-line unit price (INR): prefer enriched product price, else the cart
 *  item's own makingCharge (captured at add-time). Never NaN. */
export function cartUnitPrice(item: CartItem): number {
  // The cart RECORD's own `price` is the authoritative customized unit price
  // (add-time agreed price). Prefer it, then the enriched product price, then
  // makingCharge (0 for MTO fabric / stale for swatch, so it is the last resort).
  if (typeof item.price === 'number' && item.price > 0) return item.price;
  const p = item.fabricProductPreview?.product;
  const fromProduct = typeof p?.price === 'number' ? p.price : 0;
  if (fromProduct > 0) return fromProduct;
  const mc = typeof item.makingCharge === 'number' ? item.makingCharge : 0;
  return mc > 0 ? mc : 0;
}

/** Per-line subtotal = qty x effective unit price (after any volume tier). */
export function lineTotal(item: CartItem, qty: number): number {
  const p = item.fabricProductPreview?.product;
  // When the product is enriched, honour its volume-discount tier; otherwise
  // the flat makingCharge already reflects the price the customer agreed to.
  const tierPrice = p ? discountedUnitPrice(p, qty) : 0;
  const unit = tierPrice > 0 ? tierPrice : cartUnitPrice(item);
  return unit * Math.max(0, qty);
}

/** Human stock / lead-time line for a cart item, from orderType (+ enriched
 *  stock if present). Returns null when nothing meaningful can be said. */
export function stockLine(item: CartItem): { inStock: boolean; label: string } | null {
  const ot = (item.orderType || '').toUpperCase();
  if (ot.includes('PRE')) {
    const tier = tierForQuantity(item.fabricProductPreview?.product, item.quantity ?? 1);
    if (tier?.deliveryFromDays != null && tier?.deliveryToDays != null) {
      const wkFrom = Math.max(1, Math.round(tier.deliveryFromDays / 7));
      const wkTo = Math.max(wkFrom, Math.round(tier.deliveryToDays / 7));
      return { inStock: false, label: 'Made to order — ships in ' + wkFrom + '–' + wkTo + ' weeks' };
    }
    return { inStock: false, label: 'Made to order — ships in 3–6 weeks' };
  }
  if (ot.includes('STOCK')) return { inStock: true, label: 'In stock' };
  return null;
}

// ---------------------------------------------------------------------------
// ORDER-TYPE classification + concrete delivery windows (Wave: cart parity).
//
// The thin Loom cart line's stored orderType is unreliable (e.g. a made-to-order
// khadi is seeded IN_STOCK). Mirror the PDP/live product truth: a product with
// madeToOrderProfileEnabled IS made-to-order; PRE_ORDER lines stay pre-order;
// swatches always ship from stock. Used to group lines into section cards
// (In Stock / Made to order / Pre Order) and to pick a delivery window.
// ---------------------------------------------------------------------------
export type EffectiveOrderType = 'IN_STOCK' | 'MADE_TO_ORDER' | 'PRE_ORDER';

export const ORDER_TYPE_SECTION: Record<EffectiveOrderType, string> = {
  IN_STOCK: 'In Stock',
  MADE_TO_ORDER: 'Made to order',
  PRE_ORDER: 'PRE ORDER',
};

export function effectiveOrderType(item: CartItem): EffectiveOrderType {
  const ot = (item.orderType || '').toUpperCase();
  const group = (item.productGroup || item.fabricProductPreview?.product?.productGroup || '').toLowerCase();
  if (group === 'swatch') return 'IN_STOCK'; // swatches ship from ready stock
  if (ot.includes('PRE')) return 'PRE_ORDER';
  if (ot.includes('MADE') || ot.includes('MTO')) return 'MADE_TO_ORDER';
  // Product truth (matches the PDP): MTO-profile-enabled => made to order.
  if (item.fabricProductPreview?.product?.madeToOrderProfileEnabled) return 'MADE_TO_ORDER';
  return 'IN_STOCK';
}

/** Concrete estimated-delivery window (from/to Date) per line, consistent with
 *  the PDP: in-stock ~2-3 days, made-to-order ~1 month, pre-order its own longer
 *  window (prefers the product's volume-tier delivery days when present). */
export function deliveryWindow(item: CartItem): { from: Date; to: Date } {
  const et = effectiveOrderType(item);
  const tier = tierForQuantity(item.fabricProductPreview?.product, item.quantity ?? 1);
  let fromDays: number;
  let toDays: number;
  if (et === 'IN_STOCK') {
    fromDays = 2; toDays = 3;
  } else if (et === 'PRE_ORDER') {
    if (tier?.deliveryFromDays != null && tier?.deliveryToDays != null) {
      fromDays = tier.deliveryFromDays; toDays = tier.deliveryToDays;
    } else { fromDays = 42; toDays = 56; } // ~6-8 weeks
  } else { // MADE_TO_ORDER ~1 month
    if (tier?.deliveryFromDays != null && tier?.deliveryToDays != null) {
      fromDays = tier.deliveryFromDays; toDays = tier.deliveryToDays;
    } else { fromDays = 25; toDays = 35; }
  }
  const from = new Date(); from.setDate(from.getDate() + fromDays);
  const to = new Date(); to.setDate(to.getDate() + toDays);
  return { from, to };
}

/** Per-line minimum order quantity (from the enriched product). 1 => no minimum. */
export function lineMoq(item: CartItem): number {
  // Swatches are single-piece samples — no minimum, regardless of the parent product.
  const group = (item.productGroup || item.fabricProductPreview?.product?.productGroup || '').toLowerCase();
  if (group === 'swatch') return 1;
  const m = item.fabricProductPreview?.product?.minimumOrderQuantity;
  return typeof m === 'number' && m > 1 ? m : 1;
}

/** Formatted 'Estimated Delivery' range string for a line. */
export function deliveryRange(item: CartItem): string {
  const { from, to } = deliveryWindow(item);
  return formatDeliveryDate(from) + ' - ' + formatDeliveryDate(to);
}
