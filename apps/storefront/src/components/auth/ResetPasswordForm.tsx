'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const inputCls =
  'w-full rounded-lg border border-bark/40 px-3 py-2.5 text-sm outline-none focus:border-clay transition placeholder:text-black/35';

// Reset-password form. Shown at /auth/forget-password/[token].
// POSTs { token, password } to /api/auth/reset-password (BFF → Loom).
export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [demoMsg, setDemoMsg] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setDemoMsg(typeof data?.message === 'string' ? data.message : '');
        setDone(true);
      } else {
        setError(data?.message || 'Password reset failed. The link may have expired.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className='py-6 text-center'>
        <span className='material-symbols-outlined text-4xl text-clay mb-3 block'>check_circle</span>
        <p className='text-base font-medium text-clay mb-1'>Password updated!</p>
        <p className='text-sm text-black/60 mb-6'>{demoMsg || 'You can now sign in with your new password.'}</p>
        <button
          onClick={() => router.push('/auth')}
          className='w-full rounded-lg bg-clay text-white py-2.5 text-sm font-medium hover:bg-clayd transition'
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className='space-y-5 mt-5'>
      <div>
        <label className='block text-xs text-black/60 mb-1.5 font-medium'>New password</label>
        <input
          type='password'
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder='Min 6 characters'
          autoComplete='new-password'
        />
      </div>
      <div>
        <label className='block text-xs text-black/60 mb-1.5 font-medium'>Confirm new password</label>
        <input
          type='password'
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
          placeholder='Repeat password'
          autoComplete='new-password'
        />
      </div>
      {error && <p className='text-sm text-red-600'>{error}</p>}
      <button
        type='submit'
        disabled={busy}
        className='w-full rounded-lg bg-clay text-white py-2.5 text-sm font-medium hover:bg-clayd transition disabled:opacity-60'
      >
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
