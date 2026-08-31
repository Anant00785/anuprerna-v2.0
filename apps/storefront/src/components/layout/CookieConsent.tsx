'use client';
import { useEffect, useState } from 'react';

const KEY = 'ap_cookie_consent';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(KEY)) setShow(true);
  }, []);
  if (!show) return null;
  const dismiss = (v: 'accepted' | 'declined') => {
    try { localStorage.setItem(KEY, v); } catch {}
    setShow(false);
  };
  return (
    <div className='fixed bottom-0 inset-x-0 z-[90] bg-[#211c16] text-white'>
      <div className='mx-auto max-w-screen-xl px-5 py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6'>
        <p className='text-sm text-white/80 flex-1 text-center sm:text-left'>
          We use cookies to improve your browsing experience, analyse traffic and personalise content.
        </p>
        <div className='flex items-center gap-3 shrink-0'>
          <button onClick={() => dismiss('declined')} className='text-sm text-white/70 hover:text-white px-3 py-1.5'>
            Decline
          </button>
          <button onClick={() => dismiss('accepted')} className='text-sm rounded-md bg-[#b7a990] text-black hover:bg-[#8d7961] hover:text-white px-4 py-1.5 transition'>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
