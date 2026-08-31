'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// ==========================================================================
// THE BULK ENTRY POINT — ALWAYS VISIBLE, NEVER REVEALING.
//
// On a product that is sold in bulk, the control that leads to bulk pricing is
// on the page for EVERY caller. What changes is what it SAYS and what it DOES,
// never whether it is there.
//
//   guest    -> 'Sign in for bulk prices'      -> opens the sign-in in place
//   retail   -> 'See bulk prices'              -> offers the switch inline
//   business -> the tier ladder itself         -> rendered by ProductInfoPanel
//
// WHY THIS COMPONENT EXISTS AT ALL. The gate (the wrapper's
// products/trade-pricing.ts) removes the ladder from the response body, which is
// correct and stays exactly as it is. But the first version of the page simply
// drew nothing when the ladder was missing, so a guest looking at a fabric we
// sell by the hundred metres had no way to learn that bulk pricing exists —
// which is the single highest-value moment on the site to lose. A gate is
// supposed to withhold the PRICES, not the fact that there is a price list.
//
// WHAT IT MAY SAY. The existence of bulk pricing, and the minimum quantity —
// a minimum is a fact about how the product is sold, and every buyer already
// sees it. Nothing else. No tier price, no per-unit bulk price, no bulk total,
// no discount percent, not even a count of tiers. It reads the two BOOLEANS the
// redacted payload carries (hasTradePricing / hasBulkPreOrder) and never infers
// existence from a number that should not have been sent.
//
// COPY RULE (§15.1): the internal vocabulary ('b2b'/'b2c') never appears in
// anything a buyer reads here.
// ==========================================================================

export type BulkEntryState = 'loading' | 'guest' | 'retail';

export default function BulkPricingEntry({
  state,
  unit,
  minQty,
  preOrder,
  onSignIn,
  onSwitched,
}: {
  state: BulkEntryState;
  /** product unit, already lowercased ('meter', 'piece'). */
  unit: string;
  /** Smallest bulk quantity — a QUANTITY, already shown openly elsewhere on the
   *  page. Null when the redacted payload carried none. Never a price. */
  minQty?: number | null;
  /** This product also has a bulk pre-order path. */
  preOrder?: boolean;
  onSignIn: () => void;
  /** Called after the account really became a business account, so the page can
   *  fetch the ladder and show it without a reload. */
  onSwitched: () => void;
}) {
  const { refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const qty = typeof minQty === 'number' && minQty > 0 ? minQty : null;
  const plural = (n: number) => unit + (n === 1 ? '' : 's');
  const soldInBulk = qty
    ? 'Sold in bulk from ' + qty + ' ' + plural(qty) + '.'
    : 'This product is sold in bulk.';

  // ONE TAP. The same write the declaration step and account settings use, so
  // there is one provenance rule for all three and the server records this as
  // the buyer changing their own mind. No form, no company details, no approval.
  const switchToBusiness = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/customer/buyer-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: 'business' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success !== true) {
        setBusy(false);
        setError(data?.message || 'Could not switch that right now.');
        return;
      }
    } catch {
      setBusy(false);
      setError('Could not switch that right now.');
      return;
    }
    // Re-read the account first: the ladder is fetched off the SESSION, so the
    // page must not ask for it until the profile really says business.
    try { await refresh(); } catch { /* ignore */ }
    setBusy(false);
    setOpen(false);
    onSwitched();
  };

  // While the session is still resolving the control is already on the page —
  // present, inert, and saying nothing it might have to take back.
  if (state === 'loading') {
    return (
      <button
        type='button'
        disabled
        data-testid='bulk-entry-loading'
        className='flex w-max items-center gap-1 rounded-lg border border-clay/40 px-3 py-2 text-sm font-medium text-clay/60'
      >
        Bulk pricing
      </button>
    );
  }

  if (state === 'guest') {
    return (
      <div className='flex flex-col gap-1'>
        <button
          type='button'
          onClick={onSignIn}
          data-testid='bulk-entry-signin'
          className='flex w-max items-center gap-1 rounded-lg border border-clay px-3 py-2 text-sm font-medium text-clay hover:bg-sand transition-colors'
        >
          Sign in for bulk prices
          <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
        </button>
        <p className='text-xs text-black/50'>
          {soldInBulk} Sign in to see volume pricing{preOrder ? ' and place a bulk pre-order' : ''}.
        </p>
      </div>
    );
  }

  // state === 'retail'
  return (
    <div className='flex flex-col gap-1'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid='bulk-entry-switch'
        className='flex w-max items-center gap-1 rounded-lg border border-clay px-3 py-2 text-sm font-medium text-clay hover:bg-sand transition-colors'
      >
        See bulk prices
        <span className='material-symbols-outlined text-[18px]'>{open ? 'expand_less' : 'chevron_right'}</span>
      </button>
      <p className='text-xs text-black/50'>
        {soldInBulk} Volume pricing is available on business accounts.
      </p>

      {open && (
        <div
          data-testid='bulk-entry-offer'
          className='mt-1 w-full max-w-[420px] rounded-lg border border-clay/40 bg-sand/40 p-4'
        >
          <p className='text-sm font-medium text-black'>Do you buy for your business?</p>
          <p className='mt-1 text-xs text-black/60'>
            Tell us and the volume prices appear right here. Nothing to fill in, no approval to
            wait for, and you can switch back any time from your account.
          </p>
          <div className='mt-3 flex flex-wrap gap-2'>
            <button
              type='button'
              disabled={busy}
              data-testid='bulk-entry-confirm'
              onClick={() => { void switchToBusiness(); }}
              className='rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clayd transition disabled:opacity-60'
            >
              {busy ? 'Switching…' : 'Yes — I buy for my business'}
            </button>
            <button
              type='button'
              disabled={busy}
              data-testid='bulk-entry-cancel'
              onClick={() => setOpen(false)}
              className='rounded-lg border border-bark/40 px-4 py-2 text-sm text-black/70 hover:bg-sand transition disabled:opacity-60'
            >
              Not now
            </button>
          </div>
          {error && <p className='mt-2 text-sm text-red-600' data-testid='bulk-entry-error'>{error}</p>}
        </div>
      )}
    </div>
  );
}
