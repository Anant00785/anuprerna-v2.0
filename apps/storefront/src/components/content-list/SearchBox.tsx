'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { suggestTerms } from './search-suggest';

// Live: 4 "Most Searched" keyword chips that re-query.
const MOST_SEARCHED = ['Khadi', 'Jamdani', 'Denim', 'Silk'];

// Live: 3 category shortcut tiles → in-app product-filter URLs.
const CATEGORY_TILES = [
  {
    label: 'Organic Khadi Cotton',
    href: '/products/fabric?organic-and-natural=organic-khadi-cotton',
    image: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZWADZPMYSPI8Q00OID5TIASCOG3502523.jpg',
  },
  {
    label: 'Jamdani Loom Embroidery',
    href: '/products/fabric?embroidery-technique=jamdani-loom-embroidery',
    image: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/PENTN7FGNSWP4W6PW254LI6JXG8907796.jpg',
  },
  {
    label: 'Indian Premium Silk',
    href: '/products/fabric?indian-premium-silk=mulberry-silk%252Ctussar-silk%252Cmatka-peace-silk%252Cketya-peace-silk',
    image: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/KY57BIHN7AX260C568Y557C5NFF804241.jpg',
  },
];

export default function SearchBox({
  initialTerm,
  terms = [],
}: {
  initialTerm: string;
  terms?: string[];
}) {
  const [value, setValue] = useState(initialTerm);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSubmit = useCallback(
    (term: string) => {
      const q = term.trim();
      if (!q) return;
      setFocused(false);
      // Live param contract: ?search=<term>
      router.push('/display/search?search=' + encodeURIComponent(q));
    },
    [router],
  );

  // Autocomplete suggestions: catalogue terms (prefix/substring/fuzzy) merged
  // with the Most-Searched chips that also match. Shown after >=3 chars.
  const suggestions = useMemo(() => {
    const q = value.trim();
    if (q.length < 3) return [];
    const fromCatalogue = suggestTerms(q, terms, 6);
    const fromChips = MOST_SEARCHED.filter(
      (c) => c.toLowerCase().includes(q.toLowerCase()) && c.toLowerCase() !== q.toLowerCase(),
    );
    const merged: string[] = [];
    for (const s of [...fromChips, ...fromCatalogue]) {
      if (!merged.some((m) => m.toLowerCase() === s.toLowerCase())) merged.push(s);
    }
    return merged.slice(0, 7);
  }, [value, terms]);

  // Category shortcuts whose label matches the query (so the dropdown also
  // offers a direct collection jump).
  const matchedTiles = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 3) return [];
    return CATEGORY_TILES.filter((t) => t.label.toLowerCase().includes(q));
  }, [value]);

  const showDropdown =
    focused && value.trim().length >= 3 && (suggestions.length > 0 || matchedTiles.length > 0);

  // Close on outside click.
  useEffect(() => {
    if (!focused) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [focused]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSubmit(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div className='w-full max-w-2xl mx-auto' ref={boxRef}>
      {/* Search input */}
      <div className='relative'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(value);
          }}
          className='flex items-center border border-black/25 rounded overflow-hidden'
        >
          <span className='material-symbols-outlined text-black/40 pl-3 text-xl select-none'>search</span>
          <input
            type='text'
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setActiveIdx(-1);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={onKeyDown}
            role='combobox'
            aria-expanded={showDropdown}
            aria-autocomplete='list'
            aria-controls='search-suggestions'
            placeholder='Search keyword, color or fabric'
            className='flex-1 px-3 py-3 text-sm text-black placeholder-black/40 outline-none bg-white'
          />
          <button
            type='submit'
            className='bg-clay text-white text-sm font-medium px-5 py-3 whitespace-nowrap hover:bg-clayd transition-colors'
          >
            Search
          </button>
        </form>

        {/* Autocomplete dropdown */}
        {showDropdown && (
          <ul
            id='search-suggestions'
            role='listbox'
            className='absolute z-30 left-0 right-0 mt-1 bg-white border border-black/15 rounded shadow-lg overflow-hidden text-left'
          >
            {suggestions.map((s, i) => (
              <li key={'term-' + s} role='option' aria-selected={i === activeIdx}>
                <button
                  type='button'
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSubmit(s);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-black/80 transition-colors',
                    i === activeIdx ? 'bg-clay/5 text-clay' : 'hover:bg-black/[0.03]',
                  ].join(' ')}
                >
                  <span className='material-symbols-outlined text-base text-black/30'>search</span>
                  {s}
                </button>
              </li>
            ))}
            {matchedTiles.map((t) => (
              <li key={'tile-' + t.label} role='option'>
                <a
                  href={t.href}
                  className='w-full flex items-center gap-2 px-3 py-2 text-sm text-black/70 hover:bg-black/[0.03] transition-colors'
                >
                  <span className='material-symbols-outlined text-base text-clay'>category</span>
                  {t.label}
                  <span className='ml-auto text-[10px] uppercase tracking-wide text-black/35'>Collection</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Most Searched chip row */}
      <div className='flex flex-wrap gap-2 justify-center mt-4'>
        {MOST_SEARCHED.map((s) => (
          <button
            key={s}
            onClick={() => handleSubmit(s)}
            className={[
              'px-3 py-1 text-xs rounded-full border transition-colors',
              value === s
                ? 'border-clay text-clay bg-clay/5'
                : 'border-black/20 text-black/70 hover:border-clay hover:text-clay',
            ].join(' ')}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Category shortcut tiles → in-app product filters */}
      <div className='grid grid-cols-3 gap-2 justify-items-center mt-6 max-w-md mx-auto'>
        {CATEGORY_TILES.map((t) => (
          <a
            key={t.label}
            href={t.href}
            className='flex flex-col items-center gap-2 group p-1.5'
          >
            <div className='w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border border-black/15 group-hover:border-clay transition-colors'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.image} alt={t.label} className='w-full h-full object-cover' />
            </div>
            <span className='text-xs text-black/60 text-center leading-tight'>{t.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
