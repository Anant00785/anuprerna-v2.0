'use client';
import { useEffect, useState } from 'react';
import { useBuyerMode } from '../BuyerModeProvider';

// Live notification bar: cream #fbf4e8 background, BLACK text
// (notification-bar.scss: --fb--top-notification-bg = #fbf4e8; color: black).
// B2C mode: retail messaging (free shipping, artisans, natural dye) — no MOQ copy.
// B2B / Guest: full messaging including "Low MOQ custom manufacturing".
// First render uses 'guest' default (matches ISR HTML) — same hydration-safe
// pattern as BuyerModeProvider (mode applied in effect, not on server).
const B2C_NOTICE =
  'Free shipping on orders above ₹5000 · Naturally dyed & handwoven · 500+ artisans, East India';
const DEFAULT_NOTICE =
  'Free shipping on orders above ₹5000 · Low MOQ custom manufacturing · 500+ artisans, East India';
const KEY = 'ap_notice_dismissed';

export default function NotificationBar() {
  const [show, setShow] = useState(true);
  const { mode } = useBuyerMode();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(KEY) === '1') setShow(false);
  }, []);

  if (!show) return null;

  const notice = mode === 'b2c' ? B2C_NOTICE : DEFAULT_NOTICE;

  return (
    <div className='w-full text-black text-xs sm:text-sm' style={{ backgroundColor: '#fbf4e8' }}>
      <div className='mx-auto max-w-screen-xl px-4 py-1 flex items-center justify-center gap-3 relative'>
        <p className='truncate text-center'>{notice}</p>
        <button
          aria-label='Dismiss'
          onClick={() => {
            setShow(false);
            try { localStorage.setItem(KEY, '1'); } catch {}
          }}
          className='absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 text-black'
        >
          <span className='material-symbols-outlined text-[18px]'>close</span>
        </button>
      </div>
    </div>
  );
}
