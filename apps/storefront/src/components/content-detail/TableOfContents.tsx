'use client';

import { useEffect, useRef, useState } from 'react';
import type { ContentSection } from './loom';

// ---------------------------------------------------------------------------
// TableOfContents — left sticky desktop TOC with IntersectionObserver scrollspy
// ---------------------------------------------------------------------------

interface TocEntry {
  index: number;
  heading: string;
  anchorId: string;
}

interface TableOfContentsProps {
  sections: ContentSection[];
}

export default function TableOfContents({ sections }: TableOfContentsProps) {
  // Build TOC entries from sections that have a heading, sorted by sortOrder
  // Typed ContentSection[], but the content API omits blogContentSectionList on
  // some records; `[...undefined]` throws "is not iterable". See MobileOnThisPage.
  const sorted = [...(sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const entries: TocEntry[] = sorted
    .map((s, idx) => ({ index: idx, heading: s.heading, anchorId: 'section-' + idx }))
    .filter((e) => e.heading && e.heading.trim() !== '');

  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      // Find the topmost visible entry
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => {
          const rectA = a.boundingClientRect;
          const rectB = b.boundingClientRect;
          return rectA.top - rectB.top;
        });
      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    });

    entries.forEach((entry) => {
      const el = document.getElementById(entry.anchorId);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
    // entries is derived from props — rebuild observer when sections change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  if (entries.length === 0) return null;

  return (
    // Hidden on mobile, sticky on desktop
    <nav
      className='hidden lg:block sticky top-24 self-start'
      aria-label='Table of contents'
    >
      <p className='text-[10px] uppercase tracking-widest text-black/40 mb-3 font-medium'>
        Contents
      </p>
      <ul className='space-y-1'>
        {entries.map((entry) => {
          const isActive = activeId === entry.anchorId;
          return (
            <li key={entry.anchorId}>
              <a
                href={'#' + entry.anchorId}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(entry.anchorId);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={
                  'block text-[13px] leading-snug py-1 pl-3 border-l-2 transition-colors ' +
                  (isActive
                    ? 'border-clay text-clay font-medium'
                    : 'border-transparent text-black/55 hover:text-black hover:border-black/20')
                }
              >
                {entry.heading}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
