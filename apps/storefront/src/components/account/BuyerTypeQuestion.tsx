'use client';
import { useState } from 'react';

// ==========================================================================
// ONE OPTIONAL OPT-IN — "I buy for my business".
//
// This used to be a QUESTION with two cards and a skip link: "Who do you buy
// for?" -> For myself | For my business | Prefer not to say. It is now a single
// optional tick, because two of those three answers were never worth asking for:
//
//   * NOBODY SELF-IDENTIFIES AS RETAIL. "For myself" collected no information —
//     it is what the site does by default — while costing every buyer a decision
//     on the way in.
//   * NOT ANSWERING IS ALREADY THE NEUTRAL STATE. A "prefer not to say" button
//     is a second way of spelling the same thing, so it earned its removal too.
//
// What is left is the only answer that changes anything: the buyer telling us
// they buy for a business. Taking it makes the account a business account.
// NOT taking it records NOTHING about them — the account behaves as the default
// (the retail view, no tier pricing) and the stored provenance still says nobody
// ever declared anything, which stays distinguishable from someone who actively
// chose retail in account settings.
//
// It must read as SECONDARY to the account fields it sits beside. It is not a
// gate, not a step, and never blocks a signup.
//
// ── THE NESTED SUB-CHOICE ─────────────────────────────────────────────────
// Ticking it reveals ONE more optional control: what they mostly source. It is
// never shown to anyone else and never becomes a step of its own. It affects
// EMPHASIS only — what the trade homepage leads with, and later follow-up
// relevance. It gates NO catalogue, price, tier or MOQ: a business buyer who
// says "mostly fabric" still gets full trade pricing on finished goods.
//
// COPY RULE: the internal vocabulary ('b2c'/'b2b', 'wholesale', 'retail') never
// appears on this screen. The buyer reads about themselves, not about our
// database columns.
// ==========================================================================

/** Kept as the three words the WRITE path speaks. The screen now only ever
 *  produces 'business' or nothing — 'myself' still exists because account
 *  settings can switch back, and 'skip' because older callers may send it. */
export type BuyerChoice = 'myself' | 'business' | 'skip';

export type SourcingChoice = 'fabric' | 'finished' | 'both';

const SOURCING: { value: SourcingChoice; label: string }[] = [
  { value: 'fabric', label: 'Mostly fabric' },
  { value: 'finished', label: 'Mostly finished goods' },
  { value: 'both', label: 'Both' },
];

export default function BuyerTypeQuestion({
  /** 'inline' sits inside a bigger form (the signup screen); 'step' is a panel
   *  of its own, where the parent supplies the continue button. */
  variant = 'inline',
  business,
  onBusinessChange,
  sourcing,
  onSourcingChange,
  busy = false,
  error = '',
}: {
  variant?: 'inline' | 'step';
  business?: boolean;
  onBusinessChange?: (v: boolean) => void;
  sourcing?: SourcingChoice | null;
  onSourcingChange?: (v: SourcingChoice | null) => void;
  busy?: boolean;
  error?: string;
}) {
  const [localBusiness, setLocalBusiness] = useState(false);
  const [localSourcing, setLocalSourcing] = useState<SourcingChoice | null>(null);
  const isBusiness = business !== undefined ? business : localBusiness;
  const pickedSourcing = sourcing !== undefined ? sourcing : localSourcing;

  const toggle = () => {
    const next = !isBusiness;
    setLocalBusiness(next);
    onBusinessChange?.(next);
    // Unticking takes the sub-choice with it — it only ever meant anything as a
    // qualifier on the opt-in.
    if (!next) {
      setLocalSourcing(null);
      onSourcingChange?.(null);
    }
  };

  const pickSourcing = (v: SourcingChoice) => {
    const next = pickedSourcing === v ? null : v;
    setLocalSourcing(next);
    onSourcingChange?.(next);
  };

  return (
    <div data-testid='buyer-type-question'>
      <button
        type='button'
        role='checkbox'
        aria-checked={isBusiness}
        disabled={busy}
        data-testid='buyer-type-business'
        onClick={toggle}
        className={
          'w-full rounded-lg border px-4 py-3 text-left transition flex items-start gap-3 disabled:opacity-60 ' +
          (isBusiness ? 'border-clay bg-sand' : 'border-bark/30 hover:bg-sand/50')
        }
      >
        <span
          aria-hidden
          className={
            'mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded border transition ' +
            (isBusiness ? 'border-clay bg-clay text-white' : 'border-bark/50 bg-white')
          }
        >
          {isBusiness && <span className='material-symbols-outlined text-[14px] leading-none'>check</span>}
        </span>
        <span>
          <span className='block text-sm font-medium text-black'>I buy for my business</span>
          <span className='block text-xs text-black/55'>Fabric by the metre, or finished goods in bulk</span>
        </span>
      </button>

      {/* Revealed only by the tick. Optional, single tap, and skipping it must
          never hold up an account being created. */}
      {isBusiness && (
        <div className='mt-3' data-testid='sourcing-interest'>
          <p className='text-xs text-black/55 mb-2'>What do you mostly source? (optional)</p>
          <div className='flex flex-wrap gap-2'>
            {SOURCING.map((o) => {
              const active = pickedSourcing === o.value;
              return (
                <button
                  key={o.value}
                  type='button'
                  disabled={busy}
                  aria-pressed={active}
                  data-testid={'sourcing-' + o.value}
                  onClick={() => pickSourcing(o.value)}
                  className={
                    'rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-60 ' +
                    (active ? 'border-clay bg-clay text-white' : 'border-bark/40 text-black/70 hover:bg-sand')
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className='mt-2 text-[11px] text-black/40'>
            This only changes what we show first. You can buy anything either way.
          </p>
        </div>
      )}

      {variant === 'step' && (
        <p className='mt-3 text-xs text-black/45'>
          Leave it untouched if it does not apply. You can change this any time from your account.
        </p>
      )}

      {error && <p className='mt-3 text-sm text-red-600' data-testid='buyer-type-error'>{error}</p>}
    </div>
  );
}
