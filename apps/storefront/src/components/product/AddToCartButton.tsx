'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';
import LeadTimeDialog from './LeadTimeDialog';
import { addItem as addGuestItem, type GuestCartInput } from '@/lib/guest-cart';
import { attachTo as attachAttribution } from '@/lib/ad-attribution';

interface AddToCartButtonProps {
  /** fabricProductId or finishedProductId */
  productRecordId: number;
  productGroup: 'fabric' | 'finished';
  /** 'IN_STOCK' | 'MADE_TO_ORDER' (mapped to Loom's IN_STOCK / PRE_ORDER below) */
  orderType?: string;
  unit?: string;
  /** unit price (INR) — required by the Loom cart contract. */
  price: number;
  /** product SKU — required by the Loom cart contract. */
  sku: string;
  /** calculatedQuantityInStock — qty is clamped to this. 0 ⇒ no clamp. */
  maxStock?: number;
  /** Hard minimum order quantity (made-to-order MOQ / pre-order tier floor,
   *  resolved by effectiveOrderProfile()). UNIVERSAL now (guest/b2c/b2b) — when
   *  set, the stepper's minimum AND default both floor here instead of 1.
   *  Omit/0 => no MOQ (qty starts at 1). */
  minMoq?: number;
  /** Selected customization finish id (Loom finish-profile item id, as a string).
   *  Empty string ⇒ no finish chosen (default, byte-identical to the prior body). */
  selectedFinishId?: string;
  /** Selected custom-fabric id (Loom fabric-preview id). Only added to the cart
   *  body when a fabric is actually picked, so the default path is unchanged. */
  selectedFabricId?: number;
  /** Selected size option id (Loom sizeProfileOption id). Omitted/0 => none (custom
   *  size or no size). Sent to the cart as selectedSizeOptionId (live's field name). */
  selectedSizeOptionId?: number;
  /** Custom-size measurement object (keyed by field label, live's customSizeFormGroup
   *  value). Replaces customSize:{} when the shopper applies measurements. */
  customSize?: Record<string, unknown>;
  /** makingCharge for the Loom cart contract: product.price for finished, or
   *  price - madeToOrderFabricPrice for fabric. Defaults to price when omitted. */
  makingCharge?: number;
  /** When true, show the lead-time CONFIRMATION modal before adding (made-to-order
   *  / custom-dyed / pre-order). In-stock retail items add directly (no modal). */
  confirmLeadTime?: boolean;
  /** Content for the lead-time modal (only read when confirmLeadTime). */
  leadTime?: {
    label: string;
    fromDays?: number | null;
    toDays?: number | null;
    deliveryDate: string;
    moq?: number;
    unit?: string;
    productName?: string;
  };
  /** Callback when cart updates so the header can refresh. */
  onAdded?: () => void;
}

type State = 'idle' | 'adding' | 'added' | 'error';

// Best-effort scrape of the PDP's display fields so the guest cart can render the
// product name / image / PDP link WITHOUT a fetch. The Add-to-cart callsite
// (ProductInfoPanel) does not pass these and is a no-touch lane, so we read them
// from the page: slug/category from the URL, name from <h1>/title, image from og:image.
function guestDisplayFields(): Partial<GuestCartInput> {
  if (typeof window === 'undefined') return {};
  const parts = window.location.pathname.split('/').filter(Boolean); // /product/<category>/<slug>
  const isPdp = parts[0] === 'product' && parts.length >= 3;
  const slug = isPdp ? parts[parts.length - 1] : undefined;
  const category = isPdp ? parts[1] : undefined;
  const name =
    document.querySelector('h1')?.textContent?.trim() ||
    document.title.replace(/\s*[—|].*$/, '').trim() ||
    undefined;
  const image =
    document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined;
  return { name, image, slug, category };
}


export default function AddToCartButton({
  productRecordId,
  productGroup,
  orderType = 'IN_STOCK',
  unit = 'METER',
  price,
  sku,
  maxStock = 0,
  minMoq = 0,
  selectedFinishId = '',
  selectedFabricId,
  selectedSizeOptionId,
  customSize,
  makingCharge,
  confirmLeadTime = false,
  leadTime,
  onAdded,
}: AddToCartButtonProps) {
  const { user } = useAuth();
  // METER increments by 0.5, everything else by 1 (port of product-quantity-input.ts).
  const step = unit === 'METER' ? 0.5 : 1;
  // Hard MOQ floor (universal) -- 0/undefined => 1, same as before.
  const floor = minMoq > 0 ? minMoq : 1;
  // Effective max clamp: only apply maxStock when it is >= the MOQ floor. A
  // made-to-order item is BUILDABLE beyond its small ready-stock (calculatedQty),
  // so a maxStock below the MOQ must NOT clamp the qty (0 => no clamp).
  const effMax = maxStock > 0 && maxStock >= floor ? maxStock : 0;
  const [qty, setQty] = useState(floor);
  const [maxWarn, setMaxWarn] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);

  const inc = useCallback(() => {
    setMaxWarn(false);
    setQty((q) => {
      const next = +(q + step).toFixed(2);
      if (effMax > 0 && next > effMax) {
        setMaxWarn(true);
        return effMax;
      }
      return next;
    });
  }, [step, effMax]);

  const dec = useCallback(() => {
    setMaxWarn(false);
    setQty((q) => Math.max(floor, +(q - step).toFixed(2)));
  }, [step, floor]);

  const handleAdd = useCallback(async () => {
    setState('adding');
    setErrorMsg('');

    // Loom requires exactly 'IN_STOCK' (in-stock) or 'PRE_ORDER' (pre-order /
    // made-to-order). computeStockState emits 'MADE_TO_ORDER' for the MTO lane —
    // map anything that is not in-stock to 'PRE_ORDER' for the cart contract.
    const loomOrderType = orderType === 'IN_STOCK' ? 'IN_STOCK' : 'PRE_ORDER';

    // Full Loom cart contract (mirrors the working SwatchButton body): the
    // server rejects (406) a partial fabric/finished body, so send price, sku,
    // makingCharge, customSize and selectedFinishId alongside the ids.
    const body =
      productGroup === 'fabric'
        ? {
            fabricProductId: productRecordId,
            quantity: qty,
            unit,
            price,
            selectedFinishId,
            orderType: loomOrderType,
            productGroup: 'fabric',
            makingCharge: makingCharge ?? price,
            customSize: customSize ?? {},
            sku,
            ...(selectedFabricId ? { selectedFabricId } : {}),
            ...(selectedSizeOptionId ? { selectedSizeOptionId } : {}),
          }
        : {
            finishedProductId: productRecordId,
            quantity: qty,
            unit,
            price,
            selectedFinishId,
            orderType: loomOrderType,
            productGroup: 'finished',
            makingCharge: makingCharge ?? price,
            customSize: customSize ?? {},
            sku,
            ...(selectedFabricId ? { selectedFabricId } : {}),
            ...(selectedSizeOptionId ? { selectedSizeOptionId } : {}),
          };

    // GUEST (not logged in): the account cart 403s/401s anonymous, so add to the
    // client-side guest cart instead of popping a login dialog. Same success UX
    // (the green Added-to-Cart state) the logged-in path shows.
    if (!user) {
      try {
        addGuestItem({ ...(body as GuestCartInput), ...guestDisplayFields() });
        setState('added');
        onAdded?.();
        try { window.dispatchEvent(new CustomEvent('anuprerna:cart-updated')); } catch {}
        setTimeout(() => setState('idle'), 2500);
      } catch {
        setErrorMsg('Could not add to cart. Please try again.');
        setState('error');
        setTimeout(() => setState('idle'), 3000);
      }
      return;
    }

    // Stamp ad-attribution (gclid/utm_*) onto the outgoing cart body (in place).
    attachAttribution(body as Record<string, unknown>);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      // The Loom cart wrapper answers soft-denials with HTTP 200 + {success:false}
      // (never a hard 401), so res.ok alone is not proof of success — require the
      // body's success flag before showing the green Added-to-Cart state.
      if (res.ok && data?.success === true) {
        setState('added');
        onAdded?.();
        try { window.dispatchEvent(new CustomEvent('anuprerna:cart-updated')); } catch {}
        setTimeout(() => setState('idle'), 2500);
      } else {
        setErrorMsg(data?.message || 'Failed to add to cart.');
        setState('error');
        setTimeout(() => setState('idle'), 3000);
      }
    } catch {
      setErrorMsg('Network error — please try again.');
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }, [user, productRecordId, productGroup, orderType, qty, unit, price, sku, selectedFinishId, selectedFabricId, selectedSizeOptionId, customSize, makingCharge, onAdded]);

  // Add-to-cart click: made-to-order / custom / pre-order items confirm the lead
  // time first; in-stock retail adds directly (fast path, no modal).
  const onAddClick = useCallback(() => {
    if (confirmLeadTime) { setLeadOpen(true); return; }
    handleAdd();
  }, [confirmLeadTime, handleAdd]);

  const onConfirmLead = useCallback(() => {
    setLeadOpen(false);
    handleAdd();
  }, [handleAdd]);

  const isAdding = state === 'adding';
  const isAdded = state === 'added';

  return (
    <>
      <div className='flex flex-col gap-3'>
        {/* Qty stepper */}
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-3'>
            <span className='text-sm text-black/60 capitalize'>Quantity ({unit.toLowerCase()})</span>
            <div className='flex items-center border border-bark/30 rounded-lg overflow-hidden'>
              <button
                aria-label='Decrease quantity'
                onClick={dec}
                className='w-9 h-9 grid place-items-center text-clay hover:bg-sand transition-colors disabled:opacity-40'
                disabled={qty <= floor}
              >
                <span className='material-symbols-outlined text-[18px]'>remove</span>
              </button>
              <span className='w-12 text-center text-sm font-medium'>{qty}</span>
              <button
                aria-label='Increase quantity'
                onClick={inc}
                className='w-9 h-9 grid place-items-center text-clay hover:bg-sand transition-colors'
              >
                <span className='material-symbols-outlined text-[18px]'>add</span>
              </button>
            </div>
          </div>
          {floor > 1 && (
            <p className='text-xs text-black/50'>
              Minimum order quantity: {floor} {unit.toLowerCase()}{floor === 1 ? '' : 's'}
            </p>
          )}
          {maxWarn && effMax > 0 && (
            <p className='text-xs text-red-600'>
              Maximum quantity available is {effMax} {unit.toLowerCase()}(s)
            </p>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={onAddClick}
          disabled={isAdding}
          className={
            'w-full py-3.5 rounded-lg font-medium text-sm tracking-wide transition-all flex items-center justify-center gap-2 ' +
            (isAdded
              ? 'bg-green-600 text-white'
              : isAdding
              ? 'bg-clay/70 text-white cursor-wait'
              : 'bg-clay text-white hover:bg-clayd active:scale-[.98]')
          }
        >
          {isAdding && (
            <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24' fill='none'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
              <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z' />
            </svg>
          )}
          {isAdding ? 'Adding…' : isAdded ? '✓ Added to Cart' : 'Add to Cart'}
        </button>

        {/* Error message */}
        {state === 'error' && errorMsg && (
          <p className='text-sm text-red-600'>{errorMsg}</p>
        )}

        {/* Not logged in hint */}
        {!user && (
          <p className='text-xs text-black/50 text-center'>
            Added items are saved to your cart. <button onClick={() => setLoginOpen(true)} className='text-clay underline underline-offset-2'>Sign in</button> to sync and checkout.
          </p>
        )}
      </div>

      {leadTime && (
        <LeadTimeDialog
          open={leadOpen}
          onCancel={() => setLeadOpen(false)}
          onConfirm={onConfirmLead}
          label={leadTime.label}
          fromDays={leadTime.fromDays}
          toDays={leadTime.toDays}
          deliveryDate={leadTime.deliveryDate}
          moq={leadTime.moq}
          unit={leadTime.unit}
          productName={leadTime.productName}
          busy={isAdding}
        />
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
