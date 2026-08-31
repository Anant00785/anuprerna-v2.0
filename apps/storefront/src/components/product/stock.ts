// Faithful port of the live fabric app's finished/fabric stock calculation
// (PrepareInstockCalculationService + ProductInformationService). Pure — safe
// to import from client components.
import type { ProductDetail, ProductSizeProfileItem } from './types';
import { mtoFabricTotalQuantity } from './pricing';

export interface StockState {
  /** calculatedQuantityInStock — floor of orderable units (0 ⇒ none). */
  calculatedQuantityInStock: number;
  /** minimum order quantity (1 for in-stock; MTO MOQ otherwise). */
  minOrderQuantity: number;
  /** true ⇒ Add to Cart enabled; false ⇒ Notify Me. */
  orderable: boolean;
  /** false ⇒ Made-To-Order (drives the MTO badge + EDD strip). */
  orderTypeInStock: boolean;
  /** order type sent to the cart API. */
  orderType: 'IN_STOCK' | 'MADE_TO_ORDER';
}

// ---------------------------------------------------------------------------
// SHARED stock-STATE classifier — the single source of truth for the
// in-stock vs made-to-order vs out-of-stock DECISION across surfaces.
// Both the PLP card (ProductCard) and the PDP (computeStockState) call this so a
// product shows the SAME stock word everywhere. It deliberately depends ONLY on
// the minimal fields BOTH surfaces carry (the catalogue preview list strips the
// made-to-order fabric QUANTITY, but keeps totalQuantity + the MTO-enabled flag),
// so the classification is reproducible from a thin preview row OR a full detail.
//   - totalQuantity > 0                        -> IN_STOCK
//   - else made-to-order enabled (with profile) -> MADE_TO_ORDER
//   - else                                     -> OUT_OF_STOCK
export type StockStatus = 'IN_STOCK' | 'MADE_TO_ORDER' | 'OUT_OF_STOCK';

export interface StockSignals {
  totalQuantity?: number | null;
  madeToOrderProfileEnabled?: boolean | null;
  /** Optional — present on the full PDP detail, absent (null) on preview rows. */
  madeToOrderFabricQty?: number | null;
}

export function deriveStockStatus(p: StockSignals): StockStatus {
  const totalQty = p.totalQuantity ?? 0;
  if (totalQty > 0) return 'IN_STOCK';
  const isMTO = !!p.madeToOrderProfileEnabled;
  const fabricQty = p.madeToOrderFabricQty ?? 0;
  // Made-to-order when the product is MTO-enabled. When the fabric qty IS known
  // (PDP detail) it must be > 0; when it's unknown (preview row strips it) the
  // MTO-enabled flag alone classifies it MADE_TO_ORDER (matches the PDP word).
  if (isMTO && (p.madeToOrderFabricQty == null || fabricQty > 0)) return 'MADE_TO_ORDER';
  return 'OUT_OF_STOCK';
}

// Human label for a stock status, matching the words the PDP/PLP render.
export function stockStatusLabel(s: StockStatus): string {
  return s === 'IN_STOCK' ? 'In Stock' : s === 'MADE_TO_ORDER' ? 'Made To Order' : 'Out of Stock';
}

// Consumed-fabric for the made-to-order profile (defaults to 1 when absent).
function mtoConsumedFabric(product: ProductDetail): number {
  const c = product.madeToOrderProfileEnabled ? product.madeToOrderProfile?.consumedFabric : 0;
  return c && c > 0 ? c : 0;
}

/**
 * Compute the on-load stock state for a finished/fabric product, optionally for a
 * selected size. Ports calculateFinishProductQuantity / prepareItemInstockCalculation:
 *  - in-stock (totalQuantity > 0)            -> orderable IN_STOCK
 *  - made-to-order (mto fabric qty > 0)      -> orderable MADE_TO_ORDER (qty = fabricQty / consumedFabric)
 *  - genuinely empty (both 0)                -> Notify Me
 * When a size is selected on a finished product, its per-size quantity/disabled drives stock.
 */
export function computeStockState(
  product: ProductDetail,
  selectedSize?: ProductSizeProfileItem | null,
): StockState {
  // Fix C (stock parity): live loom-v2 pre-sums the base-fabric + adjustment ledger
  // into the parent totalQuantity; the demo's authenticated backend can leave
  // product.totalQuantity=0 while still exposing quantity (Zoho) + externalQuantity
  // (adjustment ledger). Take the max so a fabric with base stock reads In-Stock like
  // live (khadi 10m), while a finished MTO product (parent quantity=0) stays MTO.
  const totalQty = Math.max(
    product.totalQuantity ?? 0,
    (product.quantity ?? 0) + (product.externalQuantity ?? 0),
  );
  // The MTO fabric stock (fabric picker / finished build source); reconciled separately.
  const mtoFabricQty = mtoFabricTotalQuantity(product.madeToOrderFabric);
  const isMTO = !!product.madeToOrderProfileEnabled && !!product.madeToOrderProfile;

  const minOrderQuantity = totalQty > 0
    ? 1
    : (isMTO ? (product.madeToOrderProfile?.minimumOrderQuantity ?? 1) : 1);

  let calculated = 0;
  let orderTypeInStock = true;

  if (totalQty > 0) {
    // Finished product is directly in stock.
    calculated = Math.floor(totalQty);
    orderTypeInStock = true;
  } else if (selectedSize) {
    // A specific size was chosen on a finished product.
    const sizeInStock = !selectedSize.disabled && selectedSize.quantity > 0;
    if (sizeInStock) {
      calculated = Math.floor(selectedSize.quantity);
      orderTypeInStock = true;
    } else if (mtoFabricQty > 0) {
      // Size has no ready stock (or is disabled) but is buildable from the MTO
      // fabric — port of _calcOnloadItemInStockCalculation (fabricQTY/consumed).
      // consumedFabric can live on the ProductSizeProfileItem (rare) OR on its
      // sizeProfileOption (the shape the backend actually returns, e.g. S = 2m);
      // fall back to the MTO profile consumption, then 1.
      const sizeConsumed = (selectedSize.consumedFabric && selectedSize.consumedFabric > 0)
        ? selectedSize.consumedFabric
        : (selectedSize.sizeProfileOption?.consumedFabric ?? 0);
      const consumed = sizeConsumed > 0 ? sizeConsumed : (mtoConsumedFabric(product) || 1);
      calculated = Math.floor(mtoFabricQty / consumed);
      orderTypeInStock = false;
    } else {
      calculated = 0;
    }
  } else if (mtoFabricQty > 0) {
    // Made-to-order: buildable from the base fabric stock.
    const consumed = mtoConsumedFabric(product) || 1;
    calculated = Math.floor(mtoFabricQty / consumed);
    orderTypeInStock = false;
  } else {
    calculated = 0;
  }

  // MTO fallback: nothing in stock but the product is made-to-order ⇒ still orderable.
  if (calculated <= 0 && isMTO && mtoFabricQty > 0) {
    const consumed = mtoConsumedFabric(product) || 1;
    calculated = Math.floor(mtoFabricQty / consumed);
    orderTypeInStock = false;
  }

  const orderable = calculated >= minOrderQuantity && calculated > 0;

  return {
    calculatedQuantityInStock: calculated,
    minOrderQuantity,
    orderable,
    orderTypeInStock,
    orderType: orderTypeInStock ? 'IN_STOCK' : 'MADE_TO_ORDER',
  };
}
