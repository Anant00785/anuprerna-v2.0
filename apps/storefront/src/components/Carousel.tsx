'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Lightweight horizontal swipe carousel — CSS scroll-snap track + prev/next arrows.
 * - Native touch / trackpad swipe (overflow-x:auto, snap).
 * - Arrows scroll by ~one viewport of cards and hide when at an edge.
 * - Children are the slides; each should be `shrink-0` with a responsive width
 *   (e.g. show ~4 on desktop, ~1.2 on mobile to peek the next card).
 */
export default function Carousel({
  children,
  className = '',
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: 'smooth' });
  };

  return (
    <div className={'fb-carousel relative w-full ' + className}>
      <button
        type='button'
        aria-label='Previous'
        onClick={() => scrollBy(-1)}
        className={
          'fb-carousel-arrow left-1 sm:-left-3 ' +
          (canPrev ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
      >
        <span className='material-symbols-outlined'>chevron_left</span>
      </button>

      <div
        ref={trackRef}
        role='region'
        aria-label={ariaLabel}
        className='fb-carousel-track flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2 px-1'
      >
        {children}
      </div>

      <button
        type='button'
        aria-label='Next'
        onClick={() => scrollBy(1)}
        className={
          'fb-carousel-arrow right-1 sm:-right-3 ' +
          (canNext ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
      >
        <span className='material-symbols-outlined'>chevron_right</span>
      </button>
    </div>
  );
}
