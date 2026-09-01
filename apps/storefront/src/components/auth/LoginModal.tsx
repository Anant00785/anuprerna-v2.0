'use client';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import CodeSignIn from './CodeSignIn';
import { SOCIAL_LOGIN_ENABLED } from '../../lib/flags';

// =====================================================================================
// SIGN-IN MODAL — the in-place sign-in a buyer reaches from the cart/checkout,
// really hitting AuthProvider (BFF). Includes a Google/social button placeholder:
// social OAuth needs the redirect domain configured for this demo URL, which it is
// not yet, so the button alerts.
//
// ── WHAT CHANGED (2026-08-16): IT GREW THE CODE LANE ────────────────────────────
// This modal was PASSWORD-ONLY, and it is the only sign-in surface inside
// checkout. That made it a dead end for the buyers most likely to be standing in
// front of it:
//   * the 42 PASSWORDLESS accounts — the shape /auth/email-code/* creates — have
//     no password that could ever be right, so every attempt here 401'd;
//   * anyone who simply never set one had to abandon checkout and go find /auth.
// Now the code lane is offered ALONGSIDE the password box (never instead of it —
// an account with a password keeps working exactly as before), and a 401 that
// comes back flagged `passwordless: true` switches to it automatically rather
// than making the buyer read an error and guess.
//
// The code screen is the SAME component /auth renders (CodeSignIn), driven by the
// same AuthProvider.requestCode/loginWithCode, so this is not a second sign-in
// lane — it is the same one, reachable without leaving the purchase.
//
// ENUMERATION: nothing here is conditioned on whether an address has an account.
// "Email me a code instead" is always offered, for every address, before anything
// has been typed; the code request itself answers identically either way. The one
// message that IS specific (`passwordless`) arrives only after a password attempt
// on that exact address and tells the buyer about the account they just tried to
// open — it is not readable for an arbitrary third-party address without one.
// =====================================================================================

import { useBuyerMode } from '@/components/BuyerModeProvider';

export default function LoginModal({ open, onClose, defaultEmail }: { open: boolean; onClose: () => void; defaultEmail?: string }) {
  const { login } = useAuth();
  const { mode: currentBuyerMode, setMode: setBuyerMode } = useBuyerMode();
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [codeReason, setCodeReason] = useState('');

  useEffect(() => {
    if (open && defaultEmail) setEmail(defaultEmail);
  }, [open, defaultEmail]);

  // A fresh open always starts on the password screen; leaving the modal on the
  // code step would otherwise fire a code request the buyer never asked for.
  useEffect(() => {
    if (!open) {
      setMode('password');
      setCodeReason('');
      setError('');
      setPassword('');
    }
  }, [open]);

  if (!open) return null;

  const here = typeof window === 'undefined'
    ? ''
    : window.location.pathname + window.location.search;
  const registerHref = here ? '/auth?redirect=' + encodeURIComponent(here) : '/auth';

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) {
      onClose();
      return;
    }
    if (res.passwordless) {
      setCodeReason('This account signs in with an emailed code, not a password.');
      setMode('code');
      return;
    }
    setError(res.message || 'Login failed.');
  };

  const useCode = () => {
    if (!emailLooksValid) {
      setError('Enter your email first and we’ll send you a code.');
      return;
    }
    setError('');
    setCodeReason('');
    setMode('code');
  };

  const social = () => {
    alert('Social sign-in is not enabled for this demo (OAuth redirect domain not configured). Please use email sign-in.');
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden />
      <div data-testid='login-modal' className='relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6 sm:p-8'>
        <button
          aria-label='Close'
          onClick={onClose}
          className='absolute right-4 top-4 text-black/50 hover:text-black'
        >
          <span className='material-symbols-outlined'>close</span>
        </button>

        {mode === 'code' ? (
          <div data-testid='login-modal-code'>
            <CodeSignIn
              email={email.trim().toLowerCase()}
              reason={codeReason || undefined}
              onBack={() => { setMode('password'); setCodeReason(''); }}
              onSuccess={onClose}
            />
          </div>
        ) : (
          <>
            <h2 className='text-2xl font-medium text-clay mb-1'>
              {currentBuyerMode === 'b2b' ? 'Business Wholesale Sign In' : 'Sign in'}
            </h2>
            <p className='text-sm text-black/60 mb-4'>
              {currentBuyerMode === 'b2b'
                ? 'Access wholesale tier pricing, volume discounts and custom orders.'
                : 'Access your orders, wishlist and faster checkout.'}
            </p>

            {/* Account Type Selector */}
            <div className='mb-5 p-1 bg-[#F5F2ED] rounded-xl flex items-center border border-bark/15 shadow-inner'>
              <button
                type='button'
                onClick={() => setBuyerMode('b2c')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  currentBuyerMode !== 'b2b'
                    ? 'bg-white text-[#7D5B20] shadow-sm font-semibold'
                    : 'text-black/55 hover:text-black'
                }`}
              >
                <span className='material-symbols-outlined text-[15px]'>person</span>
                For myself
              </button>
              <button
                type='button'
                onClick={() => setBuyerMode('b2b')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  currentBuyerMode === 'b2b'
                    ? 'bg-[#7D5B20] text-white shadow-sm font-semibold'
                    : 'text-black/55 hover:text-black'
                }`}
              >
                <span className='material-symbols-outlined text-[15px]'>domain</span>
                For my business
              </button>
            </div>

            <form onSubmit={submit} className='space-y-4'>
              <div>
                <label className='block text-sm text-black/70 mb-1'>Email</label>
                <input
                  type='email'
                  data-testid='login-modal-email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full rounded-lg border border-bark/40 px-3 py-2 outline-none focus:border-clay'
                  placeholder='you@example.com'
                />
              </div>
              <div>
                <label className='block text-sm text-black/70 mb-1'>Password</label>
                <input
                  type='password'
                  data-testid='login-modal-password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full rounded-lg border border-bark/40 px-3 py-2 outline-none focus:border-clay'
                  placeholder='••••••••'
                />
              </div>
              {error && <p className='text-sm text-red-600'>{error}</p>}
              <button
                type='submit'
                data-testid='login-modal-submit'
                disabled={busy}
                className='w-full rounded-lg bg-clay text-white py-2.5 font-medium hover:bg-clayd transition disabled:opacity-60'
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {/* Offered to EVERY buyer, before anything is typed — no branch on
                whether the address exists, so nothing here can leak that. */}
            <button
              type='button'
              onClick={useCode}
              data-testid='login-modal-use-code'
              className='mt-3 w-full rounded-lg border border-clay/40 py-2.5 text-sm font-medium text-clay hover:bg-sand transition'
            >
              Email me a code instead
            </button>
            <p className='mt-2 text-center text-xs text-black/45'>
              We&apos;ll send a 6-digit code to your email. Either way signs you in.
            </p>

            {SOCIAL_LOGIN_ENABLED && (
              <>
                <div className='my-5 flex items-center gap-3 text-xs text-black/40'>
                  <span className='h-px flex-1 bg-black/10' /> or <span className='h-px flex-1 bg-black/10' />
                </div>

                <button
                  onClick={social}
                  className='w-full rounded-lg border border-bark/40 py-2.5 flex items-center justify-center gap-2 hover:bg-sand transition'
                  title='Social sign-in not enabled for this demo'
                >
                  <img
                    src='https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
                    alt=''
                    width={18}
                    height={18}
                  />
                  <span className='text-sm'>Continue with Google</span>
                </button>
              </>
            )}

            <p className='mt-5 text-center text-xs text-black/50'>
              No account?{' '}
              <a href={registerHref} data-testid='login-modal-register' className='text-clay hover:underline'>Create one</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
