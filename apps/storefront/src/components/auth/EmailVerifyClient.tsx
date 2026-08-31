'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Client component that calls /api/auth/verify-email?token= on mount.
// Shows a spinner during the request, then either a success message (→ sign in)
// or an error.
export default function EmailVerifyClient({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing from the URL.');
      return;
    }
    fetch('/api/auth/verify-email?token=' + encodeURIComponent(token))
      .then((res) => res.json())
      .then((data: { success?: boolean; message?: string }) => {
        if (data?.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setMessage(data?.message || 'Verification failed. The link may have expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again or contact support.');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className='py-10 text-center'>
        <span className='material-symbols-outlined animate-spin text-3xl text-clay block mb-3'>
          progress_activity
        </span>
        <p className='text-sm text-black/55'>Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className='py-6 text-center'>
        <span className='material-symbols-outlined text-5xl text-clay mb-3 block'>verified</span>
        <p className='text-base font-medium text-clay mb-1'>Email verified!</p>
        <p className='text-sm text-black/60 mb-6'>
          Your account is active. You can now sign in and start shopping.
        </p>
        <button
          onClick={() => router.push('/auth')}
          className='w-full rounded-lg bg-clay text-white py-2.5 text-sm font-medium hover:bg-clayd transition'
        >
          Sign in
        </button>
      </div>
    );
  }

  // error
  return (
    <div className='py-6 text-center'>
      <span className='material-symbols-outlined text-5xl text-red-500 mb-3 block'>error</span>
      <p className='text-base font-medium text-red-600 mb-1'>Verification failed</p>
      <p className='text-sm text-black/60 mb-6'>{message}</p>
      <a
        href='/auth'
        className='inline-flex items-center gap-1.5 text-sm text-clay hover:underline'
      >
        <span className='material-symbols-outlined text-sm'>arrow_back</span>
        Back to Sign In
      </a>
    </div>
  );
}
