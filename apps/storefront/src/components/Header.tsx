'use client';
import { useState, useEffect } from 'react';

const SITE = ''; // de-leaked: relative in-app paths
const LOGO = '/media/logo_black.svg';

// Top-level menu — mirrors the live new-navigation (Fabric / Accessories / Homeware / Apparel /
// Collaborations / Our Story / B2B / Search).
const NAV = [
  { label: 'Fabric',         href: SITE + '/products/fabric' },
  { label: 'Accessories',    href: SITE + '/products/finished?category=accessories' },
  { label: 'Homeware',       href: SITE + '/products/finished?category=home' },
  { label: 'Apparel',        href: SITE + '/products/finished?category=apparel' },
  { label: 'Collaborations', href: SITE + '/stories' },
  { label: 'Our Story',      href: SITE + '/story-details/about-the-brand/56485' },
  { label: 'B2B',            href: SITE + '/fabric-wholesaler' },
];

const NOTICE = 'Free shipping on orders above ₹5000 · Low MOQ custom manufacturing · 500+ artisans, East India';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notice, setNotice] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ---- Notification bar (mirrors fb-notification-bar) ---- */}
      {notice && (
        <div className='w-full bg-[#7D5B20] text-white text-xs sm:text-sm'>
          <div className='mx-auto max-w-screen-xl px-4 h-9 flex items-center justify-center gap-3 relative'>
            <p className='truncate text-center'>{NOTICE}</p>
            <button aria-label='Dismiss' onClick={() => setNotice(false)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100'>
              <span className='material-symbols-outlined text-[18px]'>close</span>
            </button>
          </div>
        </div>
      )}

      {/* ---- Main navigation ---- */}
      <header className={'sticky top-0 z-50 w-full bg-white transition-shadow ' + (scrolled ? 'shadow-sm border-b border-[#7D5B20]/10' : 'border-b border-transparent')}>
        <nav className='mx-auto max-w-screen-xl px-4 h-16 flex items-center justify-between gap-2'>
          {/* Logo + hamburger */}
          <div className='flex items-center gap-2'>
            <button className='xl:hidden flex items-center' aria-label='Menu' onClick={() => setOpen(v => !v)}>
              <span className='material-symbols-outlined'>{open ? 'close' : 'menu'}</span>
            </button>
            <a href={SITE} target='_blank' rel='noopener' className='flex items-center gap-1.5'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt='Anuprerna' className='h-7 w-auto' />
              <span className='font-bold text-base lg:text-xl text-black'>Anuprerna</span>
            </a>
          </div>

          {/* Desktop menu */}
          <ul className='hidden xl:flex items-center gap-7 text-base text-black/80'>
            {NAV.map(n => (
              <li key={n.label}>
                <a href={n.href} target='_blank' rel='noopener' className='hover:text-[#7D5B20] transition-colors'>{n.label}</a>
              </li>
            ))}
            <li>
              <a href={SITE + '/display/search'} target='_blank' rel='noopener' className='flex items-center gap-1.5 hover:text-[#7D5B20] transition-colors'>
                <span className='material-symbols-outlined'>search</span><span>Search</span>
              </a>
            </li>
          </ul>

          {/* Right actions */}
          <div className='flex items-center gap-3'>
            <span className='hidden xl:flex items-center gap-1 text-sm text-black/70'>
              <span className='material-symbols-outlined text-[18px]'>currency_rupee</span>INR
            </span>
            <a href={SITE + '/display/search'} target='_blank' rel='noopener' className='xl:hidden text-black/80' aria-label='Search'>
              <span className='material-symbols-outlined'>search</span>
            </a>
            <a href={SITE + '/wishlist'} target='_blank' rel='noopener' className='text-black/80 hover:text-[#7D5B20]' aria-label='Wishlist'>
              <span className='material-symbols-outlined'>favorite</span>
            </a>
            <a href={SITE + '/cart'} target='_blank' rel='noopener' className='text-black/80 hover:text-[#7D5B20]' aria-label='Cart'>
              <span className='material-symbols-outlined'>shopping_cart</span>
            </a>
            <a href={SITE + '/auth'} target='_blank' rel='noopener'
               className='hidden sm:inline-flex items-center gap-1 rounded-lg border-2 border-[#8E7862] text-[#7D5B20] text-sm px-3 py-1.5 hover:bg-[#fffcf7] transition'>
              Sign In <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
            </a>
          </div>
        </nav>

        {/* Mobile menu drawer */}
        {open && (
          <div className='xl:hidden border-t border-[#7D5B20]/10 bg-white'>
            <ul className='px-4 py-3 flex flex-col text-base text-black/80'>
              {NAV.map(n => (
                <li key={n.label} className='border-b border-[#7D5B20]/5 last:border-0'>
                  <a href={n.href} target='_blank' rel='noopener' onClick={() => setOpen(false)}
                     className='block py-3 hover:text-[#7D5B20]'>{n.label}</a>
                </li>
              ))}
              <li>
                <a href={SITE + '/auth'} target='_blank' rel='noopener' onClick={() => setOpen(false)}
                   className='mt-3 inline-flex items-center gap-1 rounded-lg border-2 border-[#8E7862] text-[#7D5B20] text-sm px-3 py-1.5'>
                  Sign In <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>
    </>
  );
}
