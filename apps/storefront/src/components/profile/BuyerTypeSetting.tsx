'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// ==========================================================================
// ACCOUNT SETTINGS — "Who do you buy for?", always available.
//
// The declaration is never a trap. Anybody can change it here at any time, with
// no prompt, no threshold, no form and no approval — which is also what makes
// the dashboard offer safe to accept in one tap: the buyer can undo it in one
// tap too.
//
// It writes through the SAME endpoint the declaration step and the dashboard
// offer use, so there is exactly one provenance rule for all three.
// ==========================================================================

// WHAT THE ACCOUNT CURRENTLY IS — never a claim about what the buyer CHOSE.
//
// Signup no longer offers a retail option: it is one optional "I buy for my
// business" tick, and most retail accounts got there by simply not ticking it.
// Telling those people "You chose: For myself" would be putting words in their
// mouth about a decision they never made, so the retail line states the account
// state instead, and only says "you told us" when the provenance says they did.
const BUSINESS_LABEL = 'For my business';
const RETAIL_LABEL_DECLARED = 'For myself';
const RETAIL_LABEL_UNDECLARED = 'No preference set';

export default function BuyerTypeSetting() {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  if (!user) return null;
  const current = (user as { buyerType?: unknown }).buyerType === 'b2b' ? 'b2b' : 'b2c';
  const target = current === 'b2b' ? 'myself' : 'business';
  // 'default' is the one provenance that means nobody ever declared anything.
  const declared = (user as { buyerTypeDeclared?: unknown }).buyerTypeDeclared === true;
  const label =
    current === 'b2b'
      ? BUSINESS_LABEL
      : declared
        ? RETAIL_LABEL_DECLARED
        : RETAIL_LABEL_UNDECLARED;

  const change = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/customer/buyer-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success !== true) {
        setBusy(false);
        setError(data?.message || 'Could not save that right now.');
        return;
      }
    } catch {
      setBusy(false);
      setError('Could not save that right now.');
      return;
    }
    try { await refresh(); } catch { /* ignore */ }
    setBusy(false);
    setSaved(true);
  };

  return (
    <div data-testid='buyer-type-setting' className='mt-6 bg-sand/30 rounded p-6'>
      <p className='text-sm text-gray-500 mb-3'>How you buy</p>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-base font-medium text-gray-900' data-testid='buyer-type-current'>
            {label}
          </p>
          <p className='text-sm text-gray-600'>
            {current === 'b2b'
              ? 'You see fabric by the metre and bulk pricing.'
              : declared
                ? 'You see finished pieces at single-unit prices.'
                : 'You see finished pieces at single-unit prices — the default. Switch any time.'}
          </p>
        </div>
        <button
          type='button'
          disabled={busy}
          data-testid='buyer-type-switch'
          onClick={() => { void change(); }}
          className='rounded-lg border border-clay px-4 py-2 text-sm font-medium text-clay hover:bg-sand transition disabled:opacity-60'
        >
          {busy
            ? 'Saving…'
            : current === 'b2b'
              ? 'Switch to buying for myself'
              : 'I buy for my business'}
        </button>
      </div>
      {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}
      {saved && <p className='mt-2 text-sm text-gray-600'>Saved.</p>}
    </div>
  );
}
