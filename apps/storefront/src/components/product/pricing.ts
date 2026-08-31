// ---------------------------------------------------------------------------
// Pure PDP pricing engine -- faithful port of the Angular
// ProductInformationService.calculateFinishProductPrice / calculateFabricProductPrice
// / calculateVDProductPrice + calculateDiscountPrice.
// (fabric/src/app/product/product-information-service.ts)
//
// No 'server-only' -- these are pure functions usable from client components.
//
// The MTO fabric-consumption term the live site folds into a finished product's
// displayed base price:
//     fabricPrice = fabricUnitPrice * consumedFabric
// where fabricUnitPrice is the chosen (or default madeToOrderFabric) per-metre
// price and consumedFabric is the SELECTED SIZE's consumedFabric (else the MTO
// profile's, else 1). For the finished skirt: 394 * 2 = 788, folded onto the
// 2,642 product price => the live 3,430 base.
// ---------------------------------------------------------------------------
import type { ProductDetail, SizeProfileOptionItem, VolumeDiscountItem } from './types';

/** price - price*(discount/100). Mirrors calculateDiscountPrice. */
export function applyDiscount(price: number, discount: number): number {
  return price - price * (discount / 100);
}

/**
 * Total orderable stock of a made-to-order fabric. Live loom-v2 pre-sums this into
 * totalQuantity; the demo backend omits totalQuantity and exposes quantity +
 * externalQuantity separately (total = quantity + externalQuantity). Take the max so
 * BOTH shapes resolve to the same number (834.5 for the skirt's base fabric).
 */
export function mtoFabricTotalQuantity(
  f?: { totalQuantity?: number | null; quantity?: number | null; externalQuantity?: number | null } | null,
): number {
  if (!f) return 0;
  const summed = (f.quantity ?? 0) + (f.externalQuantity ?? 0);
  return Math.max(f.totalQuantity ?? 0, summed);
}

/**
 * consumed-fabric metres for a made-to-order product given the currently-selected
 * size option. Port of the consumedFabric resolution inside calculateFinishProductQuantity:
 * the selected size option's consumedFabric wins; otherwise the MTO profile's
 * (calculatedMTOConsumedFabric), otherwise 1.
 */
export function resolveConsumedFabric(
  product: ProductDetail,
  sizeOption?: SizeProfileOptionItem | null,
): number {
  const sc = sizeOption?.consumedFabric;
  if (sc != null && sc > 0) return sc;
  const mc = product.madeToOrderProfileEnabled ? product.madeToOrderProfile?.consumedFabric : undefined;
  return mc != null && mc > 0 ? mc : 1;
}

/**
 * The per-metre fabric unit price the price math should use: the selected custom
 * fabric's price if one is picked, else the default madeToOrderFabric price, else
 * the product's own price (mirrors reCalculatePrice's selectedFabricPrice).
 */
export function defaultFabricUnitPrice(product: ProductDetail, selectedFabricPrice?: number | null): number {
  if (selectedFabricPrice != null) return selectedFabricPrice;
  if (product.madeToOrderFabric) return product.madeToOrderFabric.price;
  return product.price;
}

export interface CustomizedPriceInput {
  /** per-metre price of the chosen/default fabric (defaultFabricUnitPrice). */
  fabricUnitPrice: number;
  /** metres consumed (resolveConsumedFabric). */
  consumedFabric: number;
  /** summed finish add-on (0 when none). */
  finishPrice: number;
  /** custom-size profile price (0 unless a custom size is entered). */
  customSizePrice: number;
}
export interface CustomizedPrice {
  /** the calculatedPrice sent to the cart + shown as the unit price. */
  unitPrice: number;
  /** makingCharge sent to the cart (product.price for finished; price-mtoFabricPrice for fabric). */
  makingCharge: number;
  /** fabricUnitPrice * consumedFabric -- the folded fabric-consumption cost. */
  fabricPrice: number;
}

/**
 * Port of calculateFinishProductPrice (finished) / calculateFabricProductPrice (fabric).
 *   finished: unit = product.price + fabricPrice + finish + customSize;  makingCharge = product.price
 *   fabric  : unit = (product.price - mtoFabricPrice) + fabricPrice + finish + customSize;
 *             makingCharge = product.price - mtoFabricPrice
 */
export function computeCustomizedUnitPrice(product: ProductDetail, i: CustomizedPriceInput): CustomizedPrice {
  const fabricPrice = i.fabricUnitPrice * i.consumedFabric;
  const finish = i.finishPrice ?? 0;
  const custom = i.customSizePrice ?? 0;
  if (product.productGroup === 'finished') {
    return { unitPrice: product.price + fabricPrice + finish + custom, makingCharge: product.price, fabricPrice };
  }
  const mtoFabricPrice = product.madeToOrderFabric ? product.madeToOrderFabric.price : 0;
  const makingCharge = product.price - mtoFabricPrice;
  return { unitPrice: makingCharge + fabricPrice + finish + custom, makingCharge, fabricPrice };
}

/** Extra customization terms threaded into the bulk/volume-tier price so it stays
 *  consistent with the fabric-inclusive base. Omit => legacy behaviour (fabricPrice 0). */
export interface VDExtras {
  fabricUnitPrice?: number;
  consumedFabric?: number;
  finishPrice?: number;
  customSizePrice?: number;
}

/**
 * Port of calculateVDProductPrice for the storefront's common case (the sub-fabric
 * volume-discount tier list is stripped by the lean loader, so that inner discount is
 * not modelled). fabricPrice is added AFTER the tier discount, exactly like live.
 * @param loyaltyDiscount member percentileDiscount (0 when not an active member)
 */
export function calculateVDProductPrice(
  product: ProductDetail,
  tier: VolumeDiscountItem,
  loyaltyDiscount = 0,
  extras?: VDExtras,
): number {
  const consumedFabric = extras?.consumedFabric ?? 1;
  const fabricUnit = extras?.fabricUnitPrice ?? 0;
  const finish = extras?.finishPrice ?? 0;
  const custom = extras?.customSizePrice ?? 0;
  let fabricPrice = fabricUnit * consumedFabric;
  if (loyaltyDiscount) fabricPrice = applyDiscount(fabricPrice, loyaltyDiscount);

  let itemPrice: number;
  if (product.productGroup === 'finished') {
    itemPrice = product.price + finish + custom;
  } else {
    const mtoFabricPrice = product.madeToOrderFabric ? product.madeToOrderFabric.price : 0;
    itemPrice = (product.price - mtoFabricPrice) + finish + custom;
  }
  if (loyaltyDiscount) itemPrice = applyDiscount(itemPrice, loyaltyDiscount);
  return applyDiscount(itemPrice, tier.discount) + fabricPrice;
}

/** Best (deepest) tier = highest discount. Used for the 'Bulk Price @ ...' headline. */
export function bestTier(items: VolumeDiscountItem[]): VolumeDiscountItem | undefined {
  if (!items || items.length === 0) return undefined;
  return [...items].sort((a, b) => b.discount - a.discount)[0];
}

/** The headline bulk price (deepest tier), member-aware. */
export function bulkPrice(
  product: ProductDetail,
  items: VolumeDiscountItem[],
  loyaltyDiscount = 0,
  extras?: VDExtras,
): number | null {
  const tier = bestTier(items);
  if (!tier) return null;
  return calculateVDProductPrice(product, tier, loyaltyDiscount, extras);
}

/**
 * Member-discounted unit price for the headline price line (no volume tier).
 * Mirrors product-detail.calculateDiscounts() base member branch: the member
 * percentileDiscount applies to the FULL calculatedPrice (unitPrice).
 */
export function memberUnitPrice(unitPrice: number, loyaltyDiscount: number): number {
  return applyDiscount(unitPrice, loyaltyDiscount);
}
