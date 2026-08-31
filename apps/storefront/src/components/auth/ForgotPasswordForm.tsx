'use client';
import { useState, FormEvent } from 'react';

// Forgot-password form. POSTs to /api/auth/forgot (BFF).
// On this PUBLIC DEMO the BFF is stubbed (no email is ever sent); it returns a
// demo-marked success message which we surface below so the state is honest.
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoMsg, setDemoMsg] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setDemoMsg(typeof data?.message === 'string' ? data.message : '');
        setSent(true);
      } else {
        setError(data?.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className='py-6 text-center'>
        <span className='material-symbols-outlined text-4xl text-clay mb-3 block'>mark_email_read</span>
        <p className='text-base font-medium text-clay mb-1'>Check your email</p>
        <p className='text-sm text-black/60 mb-3'>
          If <strong>{email}</strong> is registered with us, you will receive a password reset link shortly.
        </p>
        {demoMsg && (
          <p className='text-xs text-clay bg-clay/10 rounded-lg px-3 py-2 mb-6'>{demoMsg}</p>
        )}
        <a
          href='/auth'
          className='text-sm text-clay hover:underline flex items-center justify-center gap-1'
        >
          <span className='material-symbols-outlined text-sm'>arrow_back</span>
          Back to Sign In
        </a>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-bark/40 px-3 py-2.5 text-sm outline-none focus:border-clay transition placeholder:text-black/35';

  return (
    <form onSubmit={submit} className='space-y-5 mt-5'>
      <div>
        <label className='block text-xs text-black/60 mb-1.5 font-medium'>Email :</label>
        <input
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder='Enter your email'
          autoComplete='email'
        />
      </div>
      {error && <p className='text-sm text-red-600'>{error}</p>}
      <button
        type='submit'
        disabled={busy}
        className='w-full rounded-lg bg-clay text-white py-2.5 text-sm font-medium hover:bg-clayd transition disabled:opacity-60'
      >
        {busy ? 'Sending…' : 'Send'}
      </button>
      <div className='text-right'>
        <a href='/auth' className='text-xs text-black/50 hover:text-clay transition'>
          &lt; Back to Sign In
        </a>
      </div>
    </form>
  );
}
