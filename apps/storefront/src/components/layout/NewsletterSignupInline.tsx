'use client';

import { useRef, useState, FormEvent } from 'react';

// Footer newsletter signup widget. POSTs to /api/newsletter, which is wired
// to the sandbox wrapper's native POST /send/newsletter-subscribe (own
// newsletter_subscription table -- no live Loom endpoint for this has ever
// existed). Matches SiteFooter's dark theme (bg-[#211c16] / text-[#d8c7a8]).
export default function NewsletterSignupInline() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'storefront-footer', hp: honeypotRef.current?.value || '' }),
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (data.success) {
        setStatus('success');
        setMsg("Thanks — you're on the list.");
        setEmail('');
      } else {
        setStatus('error');
        setMsg(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMsg('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return <p className='text-sm text-[#d8c7a8]'>{msg}</p>;
  }

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-1.5 w-full max-w-sm'>
      {/* Honeypot -- visually hidden, a real visitor never fills this. */}
      <input
        ref={honeypotRef}
        type='text'
        name='hp'
        tabIndex={-1}
        autoComplete='off'
        aria-hidden='true'
        className='absolute -left-[9999px] w-px h-px opacity-0'
      />
      <div className='flex gap-2'>
        <input
          type='email'
          required
          placeholder='Your email'
          aria-label='Email for newsletter signup'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='flex-1 min-w-0 rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#d8c7a8] transition-colors'
        />
        <button
          type='submit'
          disabled={status === 'loading'}
          className='shrink-0 rounded-md px-4 py-2 bg-[#b7a990] hover:bg-[#8d7961] text-black hover:text-white text-sm font-medium transition-all disabled:opacity-50'
        >
          {status === 'loading' ? 'Joining…' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && <p className='text-xs text-red-300'>{msg}</p>}
    </form>
  );
}
