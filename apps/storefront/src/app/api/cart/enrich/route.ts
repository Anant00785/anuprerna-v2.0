import { NextResponse } from 'next/server';
import { getFabricProducts, getFinishedProducts } from '@/components/catalogue/loom';
import { getCachedProductById } from '@/components/product/loom';
import type { CatalogueProduct } from '@/components/catalogue/types';
import type { ProductDetail, SizeProfileOptionItem } from '@/components/product/types';
import { effectiveOrderProfile } from '@/components/product/order-profile';
import { computeStockState } from '@/components/product/stock';

// ---------------------------------------------------------------------------
// BFF: POST /api/cart/enrich
//
// The logged-in cart (/get/cart-item/list) is THIN — each line carries only
// ids + price/qty, NO product name / image / customization labels. The guest
// cart stores those display fields locally; the account cart cannot. This
// read-only route resolves each thin line to its display bundle so the checkout
// UI shows the SAME name + image + variant/customization summary a guest sees.
//
// Resolution reuses the SAME server-cached catalogue (getFabricProducts /
// getFinishedProducts — 1h in-process cache, keyed by recordId, the exact id
// the cart stores as fabricProductId/finishedProductId) and, ONLY when a line
// carries a finish/size/fabric/custom-size selection, the cached PDP detail
// (getCachedProduct) to resolve the finish/size/fabric option LABELS + SKUs +
// add-on prices. No writes, no order/payment calls.
//
// PRICE IS NOT CHANGED: the returned product.price is set to the line's own
// price (the add-time agreed price the UI already prices off), so every
// downstream money calc yields byte-identical numbers to the thin cart. The
// priceBreakdown is DISPLAY-ONLY and is derived to SUM to that same total.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

interface ThinItem {
  productGroup?: string;
  fabricProductId?: number;
  finishedProductId?: number;
  /** The line's OWN agreed order type (IN_STOCK | PRE_ORDER | MADE_TO_ORDER) —
   *  drives the MOQ floor for a bulk-committed line (see the resolver below). */
  orderType?: string;
  quantity?: number;
  selectedFinishId?: string | number;
  selectedFabricId?: number;
  selectedSizeOptionId?: number;
  customSize?: Record<string, unknown> | null;
  sku?: string;
  makingCharge?: number;
  price?: number;
  /** Hydrated preview, as our own backend returns it. Legacy Loom sent the id
   *  flat instead, so both shapes are accepted. */
  fabricProductPreview?: { id?: number; product?: { id?: number } } | null;
  finishedProductPreview?: { id?: number; product?: { id?: number } } | null;
}

interface EnrichedProduct {
  /** The PRODUCT's id — what order creation names. Distinct from the preview id. */
  id?: number;
  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  heroImage?: string;
  productGroup?: string;
  material?: string;
  colour?: string;
  gsm?: number;
  width?: string | number;
  madeToOrderProfileEnabled?: boolean;
  totalQuantity?: number;
  // Universal MOQ + pre-order flag (effectiveOrderProfile) so the cart steppers
  // can floor each line at its minimum and flag below-minimum lines.
  minimumOrderQuantity?: number;
  preOrder?: boolean;
}

interface PriceBreakdown {
  base: number;
  finishAddOn: number;
  customSizeAddOn: number;
  fabricConsumptionCost?: number;
  total: number;
}

interface CustomDetails {
  fabricName: string | null;
  fabricSku: string | null;
  finishName: string | null;
  sizeLabel: string | null;
  customSize: string | null;
}

function findInCatalogue(
  list: CatalogueProduct[],
  recordId?: number,
  sku?: string,
): CatalogueProduct | undefined {
  if (recordId != null) {
    const m = list.find((p) => p.recordId === recordId || p.id === recordId);
    if (m) return m;
  }
  if (sku) return list.find((p) => p.sku === sku);
  return undefined;
}

function finishLabel(pd: ProductDetail, finishId?: string | number): string | null {
  if (finishId == null || finishId === '' || Number(finishId) === 0) return null;
  const idn = Number(finishId);
  const it = pd.finishProfile?.finishProfileItemList?.find((f) => f.id === idn);
  return it ? it.label || it.name || null : null;
}

// Selected finish's add-on PRICE (0 when none / not resolvable). Display-only.
function finishPrice(pd: ProductDetail, finishId?: string | number): number {
  if (finishId == null || finishId === '' || Number(finishId) === 0) return 0;
  const idn = Number(finishId);
  const it = pd.finishProfile?.finishProfileItemList?.find((f) => f.id === idn);
  return typeof it?.price === 'number' && it.price > 0 ? it.price : 0;
}

function collectSizeOptions(pd: ProductDetail): SizeProfileOptionItem[] {
  const out: SizeProfileOptionItem[] = [];
  pd.productSizeProfileList?.forEach((r) => r.sizeProfileOption && out.push(r.sizeProfileOption));
  pd.sizeProfile?.sizeProfileOptionList?.forEach((o) => out.push(o));
  pd.productSpecificSizeProfile?.sizeProfileOptionList?.forEach((o) => out.push(o));
  return out;
}

function sizeLabel(pd: ProductDetail, sizeId?: number): string | null {
  if (sizeId == null || sizeId === 0) return null;
  const opt = collectSizeOptions(pd).find((o) => o.id === sizeId);
  return opt ? opt.label || null : null;
}

// Chosen customisation fabric NAME + SKU (the fabricPreview.sku typed on
// FabricProfileItem, present in the backend JSON). Null when no fabric chosen.
function fabricNameSku(
  pd: ProductDetail | null,
  fabricCat: CatalogueProduct[],
  fabricId?: number,
): { name: string; sku: string | null } | null {
  if (fabricId == null || fabricId === 0) return null;
  const fp = pd?.fabricProfile?.fabricProfileItemList?.find(
    (f) => f.fabricPreview?.id === fabricId,
  );
  if (fp?.fabricPreview?.name) {
    return { name: fp.fabricPreview.name, sku: fp.fabricPreview.sku ?? null };
  }
  const m = fabricCat.find((p) => p.recordId === fabricId || p.id === fabricId);
  return m?.name ? { name: m.name, sku: m.sku ?? null } : null;
}

// Custom-size measurement add-on PRICE (0 when none). Display-only.
function customSizeAddOnPrice(pd: ProductDetail, cs?: Record<string, unknown> | null): number {
  if (!cs || typeof cs !== 'object' || Object.keys(cs).length === 0) return 0;
  const p = (pd as { customSizeProfile?: { price?: number } }).customSizeProfile?.price;
  return typeof p === 'number' && p > 0 ? p : 0;
}

function customSizeSummary(cs?: Record<string, unknown> | null): string | null {
  if (!cs || typeof cs !== 'object') return null;
  const entries = Object.entries(cs).filter(
    ([, v]) => v != null && String(v).trim() !== '',
  );
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => k + ': ' + String(v)).join(', ');
}

export async function POST(request: Request) {
  let body: { items?: ThinItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ enriched: [] });
  }
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ enriched: [] });

  // Both catalogues are cached in-process (1h); loading is cheap after warm-up.
  let fabric: CatalogueProduct[] = [];
  let finished: CatalogueProduct[] = [];
  try {
    [fabric, finished] = await Promise.all([getFabricProducts(), getFinishedProducts()]);
  } catch {
    // Catalogue outage -> return nulls; the client keeps the thin lines.
    return NextResponse.json({ enriched: items.map(() => null) });
  }

  const enriched = await Promise.all(
    items.map(async (it): Promise<{
      product: EnrichedProduct;
      customization: string | null;
      fabricSku: string | null;
      priceBreakdown: PriceBreakdown;
      details: CustomDetails;
    } | null> => {
      try {
        const group = (it.productGroup || 'fabric').toLowerCase();
        const isFinished = group === 'finished';
        // The id may arrive FLAT (`fabricProductId`, legacy Loom's shape) or
        // nested under the hydrated preview (`fabricProductPreview.id`, what
        // our own backend returns). Reading only the flat field left every
        // account-cart line unenriched — no name, no image, and no product id
        // for order creation to name.
        const recordId = isFinished
          ? it.finishedProductId ?? it.finishedProductPreview?.id
          : it.fabricProductId ?? it.fabricProductPreview?.id;
        const list = isFinished ? finished : fabric;
        const cat = findInCatalogue(list, recordId, it.sku);

        const hasCustomSize =
          !!it.customSize && typeof it.customSize === 'object' && Object.keys(it.customSize).length > 0;
        // The cart line's OWN agreed order type. A PRE_ORDER / MADE_TO_ORDER line is a
        // committed bulk build whose MOQ floor must come from that commitment (the
        // volume-discount / MTO minimum), NOT from the product's CURRENT shelf stock —
        // incidental stock must never collapse a genuine bulk pre-order's floor to 1.
        const lineOrderType = String(it.orderType || '').toUpperCase();
        const lineIsBulkCommit = lineOrderType === 'PRE_ORDER' || lineOrderType === 'MADE_TO_ORDER';

        // Fetch full detail when a finish/size/fabric/custom-size selection needs
        // its LABEL / SKU / add-on price, OR when the fast catalogue lookup missed
        // (custom/hidden products the preview-list omits) — resolved by RECORD ID.
        const catMto = !!cat?.madeToOrderProfileEnabled;
        const catVolume = (cat?.volumeDiscount ?? 0) > 0 || (cat?.volumeDiscountMinimumOrderQuantity ?? 0) > 0;
        const needsDetail =
          (it.selectedFinishId != null && it.selectedFinishId !== '' && Number(it.selectedFinishId) !== 0) ||
          (it.selectedSizeOptionId != null && it.selectedSizeOptionId !== 0) ||
          (it.selectedFabricId != null && it.selectedFabricId !== 0) ||
          hasCustomSize || catMto || catVolume || lineIsBulkCommit;
        let detail: ProductDetail | null = null;
        let detailWidth: string | number | undefined;
        let detailGsm: number | undefined;
        if ((needsDetail || !cat) && recordId != null) {
          const norm = await getCachedProductById(isFinished ? 'finished' : 'fabric', recordId);
          if (norm) {
            detail = norm.product;
            detailWidth = norm.width;
            detailGsm = norm.gsm;
          }
        }

        if (!cat && !detail) return null;

        // Line total (unchanged from the stored cart): the add-time agreed price.
        const total =
          typeof it.price === 'number' && it.price > 0
            ? it.price
            : typeof it.makingCharge === 'number' && it.makingCharge > 0
              ? it.makingCharge
              : 0;

        const lineCustomized =
          (it.selectedFinishId != null && it.selectedFinishId !== '' && Number(it.selectedFinishId) !== 0) ||
          hasCustomSize;
        // MOQ floor resolution:
        //  - BULK-COMMITTED line (its own orderType is PRE_ORDER / MADE_TO_ORDER): the
        //    floor is the committed volume-discount minimum (smallest tier), falling
        //    back to the made-to-order profile MOQ — derived from the COMMITMENT, never
        //    from current shelf stock (which for a fabric with 1m incidental stock would
        //    otherwise collapse a genuine 25-unit bulk pre-order to a floor of 1). This
        //    mirrors the PDP's displayed "MOQ: from N".
        //  - IN-STOCK line: STOCK-FIRST like the PDP — an in-stock, un-customized line
        //    floors at 1 (bulk tiers are an optional upgrade, not a hard minimum).
        let eop: { orderType: string; moq: number; deliveryFromDays: number | null; deliveryToDays: number | null; preOrder: boolean };
        if (detail && lineIsBulkCommit) {
          const volItems = detail.volumeDiscountProfileEnabled
            ? (detail.volumeDiscountProfile?.volumeDiscountProfileItemList ?? [])
            : [];
          const tierQtys = volItems
            .map((v) => v.minimumOrderQuantity)
            .filter((n): n is number => typeof n === 'number' && n > 0);
          const minTier = tierQtys.length ? Math.min(...tierQtys) : null;
          // Resolve as out-of-ready-stock (the line IS a committed build/pre-order),
          // then prefer the smallest volume tier — the same reconciliation the PDP does.
          const oos = effectiveOrderProfile(detail, { inStock: false, inStockQty: 0, customized: lineCustomized });
          eop = {
            orderType: oos.orderType,
            moq: minTier != null ? minTier : oos.moq,
            deliveryFromDays: oos.deliveryFromDays,
            deliveryToDays: oos.deliveryToDays,
            preOrder: lineOrderType === 'PRE_ORDER' ? true : oos.preOrder,
          };
        } else {
          const ss = detail ? computeStockState(detail) : null;
          const stockQty = ss ? (ss.orderTypeInStock ? ss.calculatedQuantityInStock : 0) : 0;
          eop = detail
            ? effectiveOrderProfile(detail, { inStock: stockQty > 0, inStockQty: stockQty, customized: lineCustomized })
            : { orderType: 'in-stock', moq: 1, deliveryFromDays: null, deliveryToDays: null, preOrder: false };
        }
        const product: EnrichedProduct = {
          // The PRODUCT's own id (not the preview's), which order creation must
          // name — the backend rejects a preview id with "names a product that
          // does not exist". Carried through here because the enriched bundle
          // REPLACES the raw preview on the checkout's cart lines.
          id:
            it.fabricProductPreview?.product?.id ??
            it.finishedProductPreview?.product?.id ??
            (typeof detail?.id === 'number' ? detail.id : undefined),
          name: cat?.name || detail?.name,
          slug: cat?.slug || detail?.slug,
          sku: cat?.sku || detail?.sku || it.sku,
          // DISPLAY PRICING: use the cart line's OWN authoritative unit price
          // (the add-time customized price on the cart record) so line totals
          // match the true cart. makingCharge is 0 for MTO fabric and stale for
          // swatch/finished lines, which had zeroed/wronged the displayed price.
          price: total > 0 ? total : undefined,
          heroImage: cat?.heroImage || detail?.heroImage,
          productGroup: group,
          material: cat?.materials?.[0]?.name || detail?.materials?.[0]?.name,
          colour: cat?.colors?.[0]?.name || detail?.colors?.[0]?.name,
          gsm: detailGsm ?? (cat?.gsm && cat.gsm > 0 ? cat.gsm : undefined),
          width: detailWidth,
          // Order-type signals so the cart can section In Stock / Made to order /
          // Pre Order + show the live MTO badge (thin cart line carries neither).
          madeToOrderProfileEnabled:
            cat?.madeToOrderProfileEnabled ?? (detail as { madeToOrderProfileEnabled?: boolean } | null)?.madeToOrderProfileEnabled,
          totalQuantity:
            (typeof cat?.totalQuantity === 'number' ? cat.totalQuantity : undefined) ??
            (typeof detail?.totalQuantity === 'number' ? detail.totalQuantity : undefined),
          // Swatches are single-piece samples — never inherit the product's MOQ.
          minimumOrderQuantity: group !== 'swatch' && eop.moq > 1 ? eop.moq : undefined,
          preOrder: eop.preOrder || undefined,
        };

        // Resolve customisation labels + add-on prices.
        const fab = fabricNameSku(detail, fabric, it.selectedFabricId);
        const finName = detail ? finishLabel(detail, it.selectedFinishId) : null;
        const szName = detail ? sizeLabel(detail, it.selectedSizeOptionId) : null;
        const cs = customSizeSummary(it.customSize);

        // Build a human customization summary from the resolved labels.
        const parts: string[] = [];
        if (fab) parts.push('Fabric: ' + fab.name + (fab.sku ? ' (SKU ' + fab.sku + ')' : ''));
        if (finName) parts.push('Finish: ' + finName);
        if (szName) parts.push('Size: ' + szName);
        if (cs) parts.push(cs);

        // DISPLAY-ONLY price breakdown that SUMS to the stored line total:
        // base = total - finish add-on - custom-size add-on. The known add-ons
        // are peeled off the stored total so the numbers always reconcile.
        const finishAddOn = detail ? finishPrice(detail, it.selectedFinishId) : 0;
        const customSizeAddOn = detail ? customSizeAddOnPrice(detail, it.customSize) : 0;
        const base = Math.max(0, total - finishAddOn - customSizeAddOn);
        const priceBreakdown: PriceBreakdown = { base, finishAddOn, customSizeAddOn, total };

        const details: CustomDetails = {
          fabricName: fab?.name ?? null,
          fabricSku: fab?.sku ?? null,
          finishName: finName,
          sizeLabel: szName,
          customSize: cs,
        };

        return {
          product,
          customization: parts.length ? parts.join('  ·  ') : null,
          fabricSku: fab?.sku ?? null,
          priceBreakdown,
          details,
        };
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json({ enriched });
}
