'use client';

import Link from 'next/link';
import { attachTo as attachAttribution } from '@/lib/ad-attribution';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Img from '@/components/ui/Img';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { CatalogueProduct } from './types';
import { deriveStockStatus } from '@/components/product/stock';
import { useBuyerMode } from '@/components/BuyerModeProvider';

interface ProductCardProps {
  product: CatalogueProduct;
  /** square for fabrics, taller (3/4) for finished apparel. */
  aspect?: 'square' | 'portrait';
  /** Catalogue group — the inline Order-Swatch action is fabric-only. */
  group?: 'fabric' | 'finished';
  /** SWATCH_PRICE_PERCENTAGE (>0 enables the inline Order-Swatch action). */
  swatchPercentage?: number;
  /**
   * Open the login modal. Passed down from CatalogueShell via ProductGrid so the
   * modal state lives in one place (the shell). If omitted the button falls back
   * to navigating to /auth (e.g. cards rendered outside the shell).
   */
  onLoginClick?: () => void;
}

// FIX-5: Truncate to N chars with ellipsis to match live truncketHtml:25/20.
function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

// FIX-9: Convert to Title Case (matching live special_status styling).
function toTitleCase(s: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductCard({
  product,
  aspect = 'square',
  group = 'fabric',
  swatchPercentage,
  onLoginClick,
}: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { formatCode } = useCurrency();
  const isLoggedIn = !!user;
  const { showBulkData, mode } = useBuyerMode();

  // STOCK STATE — derive from the SAME shared classifier the PDP uses, so the
  // card's stock word matches the PDP (was: product.totalQuantity > 0, which
  // disagreed with the PDP's made-to-order state). The preview row strips the
  // MTO fabric qty, so madeToOrderFabricQty is left undefined here.
  const stockStatus = deriveStockStatus({
    totalQuantity: product.totalQuantity,
    madeToOrderProfileEnabled: product.madeToOrderProfileEnabled,
  });
  const inStock = stockStatus === 'IN_STOCK';
  const isMadeToOrder = stockStatus === 'MADE_TO_ORDER';
  const href = '/product/' + product.productGroup + '-product/' + product.slug;
  const aspectClass = aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-square';

  // Hover image is only mounted once the card is actually hovered/focused, so
  // it isn't fetched for every card on page load — only the ones a shopper
  // hovers over.
  const [hoverLoaded, setHoverLoaded] = useState(false);
  const loadHoverImage = () => setHoverLoaded(true);

  // ---------------------------------------------------------------------------
  // #13 — Order-model-aware bulk/MOQ badge. MOQ is a MADE-TO-ORDER / bulk concept,
  // NOT retail: an in-stock fabric is bought off the shelf at any quantity, so it
  // shows NO hard minimum. We surface a MOQ badge ONLY for not-in-stock fabric,
  // and the number is the MINIMUM tier (~25m, framed "Bulk from {min}m") — never
  // the top 1000m slab. Fabric cards only.
  // ---------------------------------------------------------------------------
  const moq = product.volumeDiscountMinimumOrderQuantity ?? 0;
  const moqUnit = (product.unit || 'METER').toUpperCase() === 'METER' ? 'm' : '';
  // Hard MOQ badge: fabric, NOT in stock, real minimum tier only. MOQ is a
  // made-to-order/bulk concept; an in-stock fabric is bought off the shelf at
  // any quantity, so it must NOT show a hard minimum.
  const showMoqBadge = group === 'fabric' && !inStock && moq > 0 && showBulkData;

  // ---------------------------------------------------------------------------
  // #12 — inline Order-Swatch action (fabric only, when swatches are enabled
  // and we have the ids the cart endpoint needs). Mirrors the PDP SwatchButton:
  // POST /api/cart/add with productGroup:'swatch'.
  // ---------------------------------------------------------------------------
  const swatchPrice =
    swatchPercentage && swatchPercentage > 0 ? (swatchPercentage / 100) * product.price : 0;
  const canSwatch =
    group === 'fabric' && swatchPrice > 0 && !!product.recordId && !!product.sku && showBulkData;
  const [swatchState, setSwatchState] = useState<'idle' | 'adding' | 'added'>('idle');

  const handleSwatchClick = async () => {
    if (!isLoggedIn) {
      handleLoginClick();
      return;
    }
    if (!product.recordId || !product.sku) return;
    setSwatchState('adding');
    const swatchBody: Record<string, unknown> = {
      fabricProductId: product.recordId,
      quantity: 1,
      unit: 'UNIT',
      price: swatchPrice,
      selectedFabricId: 0,
      selectedSizeOptionId: 0,
      selectedFinishId: '',
      orderType: 'IN_STOCK',
      productGroup: 'swatch',
      makingCharge: product.price,
      customSize: {},
      sku: product.sku,
    };
    // Stamp ad-attribution (gclid/utm_*) onto the outgoing cart body (in place).
    attachAttribution(swatchBody);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swatchBody),
        cache: 'no-store',
      });
      if (res.ok) {
        setSwatchState('added');
        setTimeout(() => setSwatchState('idle'), 2000);
      } else {
        setSwatchState('idle');
      }
    } catch {
      setSwatchState('idle');
    }
  };

  // FIX-9: caption = special_status (Title Case grey), NOT uppercase craft.
  // Live filter-product-preview shows special_status as the caption line.
  const captionLabel = product.specialStatus ? toTitleCase(product.specialStatus) : undefined;

  // ---------------------------------------------------------------------------
  // PLP-01: AUTH-AWARE BULK PRICE.
  // ---------------------------------------------------------------------------
  const bulkPrice = useMemo(() => {
    if (product.volumeDiscount) {
      return product.price - product.price * (product.volumeDiscount / 100);
    }
    return product.price;
  }, [product.price, product.volumeDiscount]);

  // PLP-02: wholesale-member discounted retail price.
  const discounted = product.calculatedDiscountedPrice ?? 0;
  const showWholesale = discounted > 0;

  const handleLoginClick = () => {
    if (onLoginClick) onLoginClick();
    else router.push('/auth');
  };

  const handleWishlistClick = () => {
    router.push('/wishlist');
  };

  return (
    <div className='group relative flex flex-col rounded-xl border border-gray-100 bg-cream shadow-sm overflow-hidden transition-shadow hover:shadow-md'>
      {/* Image with hover-swap — NV-01/NV-02: use Next.js <Link> for SPA soft navigation */}
      <Link href={href} prefetch className='relative block' aria-label={product.name}>
        <div
          className={'relative ' + aspectClass + ' overflow-hidden bg-sand'}
          onMouseEnter={loadHoverImage}
          onFocus={loadHoverImage}
          onTouchStart={loadHoverImage}
        >
          <Img
            src={product.heroImage}
            alt={product.heroImageAlt || product.name}
            fill
            sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
            className='object-cover transition-opacity duration-300 group-hover:opacity-0'
          />
          {product.hoverImage && product.hoverImage !== product.heroImage && hoverLoaded && (
            <Img
              src={product.hoverImage}
              alt={product.hoverImageAlt || product.name}
              fill
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              className='object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100'
            />
          )}
        </div>

        {/* FIX-3: In-Stock badge — sage bg #E6EAC6, olive text #7F8142, 12px, radius 4px, pad 4px 8px.
            NOT the generic Tailwind green pill. */}
        {inStock && (
          <span
            className='absolute top-2 left-2 text-[12px] font-medium'
            style={{
              backgroundColor: '#E6EAC6',
              color: '#7F8142',
              borderRadius: '4px',
              padding: '4px 8px',
            }}
          >
            In Stock
          </span>
        )}

        {/* Made-To-Order badge — top-left, mirrors the PDP's "Made To Order"
            state so a product's stock word is IDENTICAL on PLP and PDP. Shown
            when the shared classifier (deriveStockStatus) returns MADE_TO_ORDER. */}
        {isMadeToOrder && (
          <span
            className='absolute top-2 left-2 text-[12px] font-medium'
            style={{
              backgroundColor: '#FBF3E4',
              color: '#7D5A20',
              borderRadius: '4px',
              padding: '4px 8px',
            }}
          >
            Made To Order
          </span>
        )}

        {/* #13: Bulk/MOQ badge — top-right, NOT-IN-STOCK (made-to-order) fabric only.
            In-stock fabric deliberately shows NO MOQ (retail: buy any quantity).
            The number is the MINIMUM bulk tier, framed "Bulk from {min}m". */}
        {showMoqBadge && (
          <span
            className='absolute top-2 right-2 text-[11px] font-medium'
            style={{
              backgroundColor: '#F1E9DD',
              color: '#8d7961',
              borderRadius: '4px',
              padding: '3px 7px',
            }}
            title={`Made to order — bulk from ${moq}${moqUnit}`}
          >
            {`Bulk from ${moq}${moqUnit}`}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className='flex flex-1 flex-col p-3'>
        {/* FIX-9: caption = special_status, Title Case, grey #75787F text-xs */}
        {captionLabel && (
          <span className='text-[11px] mb-1 truncate' style={{ color: '#75787F' }}>
            {captionLabel}
          </span>
        )}
        {/* NV-01/NV-02: use Next.js <Link> for SPA soft navigation */}
        <Link href={href} prefetch className='block'>
          {/* FIX-5: truncate title to 25 chars desktop / 20 mobile with ellipsis */}
          <h3 className='text-sm text-gray-800 leading-snug hover:text-clay transition-colors'>
            <span className='hidden sm:inline'>{truncate(product.name, 25)}</span>
            <span className='inline sm:hidden'>{truncate(product.name, 20)}</span>
          </h3>
        </Link>

        {/* Retail price block — PLP-02 */}
        <div className='mt-2 flex items-center flex-wrap text-clay font-medium text-sm'>
          {showWholesale ? (
            <span className='flex items-center'>
              <span className='line-through text-xs text-[#898E9A]'>{formatCode(product.calculatedPrice)}</span>
              <span className='ml-2 text-base'>{formatCode(discounted)}</span>
            </span>
          ) : (
            <span>{formatCode(product.calculatedPrice)}</span>
          )}
          {/* FIX-12: ' / METER' spacing — space before slash, space after, uppercase unit */}
          <span className='text-bark font-normal text-[10px] ml-0.5'>{' / ' + (product.unit || 'METER').toUpperCase()}</span>
          {showWholesale && (
            <span
              className='ml-1 inline-flex items-center text-[#7D5B20]'
              title='Wholesale program member price'
              aria-label='Wholesale program member price'
            >
              <span className='material-symbols-outlined text-[14px]'>crown</span>
            </span>
          )}
        </div>

        <div className='mt-3 flex items-center gap-2'>
          {/* PLP CTA — mode-driven: b2b (logged-in wholesale) sees the actual bulk
              price; b2c sees retail "View Product"; guest sees the login invitation. */}
          {mode === 'b2b' ? (
            <Link
              href={href}
              prefetch
              className='flex-1 flex items-center justify-center gap-1.5 border border-clay text-clay text-xs py-2 rounded hover:bg-clay hover:text-white transition-colors'
            >
              <span className='material-symbols-outlined text-[14px]'>shopping_basket</span>
              <span>Bulk Order @ {formatCode(bulkPrice)}</span>
            </Link>
          ) : mode === 'b2c' ? (
            <Link
              href={href}
              prefetch
              className='flex-1 flex items-center justify-center gap-1.5 border border-clay text-clay text-xs py-2 rounded hover:bg-clay hover:text-white transition-colors'
            >
              <span className='material-symbols-outlined text-[14px]'>visibility</span>
              <span>View Product</span>
            </Link>
          ) : (
            <button
              type='button'
              onClick={handleLoginClick}
              className='flex-1 flex items-center justify-center gap-1.5 border border-clay text-clay text-xs py-2 rounded hover:bg-clay hover:text-white transition-colors'
            >
              <span className='material-symbols-outlined text-[14px]'>person</span>
              Login to get bulk price
            </button>
          )}
          {/* FIX-4: Wishlist heart — OUTLINE (favorite_border) by default; filled (favorite)
              only when product is in wishlist. Live uses non-favourite.svg (outline) by default. */}
          <button
            type='button'
            aria-label='Add to wishlist'
            onClick={handleWishlistClick}
            className='flex-shrink-0 w-8 h-8 flex items-center justify-center border border-clay rounded hover:bg-clay hover:text-white transition-colors text-clay'
          >
            <span className='material-symbols-outlined text-[14px]' style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>
              favorite
            </span>
          </button>
        </div>

        {/* #12: inline Order-Swatch action — sample without entering the PDP.
            Fabric only, shown when swatches are enabled. Secondary (text-link)
            style so it doesn't compete with the bulk-price CTA. */}
        {canSwatch && (
          <button
            type='button'
            onClick={handleSwatchClick}
            disabled={swatchState === 'adding'}
            aria-label='Order a swatch sample'
            className='mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] text-bark hover:text-clay transition-colors disabled:opacity-60'
          >
            <span className='material-symbols-outlined text-[14px]'>texture</span>
            <span>
              {swatchState === 'added'
                ? '✓ Swatch added'
                : swatchState === 'adding'
                ? 'Adding…'
                : `Order Swatch · ${formatCode(swatchPrice)}`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
