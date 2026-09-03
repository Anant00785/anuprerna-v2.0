'use client';
import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { CartItem, Shipment, Discount } from './types';
import { discountedUnitPrice, shipmentCost, tierForQuantity, cartUnitPrice, lineTotal } from './types';

interface Props {
  items: CartItem[];
  shipment: Shipment | null;
  discounts: Discount[];
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  qtyMap?: Record<number, number>;
}

// Order summary panel (right column desktop / stacked mobile). ALL money via
// useCurrency().formatCode2(). DISPLAY-ONLY voucher + note: no apply-voucher / write call.
export default function OrderSummary({ items, shipment, discounts, ctaLabel, onCta, ctaDisabled, qtyMap = {} }: Props) {
  const { formatCode2 } = useCurrency();
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucher, setVoucher] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  let subtotal = 0; // qty * discounted unit price
  let volumeDiscount = 0; // qty * (price - discounted)
  let totalQty = 0;
  let payTodayPct = 0;
  let hasPreOrder = false;

  for (const [i, it] of items.entries()) {
    const p = it.fabricProductPreview?.product;
    const qty = (qtyMap ?? {})[it.id ?? i] ?? (it.quantity ?? 0);
    totalQty += qty;
    // Line total prices off enriched product price when present, else the
    // cart item's own makingCharge (the thin Loom item has no product price).
    subtotal += lineTotal(it, qty);
    // Volume discount only meaningful when the product (with its tier table)
    // is enriched; the thin item's makingCharge is already the agreed price.
    if (p) {
      const disc = discountedUnitPrice(p, qty);
      volumeDiscount += qty * (cartUnitPrice(it) - disc);
    }
    if ((it.orderType || '').toUpperCase().includes('PRE')) hasPreOrder = true;
    const tier = tierForQuantity(p, qty);
    if (tier?.advancePayment != null) payTodayPct = Math.max(payTodayPct, tier.advancePayment);
  }

  const ship = shipmentCost(shipment, totalQty);
  const total = subtotal + ship; // subtotal already net of volume discount
  // Pay Today: advancePayment% of total for PRE_ORDER (fallback 50% split), else full.
  const payToday = hasPreOrder ? total * ((payTodayPct > 0 ? payTodayPct : 50) / 100) : total;
  const remaining = Math.max(0, total - payToday);

  const labelCls = 'text-sm uppercase tracking-[.08em] text-clayd/80';
  const valCls = 'text-sm font-medium text-clay';

  return (
    <div className='text-clay'>
      <dl className='space-y-3'>
        <div className='flex items-center justify-between'>
          <dt className={labelCls}>Subtotal:</dt>
          <dd className={valCls}>{formatCode2(subtotal)}</dd>
        </div>
        {volumeDiscount > 0.5 && (
          <div className='flex items-center justify-between'>
            <dt className={labelCls}>Volume Discount Applied:</dt>
            <dd className={valCls}>- {formatCode2(volumeDiscount)}</dd>
          </div>
        )}
        <div className='flex items-center justify-between'>
          <dt className={labelCls}>Shipping Cost:</dt>
          <dd className={valCls}>{shipment ? formatCode2(ship) : '—'}</dd>
        </div>
        <div className='flex items-center justify-between'>
          <dt className={labelCls}>Taxes (GST):</dt>
          <dd className={valCls}>Incl.</dd>
        </div>
      </dl>

      {/* Add Voucher (DISPLAY-ONLY) */}
      <button
        type='button'
        onClick={() => setShowVoucher((v) => !v)}
        className='mt-4 text-sm font-medium text-clayd underline underline-offset-4'
      >
        Add Voucher
      </button>
      {showVoucher && (
        <div className='mt-2'>
          <label htmlFor='voucher-code' className='mb-1 block text-xs uppercase tracking-wide text-clayd/70'>
            Voucher code
          </label>
          <input
            id='voucher-code'
            value={voucher}
            onChange={(e) => setVoucher(e.target.value)}
            placeholder='Enter code'
            className='w-full rounded-md border border-clay/20 bg-white px-3 py-2 text-sm uppercase tracking-wider outline-none focus:border-clay'
          />
          <button
            type='button'
            disabled
            title='Voucher redemption is not wired in this sandbox'
            className='mt-2 w-full cursor-not-allowed rounded-md border border-clay/20 bg-clay/5 px-3 py-2 text-sm font-medium text-clay/40'
          >
            Apply (not available yet)
          </button>
          {discounts.filter((d) => d.active).length > 0 && (
            <div className='mt-2 flex flex-wrap gap-1.5'>
              {discounts
                .filter((d) => d.active && d.couponCode)
                .map((d) => (
                  <button
                    key={d.couponCode}
                    type='button'
                    onClick={() => setVoucher(d.couponCode || '')}
                    className='rounded-full border border-clay/30 px-2.5 py-1 text-xs text-clayd hover:bg-clay/5'
                    title={
                      (d.discountType === 'FREE_SHIPPING'
                        ? 'Free shipping'
                        : (d.discountPercentage ?? 0) + '% off') +
                      (d.minimumOrderValue ? ' over INR ' + d.minimumOrderValue : '')
                    }
                  >
                    {d.couponCode}
                  </button>
                ))}
            </div>
          )}
          <p className='mt-1.5 text-xs text-clayd/60'>Voucher redemption is not wired in this sandbox — no discount is applied.</p>
        </div>
      )}

      <div className='my-4 border-t border-clay/15' />

      <dl className='space-y-2'>
        <div className='flex items-center justify-between'>
          <dt className='text-base font-semibold uppercase tracking-[.08em] text-clay'>Total:</dt>
          <dd className='text-base font-semibold text-clay'>{formatCode2(total)}</dd>
        </div>
        <div className='flex items-center justify-between'>
          <dt className='text-sm font-medium text-clayd'>Total Estimated Pay Today:</dt>
          <dd className='text-sm font-medium text-clay'>{formatCode2(payToday)}</dd>
        </div>
        <div className='flex items-center justify-between'>
          <dt className='text-sm font-medium text-clayd'>Total Remaining Balance:</dt>
          <dd className='text-sm font-medium text-clay'>{formatCode2(remaining)}</dd>
        </div>
      </dl>
      {hasPreOrder && (
        <p className='mt-1 text-xs text-clayd/60'>
          Pre-order split shown is indicative; the full amount is collected at checkout.
        </p>
      )}

      {/* Add Note (local only) */}
      <button
        type='button'
        onClick={() => setShowNote((v) => !v)}
        className='mt-4 flex w-full items-center justify-between text-sm font-medium text-clayd underline underline-offset-4'
      >
        <span>Add Note</span>
        <span className='material-symbols-outlined text-[18px] no-underline'>{showNote ? 'close' : 'add'}</span>
      </button>
      {showNote && (
        <>
        <label htmlFor='order-note' className='mt-2 block text-xs uppercase tracking-wide text-clayd/70'>
          Order note
        </label>
        <textarea
          id='order-note'
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className='mt-2 w-full rounded-md border border-clay/20 bg-white px-3 py-2 text-sm outline-none focus:border-clay'
          placeholder='Any special instructions…'
        />
        </>
      )}

      <button
        type='button'
        onClick={() => onCta?.()}
        disabled={ctaDisabled}
        className='mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-clay/80 px-4 py-3.5 text-sm font-semibold uppercase tracking-[.08em] text-white transition hover:bg-clay disabled:opacity-50'
      >
        {ctaLabel}
        <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
      </button>

      {/* Trust microcopy near the CTA */}
      <p className='mt-3 flex items-center justify-center gap-1.5 text-xs text-clayd/70'>
        <span className='material-symbols-outlined text-[15px]'>lock</span>
        Secure checkout.
      </p>
      <p className='mt-1 text-center text-xs text-clayd/60'>Your details are handled securely.</p>
    </div>
  );
}
