'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// ==========================================================================
// THE ORDER-DASHBOARD OFFER — "you order like a business; want the business
// view?"
//
// ── IT OFFERS. IT NEVER FLIPS. ────────────────────────────────────────────
// Crossing a threshold is not consent. The server computes whether this retail
// account's own order history looks like a business (10+ finished units in one
// order, or Rs 50,000 lifetime — one named constant in the wrapper, tunable in
// one place) and says so. The account changes ONLY when the buyer taps, and the
// tap goes through the SAME write every other answer uses, with the same
// provenance, so a self-upgrade here is indistinguishable from one made in
// account settings — and equally reversible.
//
// ── DISMISSAL STICKS ──────────────────────────────────────────────────────
// A dismissal is recorded server-side, not in this component and not in the
// browser. It has to survive a reload, a new session and a different device;
// anything less is an offer that keeps coming back, which is the behaviour
// everybody hates.
//
// One tap, no form, no approval: there is no company name, no tax id and no
// verification anywhere in this flow.
// ==========================================================================

interface PromptState {
  success?: boolean;
  shouldPrompt?: boolean;
  reason?: 'units' | 'spend' | null;
  signals?: { maxFinishedUnitsInOneOrder?: number; lifetimeSpendInr?: number };
  threshold?: { finishedUnitsInSingleOrder?: number; lifetimeSpendInr?: number };
}

export default function BuyerTypePrompt() {
  const { refresh } = useAuth();
  const [state, setState] = useState<PromptState | null>(null);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const reported = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/customer/buyer-type/prompt', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (alive) setState(d as PromptState); })
      .catch(() => { if (alive) setState({ shouldPrompt: false }); });
    return () => { alive = false; };
  }, []);

  const record = useCallback(async (action: 'shown' | 'dismissed') => {
    try {
      await fetch('/api/customer/buyer-type/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch { /* telemetry must never break the page */ }
  }, []);

  // Record the DISPLAY once, when it actually renders — not when the component
  // mounts — so 'shown' means shown.
  useEffect(() => {
    if (state?.shouldPrompt && !reported.current) {
      reported.current = true;
      void record('shown');
    }
  }, [state, record]);

  if (!state?.shouldPrompt || gone) return null;

  const accept = async () => {
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
    // Pull the new buyer type into the session so trade pricing unlocks without
    // a reload — the gate is server-side, so the page must re-ask for it.
    try { await refresh(); } catch { /* ignore */ }
    setBusy(false);
    setDone(true);
  };

  const dismiss = async () => {
    setGone(true);
    await record('dismissed');
  };

  const units = state.signals?.maxFinishedUnitsInOneOrder ?? 0;
  const spend = state.signals?.lifetimeSpendInr ?? 0;
  const because =
    state.reason === 'units'
      ? 'You have ordered ' + units + ' pieces in a single order.'
      : 'You have ordered over Rs ' + spend.toLocaleString('en-IN') + ' with us.';

  if (done) {
    return (
      <div
        data-testid='buyer-type-prompt-done'
        className='mb-6 rounded-lg border border-clay/30 bg-sand/40 px-4 py-3 text-sm text-black/70'
      >
        <span className='material-symbols-outlined align-middle text-clay text-[18px] mr-1.5'>check_circle</span>
        You&apos;re set up as a business account. Fabric by the metre and bulk pricing are now shown on
        every product.
      </div>
    );
  }

  return (
    <div
      data-testid='buyer-type-prompt'
      className='mb-6 rounded-lg border border-clay/30 bg-sand/40 px-4 py-4'
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-sm font-medium text-black'>Do you buy for a business?</p>
          <p className='mt-1 text-sm text-black/60'>
            {because} Business accounts see fabric by the metre and bulk pricing. No forms, no
            approval — and you can switch back any time.
          </p>
          {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <button
              type='button'
              disabled={busy}
              data-testid='buyer-type-prompt-accept'
              onClick={() => { void accept(); }}
              className='rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clayd transition disabled:opacity-60'
            >
              {busy ? 'Switching…' : 'Yes, I buy for a business'}
            </button>
            <button
              type='button'
              disabled={busy}
              data-testid='buyer-type-prompt-dismiss'
              onClick={() => { void dismiss(); }}
              className='rounded-lg px-3 py-2 text-sm text-black/55 underline underline-offset-2 hover:text-clay disabled:opacity-60'
            >
              No thanks
            </button>
          </div>
        </div>
        <button
          type='button'
          aria-label='Dismiss'
          disabled={busy}
          onClick={() => { void dismiss(); }}
          className='material-symbols-outlined text-black/35 hover:text-black/60 text-[20px] leading-none'
        >
          close
        </button>
      </div>
    </div>
  );
}
