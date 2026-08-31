'use client';
import { useState, FormEvent } from 'react';

// Ports the live Angular verify-email-form.component:
//   heading 'Resend Email Verification Link' + body copy + EMAIL input + 'Resend' button.
// The Resend POSTs to /api/auth/resend-verification (BFF -> Loom /send/verification/email).
// Used both standalone on /auth/email-verification AND as the unverified branch of the
// email-first auth flow (AuthShell).

const inputCls =
  'w-full rounded-lg border border-bark/40 px-3 py-2.5 text-sm outline-none focus:border-clay transition placeholder:text-black/35';

export default function ResendVerificationForm({
  initialEmail = '',
  onBack,
}: {
  initialEmail?: string;
  onBack?: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoMsg, setDemoMsg] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setDemoMsg(typeof data?.message === 'string' ? data.message : '');
        setSent(true);
      } else {
        setError(data?.message || 'Could not send the verification email. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='p-1'>
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
        <h3 className='font-medium text-2xl'>Resend Email Verification Link</h3>
      </div>
      <p className='text-sm text-black/65 leading-relaxed mb-4'>
        Please check your email inbox / SPAM to verify. In case you have not received any
        email for verification, click resend.
      </p>

      {sent && (
        <p className='mb-3 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay'>
          {demoMsg || 'Email sent successfully. Please check your email and verify.'}
        </p>
      )}

      <form onSubmit={submit} className='space-y-4'>
        <div>
          <label htmlFor='resend-email' className='block text-sm font-bold mb-1.5'>Email :</label>
          <input
            id='resend-email'
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
          {busy ? 'Sending…' : 'Resend'}
        </button>
      </form>
    </div>
  );
}
