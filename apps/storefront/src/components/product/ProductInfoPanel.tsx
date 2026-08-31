'use client';
import { relativizeCmsHtml } from '@/lib/cms-html';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/components/auth/AuthProvider';
import AddToCartButton from './AddToCartButton';
import BulkPriceDialog from './BulkPriceDialog';
import BulkPricingEntry from './BulkPricingEntry';
import PreOrderDialog from './PreOrderDialog';
import LoginModal from '@/components/auth/LoginModal';
import SwatchButton from './SwatchButton';
import SizeSelector from './SizeSelector';
import CustomizationCard, { type SelectedFinish, type SelectedFabric } from './CustomizationCard';
import HowItWorks from './HowItWorks';
import { computeStockState } from './stock';
import { bulkPrice as computeBulkPrice, memberUnitPrice, computeCustomizedUnitPrice, resolveConsumedFabric, defaultFabricUnitPrice } from './pricing';
import type { ProductDetail, ProductSizeProfileItem, RelatedProductSwatch, SizeProfile, VolumeDiscountItem, WholesaleMembershipInfo } from './types';
import Img from '@/components/ui/Img';
import LogisticsBlock from './LogisticsBlock';
import { effectiveOrderProfile, orderTypeSuffix } from './order-profile';
import { estimatedDeliveryString } from './delivery';

interface ProductInfoPanelProps {
  product: ProductDetail;
  recordId: number;
  category: string;
  gsm?: number;
  /** Free-form backend string in practice (e.g. "45 inch", '45" (115 cms)'). */
  width?: number | string;
  addToSwatch?: boolean;
  swatchPercentage?: number;
  hasReviews?: boolean;
  reviewRating?: number;
  reviewCount?: number;
  /** Pre-computed display rating string (single source of truth, shared with the
   *  reviews section so the top rating and the section can never diverge). */
  displayRating?: string;
}

// Slugify a facet value EXACTLY the way the catalogue filter does
// (components/catalogue/filter-sort.ts toSlug) so a ?craft/material/pattern/color
// URL value matches what the PLP filter / BFF expects (verified against the BFF).
function toSlug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Build a PLP filter URL for a clickable product attribute. Fabric attributes
// link to the fabric listing, finished to the finished listing. key is a real
// catalogue facet param (craft | material | pattern | color) that
// parseLiveSearchParams / the BFF actually read. Finished craft links preserve
// the top-level category scope; material/pattern/color browse the whole group.
function filterUrl(
  group: 'fabric' | 'finished',
  key: 'craft' | 'material' | 'pattern' | 'color',
  value: string,
  categoryScope?: string,
): string {
  const parts: string[] = [];
  if (categoryScope) {
    const scopeSlug = toSlug(categoryScope);
    // finished: scope craft to its category. fabric: scope ALL attrs to swatchkit
    // (the main fabric listing excludes swatchkits, so an unscoped link dead-ends).
    if ((group === 'finished' && key === 'craft') || (group === 'fabric' && scopeSlug === 'swatchkit')) {
      parts.push('category=' + encodeURIComponent(scopeSlug));
    }
  }
  parts.push(key + '=' + encodeURIComponent(toSlug(value)));
  return '/products/' + group + '?' + parts.join('&');
}

// Backend width is a free-form string in practice -- '45 inch', '45" (115 cms)',
// '10*10 cm / 4*4 Inch' -- and only sometimes a bare number ('45'). Appending
// " inches" unconditionally (the old behaviour) produces a literal duplicated
// unit like "45 inch inches" whenever the backend string already carries its
// own unit/format. Detect that instead of assuming one shape: a value that is
// PURELY numeric gets " inches" appended (legacy bare-number case); anything
// else (letters, quote marks, parens, asterisks -- i.e. already formatted)
// renders as-is.
function formatWidthValue(width: number | string): string {
  const raw = String(width).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) return raw + ' inches';
  return raw;
}

// --- MOQ derivation (best-practice #7). Reads real Loom data where present;
// returns null when no quantitative MOQ is available (caller shows generic copy).
interface MoqInfo { bulk: string | null; sample: string | null; generic: boolean; minTier: number | null }
function deriveMoq(
  product: ProductDetail,
  volumeItems: VolumeDiscountItem[],
  unit: string,
  hasSwatch: boolean,
): MoqInfo {
  // Bulk MOQ = smallest tier minimumOrderQuantity, else MTO profile MOQ.
  let bulkQty: number | null = null;
  if (volumeItems.length > 0) {
    const qtys = volumeItems
      .map((v) => v.minimumOrderQuantity)
      .filter((n) => typeof n === 'number' && n > 0);
    if (qtys.length) bulkQty = Math.min(...qtys);
  } else if (product.volumeDiscountProfile?.tradePricingRedacted) {
    // The ladder was withheld (caller not entitled to trade pricing) but the
    // MINIMUM is not a price — every buyer needs it before they add to cart, and
    // the task is explicit that it stays stated plainly. The wrapper preserves
    // exactly this number, so the quoted MOQ is unchanged by the gate.
    const q = product.volumeDiscountProfile.minimumOrderQuantity ?? 0;
    if (q > 0) bulkQty = q;
  }
  const mtoMoq = product.madeToOrderProfileEnabled
    ? (product.subCategory?.madeToOrderProfile?.minimumOrderQuantity ?? product.madeToOrderProfile?.minimumOrderQuantity)
    : undefined;
  if (bulkQty == null && mtoMoq && mtoMoq > 0) bulkQty = mtoMoq;

  const isFinished = product.productGroup === 'finished';
  // Sample lane: fabric swatch, or a single B2C piece for finished.
  const sample = hasSwatch
    ? '1 swatch'
    : (isFinished ? '1 pc' : null);

  if (bulkQty != null) {
    return { bulk: bulkQty + ' ' + unit + ' bulk', sample, generic: false, minTier: bulkQty };
  }
  return { bulk: null, sample, generic: true, minTier: null };
}

// External-link arrow used in Material Composition rows.
function ExtLinkIcon() {
  return (
    <svg width='13' height='13' viewBox='0 0 14 14' fill='none' className='opacity-60'>
      <path d='M1.75 12.25V1.75h4.94v.88H2.63v8.75h8.75V7.31h.87v4.94H1.75ZM5.57 9.06l-.61-.63L10.76 2.63H7.57V1.75h4.68v4.68h-.87V3.25L5.57 9.06Z' fill='currentColor' />
    </svg>
  );
}

// Numeric rating: source shows {{rating - 0.2}} | ({{reviewCount}} reviews).
function RatingLine({ rating, count, display: displayProp }: { rating: number; count: number; display?: string }) {
  // Single source of truth: use the page-computed display when provided so the top
  // rating and the reviews section show the SAME number; else fall back to rating-0.2.
  const display = displayProp ?? Math.max(0, rating - 0.2).toFixed(1);
  return (
    <button
      type='button'
      onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
      className='flex items-center gap-2 text-left'
      aria-label='See reviews'
    >
      <div className='flex gap-0.5'>
        {[1, 2, 3, 4, 5].map((n) => (
          <svg key={n} viewBox='0 0 16 16' className='h-4 w-4 fill-amber-400'>
            <path d='M8 1l1.85 3.75L14 5.35l-3 2.92.71 4.13L8 10.4l-3.71 2-0.71-4.13L.5 5.35l4.15-.6z' />
          </svg>
        ))}
      </div>
      <span className='text-sm font-medium text-black'>{display}</span>
      <span className='text-sm text-black/50'>| ({count.toLocaleString('en-IN')} reviews)</span>
    </button>
  );
}

// SKU under title with copy-to-clipboard (port of product-sku.component).
function SkuLine({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type='button'
      onClick={copy}
      className='flex w-max items-center gap-1.5 text-xs text-black/50 hover:text-clay transition-colors'
      aria-label='Copy SKU'
    >
      <span>SKU: <span className='font-medium text-black/70'>{value}</span></span>
      <svg width='13' height='13' viewBox='0 0 14 14' fill='none'>
        <path d='M4.27 5.72a1.46 1.46 0 0 1 1.46-1.46h4.74a1.46 1.46 0 0 1 1.46 1.46v4.74a1.46 1.46 0 0 1-1.46 1.46H5.72a1.46 1.46 0 0 1-1.46-1.46V5.72Z' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M2.63 9.59a1.1 1.1 0 0 1-.55-.95V3.17a1.1 1.1 0 0 1 1.1-1.1h5.47c.41 0 .63.21.82.55' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
      {copied && <span className='text-clay font-medium'>Copied!</span>}
    </button>
  );
}

// Accordion (description / specs / care)
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className='border-b border-sand'>
      <button
        onClick={() => setOpen((v) => !v)}
        className='flex items-center justify-between w-full py-4 text-left text-sm font-medium text-black/80 hover:text-clay transition-colors'
        aria-expanded={open}
      >
        {title}
        <span className='material-symbols-outlined text-bark text-[18px]'>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && <div className='pb-5 text-sm text-black/70 leading-relaxed'>{children}</div>}
    </div>
  );
}

// Colour/variant swatch strip — hidden when <= 1 related product.
function SwatchStrip({ swatches, currentSlug }: { swatches: RelatedProductSwatch[]; currentSlug: string }) {
  if (swatches.length <= 1) return null;
  return (
    <div className='flex flex-col gap-2'>
      <p className='text-xs uppercase tracking-widest text-bark'>
        {swatches.length} Colour{swatches.length !== 1 ? 's' : ''} Available
      </p>
      <div className='flex flex-wrap gap-2'>
        {swatches.map((s) => (
          <Link
            key={s.id}
            href={`/product/fabric-product/${s.slug}`}
            aria-label={s.name}
            className={
              'relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ' +
              (s.slug === currentSlug ? 'border-clay' : 'border-transparent hover:border-bark/50')
            }
          >
            <Img src={s.heroImage} alt={s.name} fill sizes='48px' className='object-cover' />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProductInfoPanel({
  product,
  recordId,
  category,
  gsm,
  width,
  addToSwatch = false,
  swatchPercentage = 0,
  hasReviews = false,
  reviewRating = 0,
  reviewCount = 0,
  displayRating,
}: ProductInfoPanelProps) {
  const { formatCode } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  // Bulk DATA (pre-order/volume tiers/MOQ box) is UNIVERSAL (guest/b2c/b2b),
  // matching live anuprerna.com — buyer mode never gates or changes it.
  const [cartRefresh, setCartRefresh] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [preOrderOpen, setPreOrderOpen] = useState(false);
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(false);
  const [membership, setMembership] = useState<WholesaleMembershipInfo | null>(null);
  // Finished-product size selection ('custom' => custom-size button chosen).
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  // The bulk entry point's sign-in (guest state). Separate from notifyOpen so the
  // two never share a modal instance and one cannot close the other.
  const [bulkSignInOpen, setBulkSignInOpen] = useState(false);
  const [notifyDone, setNotifyDone] = useState(false);
  // Customization (made-to-order): lifted finish/fabric selection so the choice
  // flows into the displayed price + the cart. The finish price is a per-unit
  // add-on (base + finish.price); the fabric id is reported for the cart body.
  const [selectedFinish, setSelectedFinish] = useState<SelectedFinish | null>(null);
  // Fabric picker loads UNSELECTED (matches live: the shopper clicks a tile to
  // choose). No visual pre-selection is needed for correctness -- both the price
  // math (defaultFabricUnitPrice) and the cart body (cartSelectedFabricId ->
  // defaultFabricId) already fall back to product.madeToOrderFabric when nothing
  // is picked, so leaving this null is byte-identical on price + cart.
  const [selectedFabric, setSelectedFabric] = useState<SelectedFabric | null>(null);
  // Lifted custom-size measurement object (keyed by field label), null until applied.
  const [customSizeValues, setCustomSizeValues] = useState<Record<string, string> | null>(null);
  // FABRIC Section-1 "Custom Organic Dye" (sizeProfile) selected option id -> cart's
  // selectedSizeOptionId. null => the default (first) option. (Finished uses SizeSelector.)
  const [fabricSizeOptionId, setFabricSizeOptionId] = useState<number | null>(null);

  const handleAdded = useCallback(() => {
    setCartRefresh((n) => n + 1);
    try { window.dispatchEvent(new CustomEvent('anuprerna:cart-updated')); } catch {}
  }, []);

  // Fetch wholesale membership when logged in (port of customerWholesaleProgramInfo).
  useEffect(() => {
    let cancelled = false;
    if (!user) { setMembership(null); return; }
    fetch('/api/profile/loyalty', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const info = (d.loyaltyProgramInfo ?? d.loyaltyInfo ?? d.entity ?? d) as { active?: boolean; percentileDiscount?: number };
        if (typeof info?.active === 'boolean') {
          setMembership({ active: info.active, percentileDiscount: info.percentileDiscount ?? 0 });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);


  const isMember = !!membership?.active;
  const loyaltyDiscount = isMember ? membership!.percentileDiscount : 0;

  const productGroup: 'fabric' | 'finished' =
    product.productGroup === 'finished' ? 'finished' : 'fabric';

  const unit = (product.unit || 'unit').toLowerCase();
  // Title-cased singular unit for the live-style "Only X Meter In Stock!" line.
  const unitTitle = unit.charAt(0).toUpperCase() + unit.slice(1);

  // --- Finished-product size variants (S/M/L/XL) ---
  const productSizeProfile: ProductSizeProfileItem[] = product.productSizeProfileList ?? [];
  const hasSizes = productGroup === 'finished'
    && !!product.sizeProfileEnabled
    && !!product.sizeProfile
    && productSizeProfile.length > 0;
  // Profile used by the Size Guide dialog (product-specific preferred).
  const guideProfile: SizeProfile | undefined = product.productSpecificSizeProfileEnabled
    ? (product.productSpecificSizeProfile ?? product.sizeProfile)
    : product.sizeProfile;

  // Default-select the first orderable size (port of selectDefaultSize): SORTED by
  // sortOrder first, so with no in-stock size the fallback is the smallest size (S),
  // matching live -- its consumedFabric (2m) drives the base fabric-consumption cost.
  const defaultSize = useMemo(() => {
    if (!hasSizes) return null;
    const sorted = [...productSizeProfile].sort(
      (a, b) => (a.sizeProfileOption.sortOrder ?? 0) - (b.sizeProfileOption.sortOrder ?? 0),
    );
    return sorted.find((sz) => !sz.disabled && sz.quantity > 0) ?? sorted[0] ?? null;
  }, [hasSizes, productSizeProfile]);

  const effectiveSizeLabel = selectedSizeLabel ?? defaultSize?.sizeProfileOption.label ?? null;
  const selectedSizeItem = effectiveSizeLabel && effectiveSizeLabel !== 'custom'
    ? (productSizeProfile.find((sz) => sz.sizeProfileOption.label === effectiveSizeLabel) ?? null)
    : null;

  // --- Stock state (faithful port; MTO-aware so made-to-order products sell) ---
  const stock = useMemo(
    () => computeStockState(product, hasSizes ? selectedSizeItem : null),
    [product, hasSizes, selectedSizeItem],
  );
  const orderable = stock.orderable;
  const inStock = stock.orderTypeInStock && orderable;

  // --- Customization-aware unit price (faithful port of reCalculatePrice) ---
  // Made-to-order products fold the fabric-consumption cost into the displayed base:
  //   fabricPrice = fabricUnitPrice * consumedFabric   (394 * 2 = 788 for the skirt)
  //   finished unit = product.price + fabricPrice + finishes + customSize  => 3,430
  // Non-MTO products keep their plain product.price (no fabric term), unchanged.
  const isMTO = !!product.madeToOrderProfileEnabled;
  const isCustomSize = effectiveSizeLabel === 'custom';
  // consumedFabric = selected size's (custom clears the size -> MTO profile's), else 1.
  const consumedFabric = resolveConsumedFabric(
    product,
    isCustomSize ? null : (selectedSizeItem?.sizeProfileOption ?? null),
  );
  const finishPrice = selectedFinish?.price ?? 0;
  // Custom-size / Custom-Pantone add-on applies whenever a custom measurement set has
  // been APPLIED (finished measurements OR a fabric Custom Pantone), independent of the
  // size selector -- a fabric dye product has no size selector but can pick Custom Pantone.
  const hasCustomMeasurements = !!customSizeValues && Object.keys(customSizeValues).length > 0;
  const customSizePrice =
    hasCustomMeasurements && product.customSizeProfileEnabled && product.customSizeProfile
      ? (product.customSizeProfile.price ?? 0)
      : 0;
  const fabricUnit = defaultFabricUnitPrice(product, selectedFabric?.price ?? null);
  const priced = isMTO
    ? computeCustomizedUnitPrice(product, { fabricUnitPrice: fabricUnit, consumedFabric, finishPrice, customSizePrice })
    : { unitPrice: (product.price ?? 0) + finishPrice, makingCharge: product.price ?? 0, fabricPrice: 0 };
  const basePrice = product.price ?? 0;
  const unitBasePrice = priced.unitPrice;
  const cartMakingCharge = priced.makingCharge;
  const cartUnitPrice = unitBasePrice;
  const fabricConsumptionCost = priced.fabricPrice;
  // Default fabric id the cart reports when none is explicitly picked (gap #9):
  // live sends madeToOrderFabric.id for a fabric-customizable MTO product.
  const defaultFabricId = product.fabricProfileEnabled && product.madeToOrderFabric
    ? product.madeToOrderFabric.id
    : undefined;
  const cartSelectedFabricId = selectedFabric?.id ?? defaultFabricId;
  // Size option id sent to the cart (live's selectedSizeOptionId).
  //  - finished: the selected S/M/L/XL option (custom size forces it off).
  //  - fabric  : the Section-1 "Custom Organic Dye" option; a Custom-Dye (Pantone)
  //              selection forces it off, mirroring the finished custom-size rule.
  const isFabricGroup = productGroup === 'fabric';
  const fabricSizeProfileEnabled =
    isFabricGroup && !!product.sizeProfileEnabled && (product.sizeProfile?.sizeProfileOptionList?.length ?? 0) > 0;
  const defaultFabricSizeOptionId = fabricSizeProfileEnabled
    ? product.sizeProfile!.sizeProfileOptionList[0].id
    : undefined;
  const cartSelectedSizeOptionId = isFabricGroup
    ? (hasCustomMeasurements ? undefined : (fabricSizeOptionId ?? defaultFabricSizeOptionId))
    : (isCustomSize ? undefined : (selectedSizeItem?.sizeProfileOption?.id ?? undefined));
  const cartCustomSize = customSizePrice > 0 ? customSizeValues ?? undefined : undefined;
  const cartSelectedFinishId = selectedFinish?.id ?? '';

  // Made-To-Order badge when madeToOrder & not directly in-stock.
  const isMadeToOrder = !!product.madeToOrderProfileEnabled && !stock.orderTypeInStock;

  // Headline price: member discount applies to the FULL customization-aware unit
  // price (live calculateDiscounts base branch), shown struck through above it.
  const memberPrice = isMember && loyaltyDiscount ? memberUnitPrice(unitBasePrice, loyaltyDiscount) : null;
  const displayUnitPrice = memberPrice ?? unitBasePrice;
  const displayStrikePrice = unitBasePrice;

  // ══ TRADE PRICING — fetched, never baked in ════════════════════════════════
  //
  // This page is ISR-cached: one payload, generated with no session, served to
  // everybody. The volume-tier ladder therefore CANNOT travel in it — anything
  // in that payload is in every buyer's browser whether or not the page draws
  // it. The wrapper strips the ladder on the way out and this component asks for
  // it separately, per request, with the caller's session; the wrapper answers
  // only for a signed-in account whose buyer type is business.
  //
  // So the ladder below is empty for a guest and for a retail account, and NOT
  // because we chose not to render it. There is nothing to render.
  const bakedItems: VolumeDiscountItem[] = product.volumeDiscountProfileEnabled
    ? (product.volumeDiscountProfile?.volumeDiscountProfileItemList ?? [])
    : [];
  const [tradeItems, setTradeItems] = useState<VolumeDiscountItem[] | null>(null);
  // Bumped when the buyer switches to a business account from the bulk entry
  // point below, so the ladder is re-asked for and appears on THIS page without
  // a reload. (The auth refresh alone would also re-run the effect, but this
  // makes the causal link explicit rather than relying on object identity.)
  const [tradeNonce, setTradeNonce] = useState(0);
  const tradeRedacted = product.volumeDiscountProfile?.tradePricingRedacted === true;
  useEffect(() => {
    // Only worth asking when the ladder was actually withheld AND somebody is
    // signed in. A guest gets the same soft denial, so skipping the call for
    // them costs nothing and saves a request on every product view.
    if (!tradeRedacted || !user || !product.volumeDiscountProfileEnabled) {
      setTradeItems(null);
      return;
    }
    let alive = true;
    const group = product.productGroup === 'finished' ? 'finished' : 'fabric';
    fetch('/api/product/trade-pricing?group=' + group + '&slug=' + encodeURIComponent(product.slug), {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list = d?.success === true
          ? (d?.volumeDiscountProfile?.volumeDiscountProfileItemList ?? [])
          : [];
        setTradeItems(Array.isArray(list) ? (list as VolumeDiscountItem[]) : []);
      })
      .catch(() => { if (alive) setTradeItems([]); });
    return () => { alive = false; };
  }, [tradeRedacted, user, tradeNonce, product.slug, product.productGroup, product.volumeDiscountProfileEnabled]);

  const volumeItems: VolumeDiscountItem[] =
    bakedItems.length > 0 ? bakedItems : (tradeItems ?? []);
  const disclaimer = product.volumeDiscountProfile?.disclaimer;
  const profileName = (product.volumeDiscountProfile as { profileName?: string } | undefined)?.profileName;

  const vdExtras = useMemo(
    () => (isMTO ? { fabricUnitPrice: fabricUnit, consumedFabric, finishPrice, customSizePrice } : undefined),
    [isMTO, fabricUnit, consumedFabric, finishPrice, customSizePrice],
  );
  const bulkUnitPrice = useMemo(
    () => computeBulkPrice(product, volumeItems, loyaltyDiscount, vdExtras),
    [product, volumeItems, loyaltyDiscount, vdExtras],
  );

  const swatchPrice = swatchPercentage > 0 ? (swatchPercentage / 100) * basePrice : 0;
  const hasSwatch = !!addToSwatch && swatchPrice > 0;

  // MOQ (best-practice #7). Real Loom data where available.
  const moq = deriveMoq(product, volumeItems, unit, hasSwatch);

  // --- Universal effective order profile (MOQ + lead time), shown OPENLY as a
  // spec regardless of buyer mode (guest/b2c/b2b), mirroring Fabriclore. ---
  // Real ready-stock quantity (0 when only buildable-to-order, not on the shelf).
  const inStockQty = stock.orderTypeInStock ? stock.calculatedQuantityInStock : 0;
  // A custom dye / finish / Pantone selection (NOT the default fabric, NOT the
  // default organic-dye option) turns an otherwise in-stock made-to-order-capable
  // fabric into a made-to-order build.
  const isCustomChosen =
    !!selectedFinish ||
    hasCustomMeasurements ||
    (fabricSizeProfileEnabled && fabricSizeOptionId != null && fabricSizeOptionId !== defaultFabricSizeOptionId);
  // STOCK-FIRST: an in-stock, un-customized MTO-capable fabric is plain in-stock
  // retail (moq 1); a dye/finish selection or empty shelf flips it to made-to-order.
  const orderProfile = effectiveOrderProfile(product, {
    inStock,
    inStockQty,
    customized: isCustomChosen,
  });
  // MOQ shown + enforced must AGREE with the "MOQ: from N" box (deriveMoq), which
  // for an out-of-stock made-to-order product prefers the smallest volume-discount
  // tier over the raw MTO-profile MOQ. Floor the Add-to-Cart default at the same
  // value so the quoted minimum and the qty stepper can never disagree. Math.max
  // never lowers a legitimate order-profile floor (e.g. a pre-order tier min).
  const moqValue = orderProfile.orderType !== 'in-stock' && moq.minTier != null
    ? Math.max(orderProfile.moq, moq.minTier)
    : orderProfile.moq;
  // Optional bulk / pre-order entry points for IN-STOCK items — shown openly as
  // info (NOT a hard floor): retail can still buy any qty off the shelf.
  // Quantity FACTS, kept for everybody: the wrapper preserves both numbers in
  // the redacted profile, so these read the same with or without entitlement.
  const redactedProfile = tradeRedacted ? product.volumeDiscountProfile : undefined;
  const bulkFrom = volumeItems.length
    ? Math.min(...volumeItems.map((t) => t.minimumOrderQuantity).filter((n) => typeof n === 'number' && n > 0))
    : ((redactedProfile?.minimumOrderQuantity ?? 0) > 0 ? redactedProfile!.minimumOrderQuantity! : null);
  const preOrderTiersList = volumeItems.filter((t) => t.preOrder && (t.minimumOrderQuantity ?? 0) > 0);
  const preOrderFrom = preOrderTiersList.length
    ? Math.min(...preOrderTiersList.map((t) => t.minimumOrderQuantity))
    : ((redactedProfile?.preOrderMinimumOrderQuantity ?? 0) > 0
        ? redactedProfile!.preOrderMinimumOrderQuantity!
        : null);
  const showOptionalMinInfo = inStock && moqValue <= 1 && (bulkFrom != null || preOrderFrom != null);
  const moqSuffix = orderTypeSuffix(orderProfile.orderType);
  const unitPlural = (n: number) => unit + (n === 1 ? '' : 's');

  // ══ THE BULK ENTRY POINT — ALWAYS VISIBLE, NEVER REVEALING ══════════════════
  //
  // The gate above removes the ladder from the payload for a guest and for a
  // retail account, and that stays exactly as it is. What must NOT disappear
  // with it is the ENTRY POINT: a guest looking at a fabric we sell by the
  // hundred metres has to be able to learn that bulk pricing exists, or the
  // highest-value moment on the page is silently deleted. So this control is on
  // the page in all three states; only its words and its action change.
  //
  // Existence is read from the two BOOLEANS the redacted payload carries, never
  // inferred from a number that should not have been sent. For an entitled
  // caller the fetched ladder itself is the proof.
  const hasTradePricing =
    product.volumeDiscountProfileEnabled === true &&
    (volumeItems.length > 0 ||
      redactedProfile?.hasTradePricing === true ||
      redactedProfile?.hasBulkPreOrder === true);
  const accountIsBusiness = (user as { buyerType?: unknown } | null)?.buyerType === 'b2b';
  // 'loading' is a real state, not a gap: the control is already drawn, inert,
  // saying nothing it would have to take back once the session resolves.
  const bulkState: 'loading' | 'guest' | 'retail' | 'business' =
    authLoading ? 'loading' : !user ? 'guest' : accountIsBusiness ? 'business' : 'retail';
  const bulkPreOrderPath =
    volumeItems.some((t) => t.preOrder) || redactedProfile?.hasBulkPreOrder === true;
  // Confirm the lead time before adding whenever the item is not plain in-stock
  // retail (made-to-order / pre-order / a chosen custom dye).
  const requireLeadTimeConfirm = orderProfile.orderType !== 'in-stock' || isCustomChosen;
  // Lead window (days): prefer the profile's real days, else per-type fallback.
  let leadFromDays = orderProfile.deliveryFromDays;
  let leadToDays = orderProfile.deliveryToDays;
  if (leadToDays == null) {
    if (orderProfile.orderType === 'pre-order') { leadFromDays = 42; leadToDays = 56; }
    else if (orderProfile.orderType === 'made-to-order') { leadFromDays = 25; leadToDays = 35; }
    else if (isCustomChosen) { leadFromDays = 7; leadToDays = 10; }
  }
  const leadDeliveryDate = estimatedDeliveryString(requireLeadTimeConfirm ? (leadToDays ?? 30) : 3);
  const leadTimeLabel =
    orderProfile.orderType === 'pre-order' ? 'Pre-Order'
    : orderProfile.orderType === 'made-to-order' ? 'Made to Order'
    : 'Custom Dyed';

  // Material / pattern values from interface arrays (NamedRef[]).
  const materials = product.materials ?? [];
  const patterns = product.patterns ?? [];
  const colors = product.colors ?? [];

  // Subcategory (Product/Craft) listing URL. The catalogue filter reads a
  // `craft` param (parseLiveSearchParams / the BFF), NOT the live site's
  // `<segment>=<sub>` shape — the old shape returned the whole unfiltered
  // catalogue. Finished keeps its top-level category scope.
  const subCategoryUrl = product.subCategory?.name
    ? filterUrl(productGroup, 'craft', product.subCategory.name, product.category?.name)
    : '#';

  const specs: { label: string; value: string }[] = [
    product.category?.name ? { label: 'Category', value: product.category.name } : null,
    product.segment?.name ? { label: 'Segment', value: product.segment.name } : null,
    product.subCategory?.name ? { label: 'Sub-category', value: product.subCategory.name } : null,
    product.colors?.length ? { label: 'Colour', value: product.colors.map((c) => c.name).join(', ') } : null,
    gsm != null ? { label: 'GSM', value: String(gsm) } : null,
    width != null ? { label: 'Width', value: formatWidthValue(width) } : null,
    product.unit ? { label: 'Unit', value: product.unit } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className='flex flex-col gap-4'>
      {/* Badge row: Made-To-Order + special-status pill */}
      {(isMadeToOrder || product.specialStatus?.name) && (
        <div className='flex flex-wrap items-center gap-1.5'>
          {isMadeToOrder && (
            <span className='inline-flex items-center gap-1 w-max rounded-full bg-[#FBF3E4] px-3 py-1 text-[11px] font-medium text-[#7D5A20]'>
              Made To Order
              <span className='material-symbols-outlined text-[12px]'>info</span>
            </span>
          )}
          {product.specialStatus?.name && (
            <span className='w-max rounded-full bg-sand px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-clay'>
              {product.specialStatus.name}
            </span>
          )}
        </div>
      )}

      {/* Product name */}
      <h1 className='text-2xl sm:text-3xl font-medium text-black leading-snug'>
        {product.name}
      </h1>

      {/* SKU under title + copy */}
      {product.sku && <SkuLine value={product.sku} />}

      {/* Numeric rating — only when REAL Loom review stats exist; never invented */}
      {hasReviews && (
        <RatingLine rating={reviewRating} count={reviewCount} display={displayRating} />
      )}

      {/* Price block (member-aware) + View Price Details */}
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center flex-wrap gap-2'>
          {memberPrice != null ? (
            <span className='flex items-baseline gap-2'>
              <span className='text-sm text-[#898E9A] line-through'>{formatCode(displayStrikePrice)}</span>
              <span className='text-2xl font-semibold text-clay'>{formatCode(displayUnitPrice)}</span>
            </span>
          ) : (
            <span className='text-2xl font-semibold text-clay'>{formatCode(displayUnitPrice)}</span>
          )}
          <span className='text-sm text-black/50'>/ {unit}</span>

          {/* Wholesale member crown OR Save-% link */}
          {isMember ? (
            <span className='inline-flex items-center gap-1 text-clay' title='Wholesale program member price'>
              <span className='material-symbols-outlined text-[16px]'>crown</span>
              <span className='text-[10px] font-medium'>Member</span>
            </span>
          ) : membership && membership.percentileDiscount > 0 ? (
            <Link href='/profile/wholesale-program' className='inline-flex items-center gap-1 text-[10px] text-bark hover:text-clay'>
              <span className='material-symbols-outlined text-[10px]'>info</span>
              Save <span className='font-bold'>{membership.percentileDiscount}%</span> as a member
            </Link>
          ) : null}
        </div>

        {/* View Price Details popover (desktop) */}
        <div className='relative hidden md:block'>
          <button
            type='button'
            onClick={() => setPriceDetailsOpen((v) => !v)}
            onMouseEnter={() => setPriceDetailsOpen(true)}
            className='whitespace-nowrap text-[12px] font-semibold text-[#6B7280] underline'
          >
            View Price Details
          </button>
          {priceDetailsOpen && (
            <div
              className='absolute right-0 top-6 z-10 w-[250px] rounded bg-gray-100 p-3 text-xs shadow-lg'
              onMouseLeave={() => setPriceDetailsOpen(false)}
            >
              <div className='mb-1 text-sm font-semibold'>Price Summary</div>
              <div className='flex justify-between'>
                <span>{productGroup === 'finished' ? 'Base Product Cost:' : 'Base Fabric Cost:'}</span>
                <span>{formatCode(basePrice)}</span>
              </div>
              {isMTO && fabricConsumptionCost > 0 && (
                <>
                  <div className='flex justify-between text-black/60'>
                    <span>Fabric Consumption:</span>
                    <span>{consumedFabric} meter(s)</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Fabric Cost:</span>
                    <span>+{formatCode(fabricConsumptionCost)}</span>
                  </div>
                </>
              )}
              {finishPrice > 0 && selectedFinish && (
                <div className='flex justify-between'>
                  <span className='capitalize'>{selectedFinish.label.toLowerCase()}:</span>
                  <span>+{formatCode(finishPrice)}</span>
                </div>
              )}
              {customSizePrice > 0 && (
                <div className='flex justify-between'>
                  <span>{product.customSizeProfile?.profileName?.trim() || 'Custom Size'}:</span>
                  <span>+{formatCode(customSizePrice)}</span>
                </div>
              )}
              {memberPrice != null && (
                <div className='flex justify-between text-clay'>
                  <span>Member Discount ({loyaltyDiscount}%):</span>
                  <span>-{formatCode(unitBasePrice - memberPrice)}</span>
                </div>
              )}
              <div className='mt-1 flex justify-between border-t border-gray-300 pt-1'>
                <span className='font-semibold'>Total:</span>
                <span>{formatCode(displayUnitPrice)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimum order -- shown OPENLY as a spec (universal: guest/b2c/b2b). */}
      {moqValue > 1 && (
        <div className='flex items-center gap-1.5 text-sm text-black/70'>
          <span className='material-symbols-outlined text-[16px] text-clay'>inventory_2</span>
          <span>
            <span className='font-semibold text-black'>Minimum order:</span>{' '}
            {moqValue} {unitPlural(moqValue)}
            {moqSuffix ? <span className='text-black/50'> ({moqSuffix})</span> : null}
          </span>
        </div>
      )}

      {/* In-stock retail: order any quantity; bulk / pre-order entry points shown
          OPENLY (universal) as OPTIONAL upgrades — not a hard minimum. */}
      {showOptionalMinInfo && (
        <div className='flex items-start gap-1.5 text-sm text-black/70'>
          <span className='material-symbols-outlined text-[16px] text-clay'>inventory_2</span>
          <span>
            <span className='font-semibold text-black'>In stock:</span> order any quantity off the shelf
            {bulkFrom != null ? <span className='text-black/50'> · bulk pricing from {bulkFrom} {unitPlural(bulkFrom)}</span> : null}
            {preOrderFrom != null ? <span className='text-black/50'> · pre-order from {preOrderFrom} {unitPlural(preOrderFrom)}</span> : null}
          </span>
        </div>
      )}

      {/* ONE PERSISTENT BULK CONTROL, three states. It is present for every
          caller on a product that has trade pricing; what changes is what it
          says and what it does. The tier VALUES appear in exactly one of the
          three — and only because the server sent them. */}
      {hasTradePricing && (
        <div data-testid='bulk-entry' data-bulk-state={bulkState} className='flex flex-col gap-1'>
          {bulkState === 'business' ? (
            <button
              type='button'
              onClick={() => setBulkOpen(true)}
              data-testid='bulk-entry-prices'
              className='flex w-max items-center gap-1 rounded-lg border border-clay px-3 py-2 text-sm font-medium text-clay hover:bg-sand transition-colors'
            >
              {bulkUnitPrice != null
                ? 'Bulk Price @ ' + formatCode(bulkUnitPrice) + ' / ' + unit
                : 'See bulk prices'}
              <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
            </button>
          ) : (
            <BulkPricingEntry
              state={bulkState}
              unit={unit}
              minQty={bulkFrom}
              preOrder={bulkPreOrderPath}
              onSignIn={() => setBulkSignInOpen(true)}
              onSwitched={() => setTradeNonce((n) => n + 1)}
            />
          )}
        </div>
      )}

      {/* See How it Works — tutorial video (finished products) */}
      {/* Stock status — MTO-aware. In-stock shows the REAL shelf quantity like live
          ("Only 10 Meter In Stock!"); the number is the COMPUTED stock, not
          product.totalQuantity (loom-v2 leaves that 0 while stock lives in the
          quantity + adjustment ledger). */}
      <div className='flex items-center gap-2'>
        {inStock ? (
          <span className={'text-sm font-medium ' + (inStockQty > 0 && inStockQty <= 10 ? 'text-red-600' : 'text-green-700')}>
            {inStockQty > 0 && inStockQty <= 10
              ? `Only ${inStockQty} ${unitTitle} In Stock!`
              : inStockQty > 0
                ? `In stock — ${inStockQty} ${unitPlural(inStockQty)} available`
                : 'In stock'}
          </span>
        ) : isMadeToOrder && orderable ? (
          <span className='text-sm font-medium text-[#7D5A20]'>Available — Made To Order</span>
        ) : (
          <span className='text-sm font-medium text-gray-500'>Out of stock</span>
        )}
      </div>

      {/* Size selector (S/M/L/XL) — finished products with size variants */}
      {hasSizes && guideProfile && (
        <SizeSelector
          product={product}
          productSizeProfile={productSizeProfile}
          sizeProfile={guideProfile}
          selectedLabel={effectiveSizeLabel}
          onSelect={(size, custom) => setSelectedSizeLabel(custom ? 'custom' : (size?.sizeProfileOption.label ?? null))}
          onCustomSizeChange={setCustomSizeValues}
        />
      )}

      {/* Colour swatches */}
      <SwatchStrip swatches={product.relatedProductList ?? []} currentSlug={product.slug} />

      {/* See How it Works — tutorial video. Live shows this on BOTH fabric and
          finished PDPs; render for the current group (finished was already shown,
          fabric is the parity gap). */}
      <HowItWorks productGroup={productGroup} />

      {/* Customization Available — ABOVE the buy-box (Fix A), matching live's placement.
          Fabric: two sections (Custom Organic Dye + Custom Natural Vegetable Dye). */}
      {product.madeToOrderProfileEnabled && (
        <CustomizationCard
          product={product}
          selectedFinish={selectedFinish}
          onFinishChange={setSelectedFinish}
          selectedFabric={selectedFabric}
          onFabricChange={setSelectedFabric}
          customSizeValues={customSizeValues}
          onCustomSizeChange={setCustomSizeValues}
          selectedSizeOptionId={fabricSizeOptionId}
          onSizeOptionChange={setFabricSizeOptionId}
        />
      )}

      {/* MOQ + lead time + returns -- universal (guest/b2c/b2b), matching live. */}
      <div className='flex flex-col gap-2 rounded-xl border border-sand bg-cream px-4 py-3 text-sm'>
        <div className='flex items-start gap-2'>
          <span className='material-symbols-outlined text-[18px] text-clay'>inventory_2</span>
          {/* Order-model-aware: in-stock = retail (NO hard MOQ; bulk is OPTIONAL,
              framed "bulk discounts from {min}"); made-to-order = B2B hard MOQ
              using the MINIMUM tier (~25m), never the top 1000m slab. */}
          {inStock ? (
            <span className='text-black/70'>
              <span className='font-semibold text-black'>In stock:</span>{' '}
              order any quantity off the shelf
              {moq.minTier != null ? (
                <span className='text-black/50'>
                  {' '}· bulk discounts from {moq.minTier} {unit}
                </span>
              ) : null}
            </span>
          ) : (
            <span className='text-black/70'>
              <span className='font-semibold text-black'>MOQ:</span>{' '}
              {moq.generic ? (
                'Low MOQ — bulk & sample available'
              ) : (
                <span>
                  from {moq.minTier} {unit}
                  {moq.sample ? <span className='text-black/50'> · {moq.sample}</span> : null}
                </span>
              )}
            </span>
          )}
        </div>
        <div className='flex items-start gap-2'>
          <span className='material-symbols-outlined text-[18px] text-clay'>assignment_return</span>
          <span className='text-black/60'>
            Custom & bulk orders follow our{' '}
            <a href='/content/policies/return-exchange-policy/170896' target='_blank' rel='noopener noreferrer' className='text-clay underline underline-offset-2'>custom-order policy</a>
            {hasSwatch ? '; swatches are non-returnable.' : '.'}
          </span>
        </div>
      </div>

      {/* Pre-order + Add to cart */}
      <div id='buy-box' className='flex flex-col gap-3 scroll-mt-24'>
        {orderable ? (
          <AddToCartButton
            // Remount when the effective order MODE flips (in-stock <-> made-to-order
            // via a dye selection or stock) so the qty default + floor + lead-time flag
            // reset live: in-stock => qty 1, no modal; made-to-order => qty MOQ + modal.
            key={`atc-${moqValue > 1 ? moqValue : 1}-${requireLeadTimeConfirm ? 'lead' : 'now'}`}
            productRecordId={recordId}
            productGroup={productGroup}
            orderType={stock.orderType}
            unit={product.unit}
            price={cartUnitPrice}
            makingCharge={cartMakingCharge}
            sku={product.sku ?? ''}
            selectedFinishId={cartSelectedFinishId}
            selectedFabricId={cartSelectedFabricId}
            selectedSizeOptionId={cartSelectedSizeOptionId}
            customSize={cartCustomSize}
            maxStock={stock.calculatedQuantityInStock}
            // Universal MOQ floor (guest/b2c/b2b): made-to-order MOQ or pre-order
            // tier min, resolved by effectiveOrderProfile. In-stock non-MTO => none.
            minMoq={moqValue > 1 ? moqValue : undefined}
            confirmLeadTime={requireLeadTimeConfirm}
            leadTime={{
              label: leadTimeLabel,
              fromDays: leadFromDays,
              toDays: leadToDays,
              deliveryDate: leadDeliveryDate,
              moq: moqValue,
              unit,
              productName: product.name,
            }}
            onAdded={handleAdded}
          />
        ) : (
          <button
            type='button'
            onClick={() => setNotifyOpen(true)}
            className='w-full min-h-[44px] rounded-lg bg-clay py-3.5 text-sm font-medium tracking-wide text-white hover:bg-clayd active:scale-[.98] transition-all'
          >
            Notify Me
          </button>
        )}

        {product.volumeDiscountProfileEnabled && volumeItems.length > 0 && (
          <button
            type='button'
            onClick={() => setPreOrderOpen(true)}
            className='w-full min-h-[44px] rounded-lg border border-clay py-3 text-sm font-medium tracking-wide text-clay hover:bg-sand transition-colors'
          >
            Bulk Pre-Order
          </button>
        )}
      </div>

      {/* Logistics block: delivery date, dispatch timeline, shipping + returns */}
      <LogisticsBlock
          inStock={inStock}
          leadFromDays={requireLeadTimeConfirm ? leadFromDays : undefined}
          leadToDays={requireLeadTimeConfirm ? leadToDays : undefined}
          orderTypeLabel={requireLeadTimeConfirm ? leadTimeLabel : undefined}
        />

      {/* Order a Swatch */}
      {addToSwatch && swatchPrice > 0 && (
        <SwatchButton
          product={product}
          recordId={recordId}
          swatchPrice={swatchPrice}
          onAdded={handleAdded}
        />
      )}

      {/* Material Composition — Product (subcategory) + Material + Pattern, all links */}
      {(product.subCategory?.name || materials.length > 0 || patterns.length > 0 || colors.length > 0 || gsm != null || width != null) && (
        <div className='flex flex-col gap-2.5 rounded-xl border border-sand bg-cream p-4'>
          <h2 className='text-base font-medium text-black'>Material Composition</h2>

          {/* Key specs surfaced open-by-default (#13) — no accordion needed */}
          {gsm != null && (
            <div className='flex items-center justify-between gap-2 text-sm'>
              <span className='text-black/50'>GSM</span>
              <span className='font-medium text-black/80'>{gsm}</span>
            </div>
          )}
          {width != null && (
            <div className='flex items-center justify-between gap-2 text-sm'>
              <span className='text-black/50'>Width</span>
              <span className='font-medium text-black/80'>{formatWidthValue(width)}</span>
            </div>
          )}

          {product.subCategory?.name && (
            <div className='flex items-center justify-between gap-2 text-sm'>
              <span className='text-black/50'>{productGroup === 'finished' ? 'Product' : 'Craft'}</span>
              <a
                href={subCategoryUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1 font-medium capitalize text-black/80 hover:text-clay'
              >
                {product.subCategory.name.toLowerCase()}
                <ExtLinkIcon />
              </a>
            </div>
          )}

          {materials.length > 0 && (
            <div className='flex items-center justify-between gap-2 text-sm'>
              <span className='text-black/50'>Material</span>
              <div className='flex flex-wrap items-center justify-end gap-1'>
                {materials.map((m, i) => (
                  <a key={m.id} href={filterUrl(productGroup, 'material', m.name, product.category?.name)} target='_blank' rel='noopener noreferrer'
                     className='flex items-center gap-0.5 font-medium text-black/80 hover:text-clay'>
                    {m.name}<ExtLinkIcon />{i < materials.length - 1 ? ',' : ''}
                  </a>
                ))}
              </div>
            </div>
          )}

          {patterns.length > 0 && (
            <div className='flex items-center justify-between gap-2 text-sm'>
              <span className='text-black/50'>Pattern</span>
              <div className='flex flex-wrap items-center justify-end gap-1'>
                {patterns.map((pt, i) => (
                  <a key={pt.id} href={filterUrl(productGroup, 'pattern', pt.name, product.category?.name)} target='_blank' rel='noopener noreferrer'
                     className='flex items-center gap-0.5 font-medium text-black/80 hover:text-clay'>
                    {pt.name}<ExtLinkIcon />{i < patterns.length - 1 ? ',' : ''}
                  </a>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className='flex items-center justify-between gap-2 text-sm'>
              <span className='text-black/50'>Colour</span>
              <div className='flex flex-wrap items-center justify-end gap-1'>
                {colors.map((c, i) => (
                  <a key={c.id} href={filterUrl(productGroup, 'color', c.name, product.category?.name)} target='_blank' rel='noopener noreferrer'
                     className='flex items-center gap-0.5 font-medium capitalize text-black/80 hover:text-clay'>
                    {c.name.toLowerCase()}<ExtLinkIcon />{i < colors.length - 1 ? ',' : ''}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accordions */}
      <div className='border-t border-sand mt-2'>
        {product.productOverview && (
          <Accordion title='Description'>
            <div className='prose prose-sm max-w-none prose-p:text-black/70 prose-li:text-black/70'
                 dangerouslySetInnerHTML={{ __html: relativizeCmsHtml(product.productOverview) }} />
          </Accordion>
        )}
        {specs.length > 0 && (
          <Accordion title='Product Specifications'>
            <dl className='grid grid-cols-2 gap-x-4 gap-y-2'>
              {specs.map((s) => (
                <div key={s.label} className='contents'>
                  <dt className='text-black/40 text-xs uppercase tracking-wide'>{s.label}</dt>
                  <dd className='text-black/80'>{s.value}</dd>
                </div>
              ))}
            </dl>
          </Accordion>
        )}
        {product.productCare && (
          <Accordion title='Care Instructions'>
            <div className='prose prose-sm max-w-none prose-p:text-black/70 prose-li:text-black/70'
                 dangerouslySetInnerHTML={{ __html: relativizeCmsHtml(product.productCare) }} />
          </Accordion>
        )}
      </div>

      {/* Dialogs */}
      <BulkPriceDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        product={product}
        items={volumeItems}
        disclaimer={disclaimer}
        profileName={profileName}
        loyaltyDiscount={loyaltyDiscount}
        isMember={isMember}
        vdExtras={vdExtras}
      />
      <PreOrderDialog
        open={preOrderOpen}
        onClose={() => setPreOrderOpen(false)}
        product={product}
        recordId={recordId}
        productGroup={productGroup}
        items={volumeItems}
        disclaimer={disclaimer}
        loyaltyDiscount={loyaltyDiscount}
        vdExtras={vdExtras}
        onAdded={handleAdded}
      />

      {/* The bulk entry point's sign-in, for a guest. It is the SAME modal the
          rest of the storefront uses — both lanes, password and emailed code —
          and it signs in IN PLACE, so the buyer is left standing on the product
          they were reading rather than being posted to a generic page. */}
      {/* NOT guarded on !user, deliberately. The code lane signs the buyer in
          and THEN, for a brand-new account, asks 'Who do you buy for?' on the
          same screen — so for a moment they are authenticated and still have
          something to do in here. Unmounting the modal the instant a session
          appeared deleted that question (the same race §15.2 records at
          /auth), and on THIS surface the question is the whole point: a guest
          who came for bulk prices is exactly the buyer whose answer we want.
          The modal closes itself via onSuccess instead. */}
      <LoginModal open={bulkSignInOpen} onClose={() => setBulkSignInOpen(false)} />

      {/* Notify Me: logged-out -> sign in; logged-in -> waitlist confirmation */}
      {!user && <LoginModal open={notifyOpen} onClose={() => setNotifyOpen(false)} />}
      {user && notifyOpen && (
        <div className='fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4' onClick={() => { setNotifyOpen(false); setNotifyDone(false); }}>
          <div className='w-full max-w-[420px] rounded-xl bg-white p-6 text-center' onClick={(e) => e.stopPropagation()}>
            {notifyDone ? (
              <>
                <h3 className='text-lg font-medium text-black'>Thank You</h3>
                <p className='mt-2 text-sm text-black/60'>We shall notify you as soon as this product is back in stock.</p>
              </>
            ) : (
              <>
                <h3 className='text-lg font-medium text-black'>Notify me when available</h3>
                <p className='mt-2 text-sm text-black/60'>We&apos;ll email you the moment {product.name} is back in stock.</p>
                <button
                  type='button'
                  onClick={() => setNotifyDone(true)}
                  className='mt-4 w-full rounded-lg bg-clay py-3 text-sm font-medium text-white hover:bg-clayd transition-colors'
                >
                  Notify Me
                </button>
              </>
            )}
            <button type='button' onClick={() => { setNotifyOpen(false); setNotifyDone(false); }} className='mt-3 text-xs text-black/40 underline'>Close</button>
          </div>
        </div>
      )}

      {/* Sticky mobile CTA bar (best-practice #11) — price + primary action */}
      <div className='fixed inset-x-0 bottom-0 z-[120] flex items-center gap-3 border-t border-sand bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden' style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}>
        <div className='flex flex-col leading-tight'>
          <span className='text-base font-semibold text-clay'>
            {formatCode(displayUnitPrice)}<span className='text-[11px] font-normal text-black/50'> / {unit}</span>
          </span>
        </div>
        {orderable ? (
          <a
            href='#buy-box'
            className='flex-1 min-h-[44px] grid place-items-center rounded-lg bg-clay text-sm font-medium tracking-wide text-white hover:bg-clayd active:scale-[.98] transition-all'
          >
            {inStock ? 'Add to Cart' : 'Order — Made To Order'}
          </a>
        ) : (
          <button
            type='button'
            onClick={() => setNotifyOpen(true)}
            className='flex-1 min-h-[44px] rounded-lg bg-clay text-sm font-medium tracking-wide text-white hover:bg-clayd active:scale-[.98] transition-all'
          >
            Notify Me
          </button>
        )}
      </div>
    </div>
  );
}
