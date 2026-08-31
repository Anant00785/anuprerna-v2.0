'use client';

import { useState } from 'react';
import type { ContentSection } from './loom';

// ---------------------------------------------------------------------------
// MobileOnThisPage — fixed top-right "On this Page ▾" dropdown for mobile only.
// Mirrors the live Angular `.i-anchor-dropdown` / toggleDropdown() affordance.
// Links scroll-anchor to the same section-<idx> ids the desktop TOC uses.
// Hidden on lg+ (desktop has the left sticky TOC instead).
// ---------------------------------------------------------------------------

interface TocEntry {
  heading: string;
  anchorId: string;
}

export default function MobileOnThisPage({ sections }: { sections: ContentSection[] }) {
  const [open, setOpen] = useState(false);

  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const entries: TocEntry[] = sorted
    .map((s, idx) => ({ heading: s.heading, anchorId: 'section-' + idx }))
    .filter((e) => e.heading && e.heading.trim() !== '');

  if (entries.length === 0) return null;

  const jump = (anchorId: string) => {
    setOpen(false);
    const el = document.getElementById(anchorId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className='lg:hidden fixed top-[72px] right-3 z-30'>
      <div className='flex flex-col items-end w-[220px]'>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className='flex items-center gap-1 px-3 py-1.5 rounded bg-[#fffcf7] border border-black/15 shadow-sm text-sm text-black/80'
        >
          <span>On this Page</span>
          <svg
            width='14'
            height='14'
            viewBox='0 0 15 15'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className={'transition-transform ' + (open ? 'rotate-180' : '')}
          >
            <path
              d='M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z'
              fill='currentColor'
              fillRule='evenodd'
              clipRule='evenodd'
            />
          </svg>
        </button>

        {open && (
          <div className='mt-2 w-full max-h-[60vh] overflow-y-auto bg-[#fffcf7] border border-black/10 rounded-2xl shadow-lg px-3 py-3'>
            <p className='text-[10px] uppercase tracking-widest text-black/40 mb-2 font-medium'>
              Contents
            </p>
            <ul className='space-y-1'>
              {entries.map((entry) => (
                <li key={entry.anchorId}>
                  <button
                    onClick={() => jump(entry.anchorId)}
                    className='block w-full text-left text-[13px] leading-snug py-1 text-black/70 hover:text-clay transition-colors'
                  >
                    {entry.heading}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
