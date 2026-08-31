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
  const { mode, setMode, lockedByAccount } = useBuyerMode();
  // SIGNED IN => the account decides, and this toggle must not pretend otherwise.
  // Trade pricing is gated server-side on the stored buyer type, so a toggle that
  // appeared to switch a signed-in retail buyer to Business would produce a
  // business-looking page the server then refuses to fill — misleading in exactly
  // the place it matters most. It stays visible (it is how you SEE which state
  // you are in) but is disabled and says why.
  return (
    <div
      className={'inline-flex items-center gap-1.5 text-[12px] ' + className}
      aria-label='Shopping mode (test)'
      data-testid='buyer-mode-toggle'
      data-locked={lockedByAccount ? 'account' : 'off'}
    >
      <span className='hidden sm:inline text-black/50'>
        {lockedByAccount ? 'Your account:' : 'View as:'}
      </span>
      <div className='inline-flex overflow-hidden rounded-full border border-bark/30'>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type='button'
            disabled={lockedByAccount}
            title={
              lockedByAccount
                ? 'Signed in — this follows your account. Change it in Account settings.'
                : undefined
            }
            onClick={() => setMode(opt.value)}
            aria-pressed={mode === opt.value}
            className={
              'px-2.5 py-0.5 font-medium transition-colors ' +
              (mode === opt.value ? 'bg-clay text-white' : 'text-black/60 hover:bg-sand') +
              (lockedByAccount ? ' cursor-not-allowed opacity-70' : '')
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
