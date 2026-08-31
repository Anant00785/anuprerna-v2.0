'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

// /login — a real, standalone sign-in page (the sign-in modal in the header
// remains the primary path). This reuses the SAME auth logic the LoginModal
// uses: useAuth().login() -> POST /api/auth/login (sets the httpOnly loom_jwt
// cookie via the BFF). On success we return to where the user came from
// (?redirect=…) or the homepage. Kept as a plain client component (no
// useSearchParams) so it renders fully server-side.

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) {
      const redirectTo =
        (typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('redirect')) ||
        '/';
      router.push(redirectTo);
    } else {
      setError(res.message || 'Login failed.');
    }
  };

  return (
    <main className='min-h-[70vh] flex items-center justify-center px-4 py-16'>
      <div className='w-full max-w-md rounded-2xl bg-white shadow-xl border border-bark/10 p-6 sm:p-8'>
        <h1 className='text-2xl font-medium text-clay mb-1'>Sign in</h1>
        <p className='text-sm text-black/60 mb-6'>Access your orders, wishlist and faster checkout.</p>

        <form onSubmit={submit} className='space-y-4'>
          <div>
            <label className='block text-sm text-black/70 mb-1'>Email</label>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full rounded-lg border border-bark/40 px-3 py-2 outline-none focus:border-clay'
              placeholder='you@example.com'
              autoComplete='email'
            />
          </div>
          <div>
            <label className='block text-sm text-black/70 mb-1'>Password</label>
            <input
              type='password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full rounded-lg border border-bark/40 px-3 py-2 outline-none focus:border-clay'
              placeholder='••••••••'
              autoComplete='current-password'
            />
          </div>
          {error && <p className='text-sm text-red-600'>{error}</p>}
          <button
            type='submit'
            disabled={busy}
            className='w-full rounded-lg bg-clay text-white py-2.5 font-medium hover:bg-clayd transition disabled:opacity-60'
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className='mt-5 flex items-center justify-between text-xs text-black/50'>
          <span>
            No account?{' '}
            <Link href='/auth' className='text-clay hover:underline'>Create one</Link>
          </span>
          <Link href='/' className='text-clay hover:underline'>Continue as guest</Link>
        </div>
      </div>
    </main>
  );
}
