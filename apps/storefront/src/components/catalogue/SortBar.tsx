'use client';

import { useEffect, useRef, useState } from 'react';
import type { SortKey } from './types';

interface SortBarProps {
  count: number;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  /** Mobile-only: open the filter drawer. */
  onOpenFilters?: () => void;
  activeFilterCount?: number;
}

// PLP-06 + scorecard #7: 5 options, default RECOMMENDED (curated/featured order).
// FIX-10: labels UPPERCASE 12-13px, brown; active opacity 1, others 0.5.
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: 'RECOMMENDED' },
  { key: 'availability', label: 'BY AVAILABILITY' },
  { key: 'new-arrival', label: 'NEW ARRIVAL' },
  { key: 'low-to-high', label: 'PRICE LOW TO HIGH' },
  { key: 'high-to-low', label: 'PRICE HIGH TO LOW' },
];

export default function SortBar({ count, sort, onSortChange, onOpenFilters, activeFilterCount = 0 }: SortBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className='flex items-center justify-between gap-3 mb-5'>
      <p className='text-sm text-bark'>
        Showing <span className='font-medium text-gray-800'>{count.toLocaleString('en-IN')}</span> Products
      </p>

      <div className='flex items-center gap-2'>
        {/* Mobile filter trigger — hidden on mobile now (replaced by sticky bottom bar in CatalogueShell). */}
        {onOpenFilters && (
          <button
            type='button'
            onClick={onOpenFilters}
            className='lg:hidden inline-flex items-center gap-1 border border-gray-300 text-xs uppercase tracking-wide text-gray-700 px-3 py-2 rounded'
          >
            Filters{activeFilterCount > 0 ? ' (' + activeFilterCount + ')' : ''}
          </button>
        )}

        {/* FIX-10: Sort control — 'sort' material icon + 'SORT BY' uppercase label in pill.
            Pill: bg #fffcf7, border #75787F/20, shadow.
            Dropdown: bg #fffcf7, 4 options UPPERCASE 12px brown #8E7862;
            active opacity-100, others opacity-50. Default sort = By Availability. */}
        <div className='relative' ref={ref}>
          <button
            type='button'
            onClick={() => setOpen((o) => !o)}
            aria-haspopup='listbox'
            aria-expanded={open}
            className='inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs uppercase tracking-wide shadow-sm transition-shadow hover:shadow'
            style={{
              backgroundColor: '#fffcf7',
              border: '1px solid rgba(117,120,127,0.2)',
              color: '#8E7862',
            }}
          >
            {/* 'sort' material icon */}
            <span className='material-symbols-outlined text-[16px] leading-none' style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
              sort
            </span>
            <span className='font-medium tracking-widest'>SORT BY</span>
          </button>

          {open && (
            <ul
              role='listbox'
              className='absolute right-0 z-20 mt-1 w-52 rounded-md shadow-lg py-1'
              style={{
                backgroundColor: '#fffcf7',
                border: '1px solid rgba(117,120,127,0.2)',
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <li key={o.key} role='option' aria-selected={o.key === sort}>
                  <button
                    type='button'
                    onClick={() => {
                      onSortChange(o.key);
                      setOpen(false);
                    }}
                    className='w-full text-left px-4 py-2 text-[12px] uppercase tracking-wide transition-opacity'
                    style={{
                      color: '#8E7862',
                      opacity: o.key === sort ? 1 : 0.5,
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
