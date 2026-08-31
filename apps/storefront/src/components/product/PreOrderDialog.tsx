'use client';

import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { attachTo as attachAttribution } from '@/lib/ad-attribution';
import LoginModal from "@/components/auth/LoginModal";
import GuestB2BModal from "./GuestB2BModal";
import { calculateVDProductPrice, type VDExtras } from './pricing';
import type { ProductDetail, VolumeDiscountItem } from './types';

interface PreOrderDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductDetail;
  recordId: number;
  productGroup: 'fabric' | 'finished';
  items: VolumeDiscountItem[];
  disclaimer?: string;
  loyaltyDiscount?: number;
  /** MTO fabric-consumption terms so tier prices stay consistent with the base. */
  vdExtras?: VDExtras;
  onAdded?: () => void;
}

// Port of ProductPreOrderDialog — bulk pre-order flow for
// volumeDiscountProfileEnabled products. Advance payment is taken at checkout.
export default function PreOrderDialog({
  open,
  onClose,
  product,
  recordId,
  productGroup,
  items,
  disclaimer,
  loyaltyDiscount = 0,
  vdExtras,
  onAdded,
}: PreOrderDialogProps) {
  const { format } = useCurrency();
  const { user } = useAuth();
  const unit = (product.unit || 'METER').toLowerCase();
  const step = product.unit === 'METER' ? 0.5 : 1;

  const tiers = [...items].sort((a, b) => a.minimumOrderQuantity - b.minimumOrderQuantity);
  const minMOQ = tiers.length ? tiers[0].minimumOrderQuantity : 1;

  const [qty, setQty] = useState(minMOQ);
  const [state, setState] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  if (!open) return null;

  // Tier that applies to the chosen qty (deepest qualifying tier).
  const applicable = [...items]
    .sort((a, b) => b.minimumOrderQuantity - a.minimumOrderQuantity)
    .find((t) => t.minimumOrderQuantity <= qty);
  const unitPrice = applicable
    ? calculateVDProductPrice(product, applicable, loyaltyDiscount, vdExtras)
    : product.price;

  const handlePreOrder = async () => {
    if (!user) {
      setGuestOpen(true);
      return;
    }
    setState('adding');
    setErrorMsg('');
    // Loom rejects a partial body (406/401); send the full contract (price, sku,
    // makingCharge, customSize, selectedFinishId) — same shape as Add-to-Cart/Swatch.
    const body =
      productGroup === 'fabric'
        ? { fabricProductId: recordId, quantity: qty, unit: product.unit, price: product.price, selectedFinishId: '', orderType: 'PRE_ORDER', productGroup: 'fabric', makingCharge: product.price, customSize: {}, sku: product.sku }
        : { finishedProductId: recordId, quantity: qty, unit: product.unit, price: product.price, selectedFinishId: '', orderType: 'PRE_ORDER', productGroup: 'finished', makingCharge: product.price, customSize: {}, sku: product.sku };
    attachAttribution(body as Record<string, unknown>);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState('added');
        onAdded?.();
        try { window.dispatchEvent(new CustomEvent('anuprerna:cart-updated')); } catch {}
        setTimeout(() => { setState('idle'); onClose(); }, 1500);
      } else {
        setErrorMsg(data?.message || 'Failed to place pre-order.');
        setState('error');
      }
    } catch {
      setErrorMsg('Network error — please try again.');
      setState('error');
    }
  };

  const handleGuestSubmit = async (data: { companyName: string; email: string; name: string }) => {
    // Submit to contact api
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        companyName: data.companyName,
        subject: 'B2B Bulk Pre-Order Inquiry',
        message: `Guest B2B Bulk Pre-Order Inquiry for ${product.name} (Qty: ${qty} ${unit}). Company: ${data.companyName}`
      })
    });
    // Auto provision account in background gracefully
    fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.name, email: data.email, password: crypto.randomUUID() }) }).catch(console.error);
  };

  return (
    <>
      <div
        className='fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4'
        onClick={onClose}
        role='dialog'
        aria-modal='true'
        aria-label='Bulk pre-order'
      >
        <div
          className='relative w-full max-w-[600px] max-h-[85vh] overflow-y-auto rounded-xl bg-white py-5 px-6'
          onClick={(e) => e.stopPropagation()}
        >
          <button
            aria-label='Close'
            onClick={onClose}
            className='absolute top-3 left-3 grid h-8 w-8 place-items-center rounded text-white'
            style={{ backgroundColor: '#D4A373' }}
          >
            <span className='material-symbols-outlined text-[18px]'>close</span>
          </button>

          <h2 className='mb-2 text-center text-xl font-semibold text-[#3c3c3c]'>Pre Order</h2>

          <div className='mx-auto mb-4 flex max-w-max items-center gap-2 rounded-lg bg-cream px-3 py-2'>
            <span className='material-symbols-outlined text-bark text-[18px]'>error</span>
            <p className='text-xs text-black/60'>An advance payment of 50% is required at checkout</p>
          </div>

          {product.specialStatus?.name && (
            <span className='mb-2 inline-block rounded-full bg-sand px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-clay'>
              {product.specialStatus.name}
            </span>
          )}
          <h1 className='mb-1 text-lg font-medium text-black'>{product.name}</h1>
          <p className='mb-4 text-xs text-black/50'>SKU: {product.sku}</p>

          {/* Tier table */}
          <div className='mb-4 rounded-xl border border-sand bg-cream p-4'>
            <h4 className='mb-3 text-xs uppercase tracking-widest text-clay'>Volume Pricing</h4>
            <div className='flex flex-col gap-2'>
              {tiers.map((t) => (
                <div key={t.id} className='flex items-center justify-between border-b border-sand pb-2 text-sm capitalize last:border-0'>
                  <span className='text-black/70'>
                    For {t.minimumOrderQuantity} {unit}s
                    <span className='ml-1.5 text-[11px] text-bark'>({t.deliveryFromDays}–{t.deliveryToDays} days)</span>
                  </span>
                  <span className='font-medium text-clay'>
                    {format(calculateVDProductPrice(product, t, loyaltyDiscount, vdExtras))} / {unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Qty stepper */}
          <div className='mb-4'>
            <p className='mb-2 text-sm font-medium text-black/80 capitalize'>Quantity ({unit})</p>
            <div className='flex items-center gap-3'>
              <div className='flex items-center overflow-hidden rounded-lg border border-bark/30'>
                <button
                  aria-label='Decrease'
                  onClick={() => setQty((q) => Math.max(minMOQ, +(q - step).toFixed(2)))}
                  className='grid h-9 w-9 place-items-center text-clay hover:bg-sand'
                >
                  <span className='material-symbols-outlined text-[18px]'>remove</span>
                </button>
                <span className='w-14 text-center text-sm font-medium'>{qty}</span>
                <button
                  aria-label='Increase'
                  onClick={() => setQty((q) => +(q + step).toFixed(2))}
                  className='grid h-9 w-9 place-items-center text-clay hover:bg-sand'
                >
                  <span className='material-symbols-outlined text-[18px]'>add</span>
                </button>
              </div>
              <span className='text-sm text-black/50'>min {minMOQ} {unit}</span>
            </div>
          </div>

          {/* Total */}
          <div className='mb-4 flex items-center justify-between border-t border-sand pt-3'>
            <span className='text-sm text-black/60'>Estimated total ({qty} {unit})</span>
            <span className='text-lg font-semibold text-clay'>{format(unitPrice * qty)}</span>
          </div>

          <button
            onClick={handlePreOrder}
            disabled={state === 'adding'}
            className={
              'w-full rounded-lg py-3.5 text-sm font-medium tracking-wide text-white transition-all ' +
              (state === 'added' ? 'bg-green-600' : 'bg-clay hover:bg-clayd active:scale-[.98] disabled:opacity-70')
            }
          >
            {state === 'adding' ? 'Placing…' : state === 'added' ? '✓ Pre-Order Added' : 'Place Pre-Order'}
          </button>
          {state === 'error' && errorMsg && <p className='mt-2 text-sm text-red-600'>{errorMsg}</p>}
          {!user && (
            <p className='mt-2 text-center text-xs text-black/50'>
              <button onClick={() => setLoginOpen(true)} className='text-clay underline'>Sign in</button> or continue as guest to pre-order
            </p>
          )}

          {disclaimer && (
            <p className='mt-4 whitespace-pre-line text-xs text-black/50'>{disclaimer}</p>
          )}
        </div>
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <GuestB2BModal
        open={guestOpen}
        onClose={() => setGuestOpen(false)}
        onSubmit={handleGuestSubmit}
        productName={product.name}
        qty={qty}
      />
    </>
  );
}
