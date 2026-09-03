'use client';
// Minimal buyer-mode switcher -- THREE-state TEST harness:
//   "Guest" | "Retail (B2C)" | "Business (B2B)"  (Guest = default).
//
// Guest is our real DEFAULT identity: B2B-primary + B2C both (bulk features AND a
// clean retail path stay visible). Retail (B2C) simulates a tailored/logged-in
// retail buyer -- SIMPLIFIED (heavy bulk hidden, "Switch to Business" nudge shown).
// Business (B2B) simulates a tailored business buyer -- bulk-forward. Switching is
// INSTANT: it flips the session cookie/mode and re-gates PDP FEATURES only; prices
// never change.
//
// TODO(next slice): this is a TEST harness, NOT the real UX. The real upgrade will
// be CONTEXTUAL and auth-aware -- guest is the default face, tailoring to B2C/B2B
// happens on login (or via a contextual business-signup that collects company / GST
// / tier eligibility), persisted at the account level. For now this is a pure
// front-end session switch so we can preview all three states.
import { useBuyerMode } from './BuyerModeProvider';
import type { BuyerMode } from '@/lib/buyer-mode';

// PLAIN BUYER LANGUAGE. These labels used to read "Retail (B2C)" / "Business
// (B2B)" — our internal vocabulary, on screen, describing the buyer's own
// account. Since a signed-in buyer now sees this control reflecting their real
// declaration, it has to say what they said: "For myself" / "For my business",
// the same two phrases the question itself uses.
const OPTIONS: { value: BuyerMode; label: string }[] = [
  { value: 'guest', label: 'Not signed in' },
  { value: 'b2c', label: 'For myself' },
  { value: 'b2b', label: 'For my business' },
];

export default function BuyerModeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode, isBusinessAccount } = useBuyerMode();

  // Non-business users (retail buyers / guests) should NEVER see a mode switch
  if (!isBusinessAccount) {
    return null;
  }

  return (
    <div
      className={'inline-flex items-center gap-2 text-[13px] ' + className}
      aria-label='Business view mode'
      data-testid='buyer-mode-toggle'
    >
      <span className='text-gray-500 font-normal select-none'>
        View as:
      </span>
      <div className='inline-flex items-center rounded-full border border-gray-300 bg-white p-0.5 shadow-2xs'>
        <button
          type='button'
          onClick={() => setMode('b2b')}
          aria-pressed={mode === 'b2b'}
          className={
            'px-3 py-1 rounded-full text-xs sm:text-[13px] font-medium transition-all ' +
            (mode === 'b2b'
              ? 'bg-[#7D5B20] text-white shadow-xs'
              : 'text-gray-700 hover:text-black hover:bg-gray-100/70')
          }
        >
          For my business
        </button>
        <button
          type='button'
          onClick={() => setMode('b2c')}
          aria-pressed={mode === 'b2c'}
          className={
            'px-3 py-1 rounded-full text-xs sm:text-[13px] font-medium transition-all ' +
            (mode === 'b2c'
              ? 'bg-[#7D5B20] text-white shadow-xs'
              : 'text-gray-700 hover:text-black hover:bg-gray-100/70')
          }
        >
          For myself (Retail)
        </button>
      </div>
    </div>
  );
}
