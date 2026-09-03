'use client';
import { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthProvider';
import SocialButton from './SocialButton';
import { SOCIAL_LOGIN_ENABLED } from '../../lib/flags';
import ResendVerificationForm from './ResendVerificationForm';
// The code step lives in its own file so the CHECKOUT sign-in modal renders the
// SAME component, not a copy — see components/auth/CodeSignIn.tsx.
import CodeSignIn from './CodeSignIn';
// The SAME question the code lane asks after verification — one component,
// so the two account-creating lanes cannot ask two different questions.
import BuyerTypeQuestion, { type SourcingChoice } from '@/components/account/BuyerTypeQuestion';
import { useBuyerMode } from '@/components/BuyerModeProvider';
import Link from 'next/link';

// Hero image URL — same asset the live Angular site uses
const AUTH_HERO = 'https://anuprerna.com/assets/img/auth.jpeg';

// ---- Shared field style ----
const inputCls =
  'w-full rounded-lg border border-bark/40 px-3 py-2.5 text-sm outline-none focus:border-clay transition placeholder:text-black/35';

// Back-chevron used on every stepped sub-screen (ports the Angular arrow_back_ios).
function BackChevron({ onClick }: { onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='material-symbols-outlined text-black/70 hover:text-clay transition text-lg leading-none'
      aria-label='Back'
    >
      arrow_back_ios
    </button>
  );
}

// ========================================================================
// STEP 1 — Email-first input (ports auth-email-method.component)
// 'Continue with email' -> emits the email upward for the tenant check.
// ========================================================================
function EmailStep({
  onBack,
  onContinue,
  busy,
  error,
  defaultEmail = '',
}: {
  onBack: () => void;
  onContinue: (email: string) => void;
  busy: boolean;
  error: string;
  /** Pre-filled address — used by the POST-PURCHASE account invite, which links
   *  here as /auth?email=<the guest's email>. */
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [touched, setTouched] = useState(false);
  const valid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) onContinue(email.trim().toLowerCase());
  };

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <BackChevron onClick={onBack} />
        <h3 className='font-medium text-2xl'>Continue with email</h3>
      </div>
      <p className='text-sm text-black/55 mb-4'>
        We&apos;ll email you a 6-digit code to sign in. If you already have a password, you can use
        that instead.
      </p>
      <form onSubmit={submit} className='space-y-4'>
        <div>
          <label htmlFor='auth-email' className='block text-sm font-bold mb-1.5'>Email :</label>
          <input
            id='auth-email'
            type='email'
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
            onBlur={() => setTouched(true)}
            className={inputCls}
            placeholder='Enter your email'
            autoComplete='email'
          />
          {touched && !valid && (
            <p className='text-red-500 text-xs mt-1'>A valid email id is required.</p>
          )}
        </div>
        {error && <p className='text-sm text-red-600'>{error}</p>}
        <button
          type='submit'
          disabled={busy}
          className='w-full rounded-lg bg-clay text-white py-2.5 text-sm font-medium hover:bg-clayd transition disabled:opacity-60'
        >
          {busy ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

// ========================================================================
// STEP 2a — Password-only login (ports login.component)
// Shown when the email is registered + verified. On a wrong password the
// heading flips to 'Incorrect Password' and a Google fallback appears.
// ========================================================================
function PasswordStep({
  email,
  onBack,
  onSuccess,
  onUseCode,
}: {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
  /** Switch to PASSWORDLESS sign-in. Offered here, not instead of the password
   *  box: an account that has a password keeps working exactly as it did. */
  onUseCode: () => void;
}) {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loginFailure, setLoginFailure] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password is required. Minimum 8 characters.');
      return;
    }
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) {
      onSuccess();
    } else {
      const msg = res.message || 'Login failed.';
      setError(msg);
      if (/password/i.test(msg)) setLoginFailure(true);
    }
  };

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <BackChevron onClick={onBack} />
        <h3 className='font-medium text-2xl'>{loginFailure ? 'Incorrect Password' : 'Sign in with email'}</h3>
      </div>
      {!loginFailure ? (
        <p className='text-sm text-black/55 mb-4'>
          Seems like you already have an account with <span className='text-black'>{email}</span>.
          Enter your password to sign in
        </p>
      ) : (
        <p className='text-sm text-black/55 mb-4'>
          You have entered the wrong password for your account with {email}. Retry with another
          password or continue using a different sign-in option or reset your password
        </p>
      )}
      <form onSubmit={submit} className='space-y-4'>
        <div>
          <label htmlFor='auth-password' className='block text-sm font-bold mb-1.5'>Password :</label>
          <div className='w-full border border-bark/40 rounded-lg flex items-center justify-between pr-2 focus-within:border-clay transition'>
            <input
              id='auth-password'
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2.5 text-sm outline-none bg-transparent placeholder:text-black/35'
              placeholder='Enter your password'
              autoComplete='current-password'
            />
            <button
              type='button'
              onClick={() => setShow((s) => !s)}
              className='material-symbols-outlined text-black/40 cursor-pointer text-lg'
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? 'visibility_off' : 'visibility'}
            </button>
          </div>
        </div>
        <div className='text-right'>
          <Link href='/auth/forget-password' className='text-sm text-clay hover:underline'>
            Forgot Password?
          </Link>
        </div>
        {error && <p className='text-sm text-red-600'>{error}</p>}
        <button
          type='submit'
          disabled={busy}
          className='w-full rounded-lg bg-clay text-white py-2.5 text-sm font-medium hover:bg-clayd transition disabled:opacity-60'
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className='mt-4 pt-4 border-t border-bark/20'>
        <button
          type='button'
          onClick={onUseCode}
          data-testid='use-code-instead'
          className='w-full rounded-lg border border-bark/40 py-2.5 flex items-center justify-center gap-2.5 hover:bg-sand transition text-sm font-medium'
        >
          <span className='material-symbols-outlined text-base text-clay'>mail</span>
          Email me a code instead
        </button>
        <p className='mt-2 text-xs text-black/45 text-center'>
          We&apos;ll send a 6-digit code to {email}. Your password still works too.
        </p>
      </div>

      {SOCIAL_LOGIN_ENABLED && loginFailure && (
        <div className='mt-4'>
          <SocialButton />
        </div>
      )}
    </div>
  );
}

// ========================================================================
// STEP 2b — Register (ports register.component)
// Shown when the email is NOT registered. First/Last side-by-side, password +
// confirm with eye toggles. On success -> verification-link state.
// ========================================================================
function RegisterStep({
  email,
  onBack,
  onRegistered,
  onUseCode,
}: {
  email: string;
  onBack: () => void;
  onRegistered: () => void;
  /** Skip inventing a password entirely — verifying an emailed code creates the
   *  account and signs the buyer in, which is strictly MORE proof of the mailbox
   *  than this form collects. */
  onUseCode: () => void;
}) {
  const { register } = useAuth();
  // ONE NAME FIELD. The database only ever had one column
  // (relational.loom_tenant.user_name); the first/last split lived in this form
  // and nowhere else, and its "each part is 3+ characters" rule rejected Li Wei,
  // Bo, and everyone who goes by a single name.
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // THE PASSWORD IS THE SECONDARY LANE, so its fields start COLLAPSED. The
  // screen previously showed a code button and two password boxes at once,
  // which read as "give us a code AND a password". Collapsing them makes the
  // recommended path the obvious one without removing the other: the lane is
  // fully functional, one tap away, and the copy never implies passwords are
  // gone.
  const [phone, setPhone] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [business, setBusiness] = useState(false);
  const [sourcing, setSourcing] = useState<SourcingChoice | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password is required. Minimum 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Confirm Password does not match with Password');
      return;
    }
    setBusy(true);
    const res = await register({
      name: fullName.trim().replace(/\s+/g, ' '),
      email,
      phone: phone.trim(),
      password,
      buyerChoice: business ? 'business' : 'myself',
      ...(business && sourcing ? { sourcing } : {}),
    });
    setBusy(false);
    if (res.ok) {
      onRegistered();
    } else {
      setError(res.message || 'Registration failed. Please try again.');
    }
  };

  const resend = async () => {
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {});
  };

  return (
    <div>
      <div data-testid='register-step' className='flex items-center gap-2 mb-2'>
        <BackChevron onClick={onBack} />
        <h3 className='font-medium text-2xl'>Create your account</h3>
      </div>
      <p className='text-sm text-black/55 mb-5'>
        Creating account for <span className='text-black font-medium'>{email}</span>
      </p>

      <form onSubmit={submit} className='space-y-4'>
        <div>
          <label htmlFor='r-name' className='block text-sm font-semibold mb-1'>Full Name *</label>
          <input
            id='r-name'
            data-testid='register-name'
            type='text'
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
            placeholder='e.g. Anant Kumar'
            autoComplete='name'
          />
        </div>

        <div>
          <label htmlFor='r-phone' className='block text-sm font-semibold mb-1'>Phone Number</label>
          <input
            id='r-phone'
            data-testid='register-phone'
            type='tel'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            placeholder='+91 98765 43210'
            autoComplete='tel'
          />
        </div>

        <div>
          <label htmlFor='r-pw' className='block text-sm font-semibold mb-1'>Password *</label>
          <div className='w-full border border-bark/40 rounded-lg flex items-center justify-between pr-2 focus-within:border-clay transition bg-white'>
            <input
              id='r-pw'
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2.5 text-sm outline-none bg-transparent placeholder:text-black/35'
              placeholder='Enter password (min. 6 characters)'
              autoComplete='new-password'
            />
            <button
              type='button'
              onClick={() => setShowPw((s) => !s)}
              className='material-symbols-outlined text-black/40 cursor-pointer text-lg'
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'visibility_off' : 'visibility'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor='r-cpw' className='block text-sm font-semibold mb-1'>Confirm Password *</label>
          <div className='w-full border border-bark/40 rounded-lg flex items-center justify-between pr-2 focus-within:border-clay transition bg-white'>
            <input
              id='r-cpw'
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className='w-full px-3 py-2.5 text-sm outline-none bg-transparent placeholder:text-black/35'
              placeholder='Re-enter password'
              autoComplete='new-password'
            />
            <button
              type='button'
              onClick={() => setShowConfirm((s) => !s)}
              className='material-symbols-outlined text-black/40 cursor-pointer text-lg'
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? 'visibility_off' : 'visibility'}
            </button>
          </div>
          {confirm && password !== confirm && (
            <p className='text-red-500 text-xs mt-1'>Confirm Password does not match with Password</p>
          )}
        </div>

        <div className='pt-2 border-t border-bark/15'>
          <BuyerTypeQuestion
            variant='inline'
            business={business}
            onBusinessChange={setBusiness}
            sourcing={sourcing}
            onSourcingChange={setSourcing}
          />
        </div>

        {error && <p className='text-sm text-red-600'>{error}</p>}

        <button
          type='submit'
          disabled={busy}
          data-testid='register-submit'
          className='w-full rounded-lg bg-clay text-white py-2.5 text-sm font-semibold hover:bg-clayd transition disabled:opacity-60 cursor-pointer shadow-sm'
        >
          {busy ? 'Creating account…' : 'Create Account & Sign In'}
        </button>
      </form>

      <div className='mt-4 pt-4 border-t border-bark/15 text-center'>
        <button
          type='button'
          onClick={onUseCode}
          data-testid='register-use-code'
          className='text-xs text-clay font-medium hover:underline inline-flex items-center gap-1 cursor-pointer'
        >
          <span className='material-symbols-outlined text-[14px]'>mail</span>
          Or sign in using 6-digit email code instead
        </button>
      </div>
    </div>
  );
}

// ========================================================================
// Main auth shell — stateful EMAIL-FIRST flow (ports authentication.component)
// landing -> email -> [server tenant check] -> password | register | verify
// ========================================================================
type Step = 'landing' | 'email' | 'password' | 'register' | 'verify' | 'code';

export default function AuthShell() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  // WHERE TO GO AFTER SIGNING IN — and ONLY ever back into this site.
  // The bulk entry point on a product page now links here as
  // /auth?redirect=/fabric/<slug>, so a buyer who came for bulk prices is
  // returned to the product they were reading instead of a generic page. A raw
  // ?redirect= would be an open redirect, and a sign-in screen is exactly where
  // that gets phished: '//evil.example' and 'https://evil.example' both navigate
  // off-site. Only a single-slash absolute path is honoured; anything else falls
  // back to the profile.
  const rawRedirect = params.get('redirect') || '';
  const redirect = /^[/][^/\\]/.test(rawRedirect) ? rawRedirect : '/profile';
  // POST-PURCHASE ACCOUNT INVITE (2026-08-16): a guest who has just checked out
  // can be linked here with ?email=<theirs>; skip the landing screen and seed the
  // address so creating an account is two clicks, never a re-type. Purely
  // optional — /auth with no params behaves exactly as before.
  const invitedEmail = params.get('email') || '';
  // POST-PURCHASE, PASSWORDLESS (2026-08-16): the confirmation screen links here
  // as /auth?email=<theirs>&mode=code, so a guest who just paid lands directly on
  // the code screen and never sees a password field at all.
  const codeMode = params.get('mode') === 'code' && !!invitedEmail;

  const [step, setStep] = useState<Step>(codeMode ? 'code' : invitedEmail ? 'email' : 'landing');
  const { mode: currentBuyerMode, setMode: setBuyerMode } = useBuyerMode();

  // AUTO-REDIRECT, WITH ONE EXCEPTION.
  //
  // "Already signed in? Leave /auth" is the right default. But the code lane
  // signs the buyer in and THEN, for a brand-new account, asks "Who do you buy
  // for?" on the same screen — so for a moment the buyer is authenticated and
  // still has something to do here. Left unguarded, this effect fired the
  // instant the session appeared and navigated the declaration step off the
  // screen before it could render; the question was never asked, and the
  // account kept provenance 'default' forever. Measured, then fixed.
  //
  // So while the code step owns the flow, IT decides when the buyer is done and
  // calls onSuccess -> handleLoginSuccess. Every other step keeps the old
  // behaviour exactly.
  useEffect(() => {
    if (step === 'code') return;
    if (!loading && user) {
      router.replace(redirect);
    }
  }, [loading, user, router, redirect, step]);
  const [email, setEmail] = useState(codeMode ? invitedEmail.trim().toLowerCase() : '');
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  // Tenant check -> branch (ports _verifyTenant + _continueAuthFlow).
  const onEmailContinue = async (value: string) => {
    setCheckError('');
    setChecking(true);
    setEmail(value);
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setCheckError(data?.message || 'Could not verify the email. Please try again.');
        return;
      }
      if (data.registered) {
        // A PASSWORDLESS account (created by a previous code sign-in) has no
        // password that could ever be right, so sending it to the password screen
        // would be a dead end. Straight to the code screen instead.
        if (data.passwordless) setStep('code');
        // registered: verified -> password screen; unverified -> resend-verify screen
        else setStep(data.emailVerified ? 'password' : 'verify');
      } else {
        // new email -> register screen
        setStep('register');
      }
    } catch {
      setCheckError('Network error. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLoginSuccess = () => router.replace(redirect);
  const resetToLanding = () => {
    setStep('landing');
    setCheckError('');
  };

  if (loading) {
    return (
      <main className='min-h-[80vh] flex items-center justify-center'>
        <span className='material-symbols-outlined animate-spin text-clay text-3xl'>progress_activity</span>
      </main>
    );
  }

  const cardContent = (
    <>
      {/* Brand mark */}
      <div className='flex items-center gap-3 mb-5'>
        <div className='w-9 h-9 rounded-full border border-clay flex items-center justify-center shrink-0'>
          <span className='text-clay font-semibold text-base leading-none'>A</span>
        </div>
        <span className='text-xs font-medium tracking-[.22em] text-clay uppercase'>Anuprerna</span>
      </div>

      {/* Account Type Selector: Personal vs Business */}
      <div className='mb-6 p-1 bg-[#F5F2ED] rounded-xl flex items-center border border-bark/15 shadow-inner'>
        <button
          type='button'
          onClick={() => setBuyerMode('b2c')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            currentBuyerMode !== 'b2b'
              ? 'bg-white text-[#7D5B20] shadow-sm font-semibold'
              : 'text-black/55 hover:text-black'
          }`}
        >
          <span className='material-symbols-outlined text-[16px]'>person</span>
          For myself
        </button>
        <button
          type='button'
          onClick={() => setBuyerMode('b2b')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            currentBuyerMode === 'b2b'
              ? 'bg-[#7D5B20] text-white shadow-sm font-semibold'
              : 'text-black/55 hover:text-black'
          }`}
        >
          <span className='material-symbols-outlined text-[16px]'>domain</span>
          For my business
        </button>
      </div>

      {step === 'landing' && (
        <>
          <h1 className='text-2xl font-medium text-black mb-1'>
            {currentBuyerMode === 'b2b' ? 'Business Wholesale Sign In' : 'Welcome'}
          </h1>
          <p className='text-sm text-black/55 mb-6'>
            {currentBuyerMode === 'b2b'
              ? 'Sign in to access wholesale volume pricing, sample swatches, and bulk ordering.'
              : "Continue with your email — we'll send you a sign-in code, or you can use a password if you have one."}
          </p>

          <div className='space-y-3'>
            <button
              onClick={() => setStep('email')}
              className='w-full rounded-lg border border-bark/40 py-2.5 flex items-center justify-center gap-2.5 hover:bg-sand transition text-sm font-medium'
            >
              <span className='material-symbols-outlined text-base text-clay'>mail</span>
              Continue with Email
            </button>
            <SocialButton />
          </div>

          <p className='mt-6 text-xs text-black/45 text-center leading-relaxed'>
            By continuing you agree to the website&apos;s{' '}
            <Link href='/content/policies/terms-conditions/174271' className='text-clay hover:underline'>T&amp;C</Link>
            {' '}&amp;{' '}
            <Link href='/content/policies/privacy-policy/173823' className='text-clay hover:underline'>Privacy Policies</Link>
            {' '}and to receive emails for service related information.
          </p>
        </>
      )}

      {step === 'email' && (
        <EmailStep
          onBack={resetToLanding}
          onContinue={onEmailContinue}
          busy={checking}
          error={checkError}
          defaultEmail={invitedEmail}
        />
      )}

      {step === 'password' && (
        <PasswordStep
          email={email}
          onBack={() => setStep('email')}
          onSuccess={handleLoginSuccess}
          onUseCode={() => setStep('code')}
        />
      )}

      {step === 'register' && (
        <RegisterStep
          email={email}
          onBack={() => setStep('email')}
          onRegistered={handleLoginSuccess}
          onUseCode={() => setStep('code')}
        />
      )}

      {step === 'code' && (
        <CodeSignIn
          email={email}
          onBack={() => setStep('email')}
          onSuccess={handleLoginSuccess}
        />
      )}

      {step === 'verify' && (
        <ResendVerificationForm initialEmail={email} onBack={() => setStep('email')} />
      )}
    </>
  );

  return (
    <main className='min-h-[calc(100vh-64px)] flex flex-col md:flex-row'>
      <div
        className='flex-1 flex items-center justify-center px-6 py-12 md:py-16'
        style={{ background: 'radial-gradient(ellipse at top left, #f5f2ed 0%, #faf9f7 100%)' }}
      >
        <div className='w-full max-w-md bg-white rounded-2xl shadow-md px-8 py-10 sm:px-10'>
          {cardContent}
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className='hidden md:block md:flex-1 relative overflow-hidden'>
        <img
          src={AUTH_HERO}
          alt='Handloom textiles'
          className='absolute inset-0 w-full h-full object-cover'
        />
      </div>
    </main>
  );
}
