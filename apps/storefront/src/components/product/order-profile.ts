// Pure, framework-free order-model resolver shared by the PDP (ProductInfoPanel),
// the lead-time modal, and the cart-enrich BFF route. No 'use client', no I/O —
// safe to import from client components AND server routes.
//
// Resolves, for a product, its EFFECTIVE order model + minimum-order-quantity,
// grounded in the REAL loom-v2 data shape (verified against live):
//   - made-to-order : madeToOrderProfileEnabled AND made-to-order is TRIGGERED
//                     (out of ready stock, OR a customization is selected, OR the
//                     requested qty exceeds the shelf). MTO is a POSSIBILITY, not
//                     the forced mode -- an in-stock, un-customized MTO-capable
//                     fabric stays IN-STOCK retail (see in-stock below). MOQ =
//                     madeToOrderProfile.minimumOrderQuantity WHEN present (>1),
//                     else 1 (loom-v2 leaves the MTO profile null).
//   - pre-order     : NOT in ready stock AND has volume tiers flagged preOrder:true
//                     (each with its own minimumOrderQuantity) -> MOQ = SMALLEST.
//   - in-stock      : ready stock on the shelf -> NO hard MOQ (moq = 1). Any bulk /
//                     pre-order volume tiers are OPTIONAL upgrades, not a floor.
//
// MOQ is UNIVERSAL (guest / b2c / b2b alike) and shown openly. Buyer mode never
// changes it. IMPORTANT: pre-order only becomes a HARD floor when the item is out
// of ready stock — an in-stock fabric with pre-order tiers stays buy-any-quantity
// retail (its 9.5 m of khadi can't be forced to a 75 m minimum).
import type { ProductDetail, VolumeDiscountItem } from './types';

export type OrderTypeKind = 'in-stock' | 'made-to-order' | 'pre-order';

export interface EffectiveOrderProfile {
  orderType: OrderTypeKind;
  /** Minimum order quantity in product.unit. 1 when none. */
  moq: number;
  deliveryFromDays: number | null;
  deliveryToDays: number | null;
  /** true only for the pre-order lane (advance-payment volume tier). */
  preOrder: boolean;
}

// Minimal product shape this resolver needs — accepts a full ProductDetail OR
// any thinner object carrying the same fields (defensive for BFF callers).
export interface OrderProfileInput {
  unit?: string;
  madeToOrderProfileEnabled?: boolean | null;
  madeToOrderProfile?: { minimumOrderQuantity?: number; deliveryFromDays?: number; deliveryToDays?: number } | null;
  subCategory?: { madeToOrderProfile?: { minimumOrderQuantity?: number; deliveryFromDays?: number; deliveryToDays?: number } } | null;
  volumeDiscountProfileEnabled?: boolean | null;
  volumeDiscountProfile?: {
    volumeDiscountProfileItemList?: VolumeDiscountItem[];
    /** Present INSTEAD of the tier list when the caller is not entitled to trade
     *  pricing (the wrapper redacts the ladder, never the MOQ). Same numbers the
     *  smallest pre-order tier carried, so the resolved floor and lead time are
     *  identical with or without entitlement. */
    preOrderMinimumOrderQuantity?: number | null;
    preOrderDeliveryFromDays?: number | null;
    preOrderDeliveryToDays?: number | null;
    tradePricingRedacted?: boolean;
  } | null;
}

export function effectiveOrderProfile(
  product: OrderProfileInput,
  opts: { inStock?: boolean; inStockQty?: number; customized?: boolean; requestedQty?: number } = {},
): EffectiveOrderProfile {
  // Conservative default: treat as in-stock unless the caller says otherwise, so
  // an unknown stock state never forces a wrong pre-order floor.
  const inStock = opts.inStock ?? true;
  // Effective READY-STOCK quantity for the stock-first decision. When the caller
  // does not specify it, infer an unbounded shelf for in-stock / an empty shelf for
  // out-of-stock so thin callers keep the same decision.
  const inStockQty = opts.inStockQty ?? (inStock ? Number.POSITIVE_INFINITY : 0);
  const customized = opts.customized ?? false;
  const requestedQty = opts.requestedQty ?? 1;

  const mtoProfile = product.madeToOrderProfileEnabled
    ? (product.subCategory?.madeToOrderProfile ?? product.madeToOrderProfile ?? undefined)
    : undefined;
  const mtoMoq = mtoProfile?.minimumOrderQuantity ?? 0;

  // STOCK-FIRST. madeToOrderProfileEnabled means made-to-order is POSSIBLE, not
  // that it is ALWAYS the mode. A made-to-order-capable product resolves to
  // made-to-order ONLY when one of these triggers fires:
  //   (1) it is out of ready stock (inStockQty <= 0), OR
  //   (2) a customization (custom dye / finish / Pantone) is selected, OR
  //   (3) the requested qty exceeds the ready-stock shelf (the overage is built
  //       to order).
  // Otherwise an in-stock made-to-order-capable fabric sells as PLAIN IN-STOCK
  // retail (moq 1, no lead time), matching live anuprerna.com (a 10 m bolt of
  // khadi is bought off the shelf, NOT forced to a 25 m minimum).
  const madeToOrderTriggered =
    !!product.madeToOrderProfileEnabled &&
    (inStockQty <= 0 || customized || requestedQty > inStockQty);

  if (madeToOrderTriggered) {
    // MOQ = profile MOQ when numeric (>0), else 1 (loom-v2 leaves the profile null
    // and carries MTO-ness via the enabled flag + madeToOrderFabric).
    return {
      orderType: 'made-to-order',
      moq: mtoMoq > 0 ? mtoMoq : 1,
      deliveryFromDays: mtoProfile?.deliveryFromDays ?? null,
      deliveryToDays: mtoProfile?.deliveryToDays ?? null,
      preOrder: false,
    };
  }

  // 3. Pre-order lane — ONLY when the item is NOT in ready stock. Smallest tier
  //    flagged preOrder:true, each carrying its own minimumOrderQuantity.
  const vd = product.volumeDiscountProfileEnabled
    ? (product.volumeDiscountProfile?.volumeDiscountProfileItemList ?? [])
    : [];
  const preTiers = vd
    .filter((t) => t?.preOrder && typeof t.minimumOrderQuantity === 'number' && t.minimumOrderQuantity > 0)
    .sort((a, b) => a.minimumOrderQuantity - b.minimumOrderQuantity);
  if (!inStock && preTiers.length > 0) {
    const t = preTiers[0];
    return {
      orderType: 'pre-order',
      moq: t.minimumOrderQuantity,
      deliveryFromDays: t.deliveryFromDays ?? null,
      deliveryToDays: t.deliveryToDays ?? null,
      preOrder: true,
    };
  }
  // Same lane, REDACTED payload: the tier list is empty because the caller is
  // not entitled to trade pricing, but the pre-order MINIMUM and its lead time
  // are still facts every buyer needs before adding to cart. Using them here is
  // what keeps the quoted floor identical for a retail buyer to what it was
  // before the gate existed.
  const vdp = product.volumeDiscountProfileEnabled ? product.volumeDiscountProfile : null;
  const redactedPreMoq = vdp?.tradePricingRedacted ? (vdp.preOrderMinimumOrderQuantity ?? 0) : 0;
  if (!inStock && preTiers.length === 0 && redactedPreMoq > 0) {
    return {
      orderType: 'pre-order',
      moq: redactedPreMoq,
      deliveryFromDays: vdp?.preOrderDeliveryFromDays ?? null,
      deliveryToDays: vdp?.preOrderDeliveryToDays ?? null,
      preOrder: true,
    };
  }

  // 4. In-stock (retail) — no minimum. Bulk / pre-order tiers stay optional.
  return { orderType: 'in-stock', moq: 1, deliveryFromDays: null, deliveryToDays: null, preOrder: false };
}

// Human suffix for the MOQ spec line, e.g. '(made to order)' / '(pre-order)'.
export function orderTypeSuffix(t: OrderTypeKind): string {
  return t === 'made-to-order' ? 'made to order' : t === 'pre-order' ? 'pre-order' : '';
}
