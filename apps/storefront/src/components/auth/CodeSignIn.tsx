'use client';
import { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import BuyerTypeQuestion, { type SourcingChoice } from '@/components/account/BuyerTypeQuestion';

// ========================================================================
// SIGN-IN BY EMAILED 6-DIGIT CODE — the ONE implementation.
//
// The Shopify model, and the answer to "should a guest be auto-logged-in after
// paying?" — no. Paying proves someone holds a card; it proves nothing about the
// mailbox they typed at checkout. Proving the MAILBOX is what earns a session,
// and this is the screen that does it.
//
// ── WHY IT LIVES IN ITS OWN FILE (2026-08-16) ───────────────────────────────
// It used to be a private step inside AuthShell, which meant the CHECKOUT
// sign-in modal — the one a returning buyer actually reaches, mid-purchase —
// had no way to offer it and shipped a password box only. For the 42
// passwordless accounts this very lane creates, that box can never be
// satisfied: they had to abandon checkout, find /auth, and come back. Copying
// the screen into the modal would have made a second, subtly different lane;
// extracting it makes both surfaces literally the same code, the same
// AuthProvider.requestCode/loginWithCode calls and the same session.
//
// ── THE OPTIONAL DETAILS STEP (2026-08-17) ──────────────────────────────────
// This lane CREATES ACCOUNTS — verifying a code for an unknown address makes a
// passwordless account on the spot — and it used to collect NOTHING, so a
// code-lane signup produced an account with no name at all while the password
// lane demanded a first name AND a last name. Both ends are fixed here: ONE
// optional "Your name" field, and the optional business opt-in beside it.
//
// It is shown AFTER the code is verified, never before, for two reasons:
//   * before verification we do not know whether an account is being created or
//     an existing one opened, and asking an existing buyer again would be a
//     re-prompt;
//   * asking anything before the code is entered would branch this screen on
//     whether the address exists, which is precisely the enumeration leak the
//     server goes to lengths to avoid.
//
// IT IS SHOWN ONLY WHEN SOMETHING IS ACTUALLY OWED — read back from the server,
// never guessed:
//   * the name, only when the account has none AND none could be lifted off a
//     previous order's shipping address (the server backfills from there, so a
//     buyer is never asked for a name they have already typed);
//   * the opt-in, only when it has never been put in front of them.
// If neither is owed the step does not render at all and the buyer goes straight
// through, which is the common case for a returning buyer.
//
// EVERYTHING ON IT IS OPTIONAL. Continuing without touching anything is a valid
// outcome: it records that we asked, and nothing else. In particular it does NOT
// record a retail choice — nobody chose that.
//
// COPY DISCIPLINE: this screen says "we'll email you a code". It does NOT say or
// imply that passwords no longer exist — they do, the password lane is offered
// beside this one, and neither method replaces the other.
// ========================================================================

const inputCls =
  'w-full rounded-lg border border-bark/40 px-3 py-2.5 text-sm outline-none focus:border-clay transition placeholder:text-black/35';

export default function CodeSignIn({
  email,
  onBack,
  onSuccess,
  /** Shown above the form when the buyer arrived here from a password box that
   *  could never have worked (a passwordless account). Optional — it is a
   *  post-authentication-attempt explanation for a buyer who is already on this
   *  address, not a statement about whether an address exists. */
  reason,
}: {
  email: string;
  /** Omit to render without a back chevron (the checkout modal supplies its own
   *  close affordance). */
  onBack?: () => void;
  onSuccess: () => void;
  reason?: string;
}) {
  const { requestCode, loginWithCode, refresh } = useAuth();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [step, setStep] = useState<'code' | 'declare'>('code');
  const [declareError, setDeclareError] = useState('');
  // What the optional step still has to ask for. Resolved from the server after
  // verification, so the screen never asks for something we already hold.
  const [nameOwed, setNameOwed] = useState(false);
  const [optInOwed, setOptInOwed] = useState(false);
  const [name, setName] = useState('');
  const [business, setBusiness] = useState(false);
  const [sourcing, setSourcing] = useState<SourcingChoice | null>(null);
  const asked = useRef(false);

  const ask = useCallback(async () => {
    setError('');
    setSending(true);
    const res = await requestCode(email);
    setSending(false);
    // The acknowledgement is IDENTICAL whether or not the address has an
    // account, and it is shown verbatim. Rewording it per-case here would
    // re-introduce, in the UI, exactly the enumeration leak the server avoids.
    if (res.ok) setNotice(res.message || 'Check your inbox for a 6-digit code.');
    else setError(res.message || 'Could not send a code right now.');
  }, [email, requestCode]);

  // Ask once on mount. StrictMode double-invokes effects in dev, and every
  // request BURNS one of the five per-address slots and invalidates the previous
  // code — so this guard is correctness, not tidiness.
  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    void ask();
  }, [ask]);

  /** What, if anything, this account still owes us — asked of the SERVER, not
   *  inferred. A fresh fetch rather than the auth context because the context's
   *  user is still the pre-sign-in value in this tick.
   *
   *  `nameKnown` is already the server's ANSWER, not the raw column: it has
   *  looked at the tenant name and, failing that, backfilled from the earliest
   *  order's shipping address. So "the buyer already told us on an order" simply
   *  arrives here as nameKnown:true and the field is never shown. */
  const whatIsOwed = async (): Promise<{ name: boolean; optIn: boolean }> => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (!data?.authenticated) return { name: false, optIn: false };
      const p = (data.profile ?? {}) as { nameKnown?: unknown; buyerTypeAsked?: unknown; buyerTypeSource?: unknown };
      const src = typeof p.buyerTypeSource === 'string' ? p.buyerTypeSource : 'default';
      return {
        name: p.nameKnown !== true,
        // Never asked AND never answered. Either one having happened is enough
        // to leave them alone.
        optIn: p.buyerTypeAsked !== true && src === 'default',
      };
    } catch {
      // Never trap the buyer behind a screen we could not decide was owed.
      return { name: false, optIn: false };
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    const res = await loginWithCode(email, code);
    if (res.ok) {
      const owed = await whatIsOwed();
      setBusy(false);
      if (owed.name || owed.optIn) {
        setNameOwed(owed.name);
        setOptInOwed(owed.optIn);
        setStep('declare');
        return;
      }
      onSuccess();
      return;
    }
    setBusy(false);
    setNotice('');
    setError(res.message || 'That code is not valid or has expired.');
  };

  /**
   * ONE WRITE for the whole optional step. Sends only what the buyer actually
   * gave: an empty name is omitted, an untaken opt-in is omitted, and the
   * sourcing hint only ever travels with the opt-in.
   *
   * A FAILURE HERE MUST NOT STRAND THEM. They are already signed in — the
   * session was minted by the code, not by this form — so a failed write logs
   * the problem on screen and still lets them continue. Nothing on this step is
   * required for the account to work.
   */
  const saveDetails = async () => {
    setDeclareError('');
    setBusy(true);
    const payload: Record<string, string> = {};
    if (name.trim()) payload.name = name.trim();
    if (business) {
      payload.choice = 'business';
      if (sourcing) payload.sourcing = sourcing;
    }
    try {
      const res = await fetch('/api/customer/signup-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success !== true) {
        setBusy(false);
        setDeclareError(data?.message || 'Could not save that. You can set it later from your account.');
        return;
      }
    } catch {
      setBusy(false);
      setDeclareError('Could not save that. You can set it later from your account.');
      return;
    }
    // Pull the new buyer type into the session so the storefront switches on the
    // spot rather than on the next full load.
    try { await refresh(); } catch { /* ignore */ }
    setBusy(false);
    onSuccess();
  };

  if (step === 'declare') {
    return (
      <div data-testid='auth-declare-step'>
        <h3 className='font-medium text-2xl mb-1'>You&apos;re signed in</h3>
        <p className='text-sm text-black/55 mb-5'>
          Two optional things, and we&apos;ll not ask again.
        </p>

        {/* Only when we do not already have one — a buyer who has ordered has
            already typed their name on the shipping address, and asking twice is
            exactly the friction this screen is shedding. */}
        {nameOwed && (
          <div className='mb-4'>
            <label htmlFor='cs-name' className='block text-sm font-bold mb-1.5'>Your name</label>
            <input
              id='cs-name'
              data-testid='signup-name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder='What should we call you?'
              autoComplete='name'
            />
            <p className='mt-1 text-xs text-black/45'>Optional — you can add it later.</p>
          </div>
        )}

        {optInOwed && (
          <BuyerTypeQuestion
            variant='step'
            busy={busy}
            error={declareError}
            business={business}
            onBusinessChange={setBusiness}
            sourcing={sourcing}
            onSourcingChange={setSourcing}
          />
        )}
        {!optInOwed && declareError && <p className='mt-3 text-sm text-red-600'>{declareError}</p>}

        <button
          type='button'
          disabled={busy}
          data-testid='signup-details-continue'
          onClick={() => { void saveDetails(); }}
          className='mt-5 w-full rounded-lg bg-clay text-white py-2.5 text-sm font-medium hover:bg-clayd transition disabled:opacity-60'
        >
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </div>
    );
  }

  return (
    <div data-testid='auth-code-step'>
      <div className='flex items-center gap-2 mb-2'>
        {onBack && (
          <button
            type='button'
            onClick={onBack}
            className='material-symbols-outlined text-black/70 hover:text-clay transition text-lg leading-none'
            aria-label='Back'
          >
            arrow_back_ios
          </button>
        )}
        <h3 className='font-medium text-2xl'>Check your email</h3>
      </div>
      {reason && <p className='text-sm text-black/70 mb-2'>{reason}</p>}
      <p className='text-sm text-black/55 mb-4'>
        We&apos;ve emailed a 6-digit sign-in code to <span className='text-black'>{email}</span>.
        Enter it below to sign in.
      </p>
      <form onSubmit={submit} className='space-y-4'>
        <div>
          <label htmlFor='auth-code' className='block text-sm font-bold mb-1.5'>6-digit code :</label>
          <input
            id='auth-code'
            data-testid='auth-code-input'
            type='text'
            inputMode='numeric'
            autoComplete='one-time-code'
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            className={inputCls + ' tracking-[.5em] font-mono text-lg'}
            placeholder='000000'
          />
        </div>
        {notice && !error && <p className='text-sm text-black/55'>{notice}</p>}
        {error && <p className='text-sm text-red-600' data-testid='auth-code-error'>{error}</p>}
        <button
          type='submit'
          data-testid='auth-code-submit'
          disabled={busy || sending}
          className='w-full rounded-lg bg-clay text-white py-2.5 text-sm font-medium hover:bg-clayd transition disabled:opacity-60'
        >
          {sending ? 'Sending your code…' : busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className='mt-4 text-sm text-black/55'>
        Didn&apos;t get it?{' '}
        <button
          type='button'
          onClick={() => { setCode(''); void ask(); }}
          disabled={sending}
          className='text-clay underline underline-offset-2 disabled:opacity-60'
        >
          Email me a new code
        </button>
        . A new code replaces the old one.
      </p>
    </div>
  );
}
