'use client';
import { useState } from 'react';
import Img from '@/components/ui/Img';
import Link from 'next/link';
import CartDetailsDialog from './CartDetailsDialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { CartItem } from './types';
import {
  discountedUnitPrice,
  tierForQuantity,
  cartUnitPrice,
  lineTotal,
  effectiveOrderType,
  ORDER_TYPE_SECTION,
  deliveryRange,
  lineMoq,
} from './types';

// One cart line. Renders: optional Made-To-Order badge, image (scalloped mask for
// swatch), name (SWATCH - prefix + uppercase, -> PDP when a slug is known),
// concrete estimated-delivery line, unit price (paise), live qty stepper, per-line
// LINE TOTAL, variant attributes + customization, remove + save-for-later.
//
// `bare` = rendered inside an order-type SECTION card (no own outer card / header);
// default (guest cart) keeps a self-contained card with its own section header.
export default function CartItemCard({
  item,
  qty,
  onQtyChange,
  onRemove,
  bare = false,
}: {
  item: CartItem;
  qty: number;
  onQtyChange: (qty: number) => void;
  /** When provided (guest cart), the remove button is LIVE and calls this.
   *  Omitted in the authed TEST-MODE view, where remove stays display-only. */
  onRemove?: () => void;
  bare?: boolean;
}) {
  const { formatCode2 } = useCurrency();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const p = item.fabricProductPreview?.product;
  const et = effectiveOrderType(item);
  const isSwatch = (item.productGroup || p?.productGroup || '').toLowerCase() === 'swatch';
  const isMTO = et === 'MADE_TO_ORDER';
  // Swatch price shows literal 'unit'; fabric/finished show their own unit (meter).
  const unit = isSwatch ? 'unit' : (item.unit || 'METER').toLowerCase();

  // Unit price: cart record's own price first (cartUnitPrice), never stale makingCharge.
  const unitPrice = cartUnitPrice(item);
  const disc = p ? discountedUnitPrice(p, qty) : unitPrice;
  const hasDiscount = disc < unitPrice - 0.5;
  const line = lineTotal(item, qty);

  const stockLbl = ORDER_TYPE_SECTION[et];
  const delivery = deliveryRange(item);
  // Universal MOQ floor for this line (made-to-order / pre-order). 1 => no minimum.
  const floorMoq = lineMoq(item);
  const belowMin = qty < floorMoq;

  const group = (p?.productGroup || item.productGroup || 'fabric').toLowerCase();
  const pdpGroup = group === 'swatch' ? 'fabric' : group;
  const pdpHref = p?.slug ? '/product/' + pdpGroup + '-product/' + p.slug : null;
  const baseName = p?.name || 'Product';
  const displayName = (isSwatch ? 'Swatch - ' : '') + baseName;

  const attrs: { label: string; value: string }[] = [];
  if (!isSwatch) {
    if (p?.material) attrs.push({ label: 'Material', value: String(p.material) });
    if (p?.width != null && p.width !== '') attrs.push({ label: 'Width', value: String(p.width) });
    if (p?.colour) attrs.push({ label: 'Colour', value: String(p.colour) });
    if (p?.gsm != null && Number(p.gsm) > 0) attrs.push({ label: 'GSM', value: String(p.gsm) });
  }

  const Thumb = isSwatch ? (
    <div className='flex h-[90px] w-[90px] shrink-0 items-center justify-center'>
      {p?.heroImage ? (
        <div
          className='swatch-mask h-[84px] w-[84px]'
          style={{ backgroundImage: 'url(' + p.heroImage + ')' }}
          aria-label={displayName}
          role='img'
        />
      ) : (
        <div className='swatch-mask flex h-[84px] w-[84px] items-center justify-center bg-clay/10 text-clay/30'>
          <span className='material-symbols-outlined'>image</span>
        </div>
      )}
    </div>
  ) : (
    <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-clay/10 bg-white'>
      {p?.heroImage ? (
        <Img src={p.heroImage} alt={baseName} fill sizes='80px' className='object-cover' />
      ) : (
        <div className='flex h-full w-full items-center justify-center text-clay/30'>
          <span className='material-symbols-outlined'>image</span>
        </div>
      )}
    </div>
  );

  const body = (
    <>
      {/* Made-To-Order badge (live amber #8f780f on #FFF8D0) */}
      {isMTO && (
        <span
          className='mb-1 inline-flex w-max items-center gap-1 rounded px-2 py-1 text-xs font-bold'
          style={{ color: '#8f780f', backgroundColor: '#FFF8D0' }}
        >
          Made To Order
          <span className='material-symbols-outlined text-[13px]'>info</span>
        </span>
      )}
      {/* When bare (inside a section) the section supplies the heading; otherwise
          show a per-card order-type header for the standalone (guest) card. */}
      {!bare && (
        <p className='text-sm font-semibold uppercase tracking-[.08em] text-clay'>
          Cart Item: {stockLbl}
        </p>
      )}
      <p className='mt-1 text-xs uppercase tracking-[.06em] text-clayd/70'>
        Estimated Delivery: {delivery}
      </p>

      <div className='mt-3 flex gap-4'>
        {pdpHref ? (
          <Link href={pdpHref} aria-label={displayName} className='shrink-0'>{Thumb}</Link>
        ) : (
          Thumb
        )}

        <div className='min-w-0 flex-1'>
          {pdpHref ? (
            <Link href={pdpHref} className='block truncate text-sm font-medium uppercase text-clay underline-offset-2 hover:underline'>
              {displayName}
            </Link>
          ) : (
            <p className='truncate text-sm font-medium uppercase text-clay'>{displayName}</p>
          )}

          {attrs.length > 0 && (
            <p className='mt-1 text-xs text-clayd/70'>
              {attrs.map((a) => a.label + ': ' + a.value).join('  ·  ')}
            </p>
          )}

          {item.customization && (
            <p className='mt-1 text-xs text-clay/80'>{item.customization}</p>
          )}

          {(() => {
            const productSku = item.sku || p?.sku;
            const fabricSku = item.fabricSku || item.customDetails?.fabricSku;
            if (!productSku && !fabricSku) return null;
            return (
              <p className='mt-1 text-xs text-clayd/70'>
                {productSku && <span>SKU: {productSku}</span>}
                {productSku && fabricSku && <span>{'  ·  '}</span>}
                {fabricSku && <span>Fabric SKU: {fabricSku}</span>}
              </p>
            );
          })()}

          <button
            type='button'
            onClick={() => setDetailsOpen(true)}
            className='mt-1 inline-flex items-center gap-1 text-xs font-medium text-clay underline-offset-2 hover:underline'
          >
            <span className='material-symbols-outlined text-[15px]'>info</span>
            View details
          </button>

          <p className='mt-1 text-sm text-clayd'>
            {hasDiscount && <span className='mr-1.5 text-clayd/50 line-through'>{formatCode2(unitPrice)}</span>}
            <span className='font-medium text-clay'>{formatCode2(disc)}</span>
            <span className='text-clayd/70'> / {unit}</span>
          </p>

          <div className='mt-3 flex items-center gap-2'>
            <label htmlFor={'qty-' + (item.id ?? baseName)} className='text-xs uppercase tracking-wide text-clayd/70'>
              Quantity
            </label>
            <div className='flex items-center overflow-hidden rounded-md border border-clay/25'>
              <button
                type='button'
                aria-label='decrease quantity'
                onClick={() => onQtyChange(Math.max(floorMoq, qty - 1))}
                disabled={qty <= floorMoq}
                className='px-2.5 py-1 text-clay hover:bg-clay/10 disabled:opacity-40 disabled:hover:bg-transparent'
              >
                &minus;
              </button>
              <input
                id={'qty-' + (item.id ?? baseName)}
                type='number'
                min={floorMoq}
                value={qty}
                aria-label='quantity'
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  // Clamp to the line's MOQ floor (parity with the +/- steppers) so a
                  // bulk / made-to-order line can never be typed below its minimum.
                  if (!isNaN(v) && v >= 1) onQtyChange(Math.max(floorMoq, v));
                }}
                className='min-w-[2.5rem] border-x border-clay/15 px-2 py-1 text-center text-sm font-medium text-clay bg-white'
              />
              <button
                type='button'
                aria-label='increase quantity'
                onClick={() => onQtyChange(qty + 1)}
                className='px-2.5 py-1 text-clay hover:bg-clay/10'
              >
                +
              </button>
            </div>
          </div>

          {belowMin && (
            <p className='mt-1.5 text-xs font-medium text-red-600'>
              Below minimum ({floorMoq} {unit}) — increase to meet the made-to-order minimum.
            </p>
          )}

          <p className='mt-2 text-sm text-clayd'>
            <span className='uppercase tracking-wide text-clayd/70'>Line total: </span>
            <span className='font-semibold text-clay'>{formatCode2(line)}</span>
          </p>
        </div>

        <div className='flex flex-col items-center gap-3 text-clayd/70'>
          <button
            type='button'
            title={onRemove ? 'Remove item' : 'Disabled in TEST MODE'}
            onClick={onRemove}
            className={'flex flex-col items-center text-xs ' + (onRemove ? 'hover:text-red-600 transition-colors' : '')}
            aria-label={onRemove ? 'remove item' : 'remove (display only)'}
          >
            <span className='material-symbols-outlined text-[20px]'>close</span>
            <span>remove</span>
          </button>
          <button
            type='button'
            title='Disabled in TEST MODE'
            className='flex flex-col items-center text-xs'
            aria-label='save for later (display only)'
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-5 w-5'>
              <path d='M4 2a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h16v16H4V4zm2 2v4h4V6H6zm6 0v4h4V6h-4zM6 12v4h4v-4H6zm6 0v4h4v-4h-4z'/>
            </svg>
            <span className='leading-tight'>Save for<br />later</span>
          </button>
        </div>
      </div>
      <CartDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} item={item} />
    </>
  );

  if (bare) return <div className='pt-4 first:pt-0'>{body}</div>;
  return <div className='rounded-lg border border-clay/15 bg-[#f6f2ea] p-5'>{body}</div>;
}
