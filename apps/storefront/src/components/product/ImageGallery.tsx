'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Img from '@/components/ui/Img';
import Link from 'next/link';
import type { GalleryMediaItem } from './types';

export interface GalleryImage {
  src: string;
  alt: string;
}

interface ImageGalleryProps {
  /** Full media list (images + youtube). Preferred. */
  media?: GalleryMediaItem[];
  /** Legacy image-only list (still accepted for back-compat). */
  images?: GalleryImage[];
  productSlug: string;
  category: string;
  /** If true, renders the full-screen gallery page layout (rail + main). */
  fullscreen?: boolean;
}

function toMedia(images?: GalleryImage[], media?: GalleryMediaItem[]): GalleryMediaItem[] {
  if (media && media.length) return media;
  return (images ?? []).map((i) => ({ src: i.src, thumb: i.src, alt: i.alt, type: 'image' as const }));
}

export default function ImageGallery({
  media,
  images,
  productSlug,
  category,
  fullscreen = false,
}: ImageGalleryProps) {
  const items = toMedia(images, media);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = items.length;
  const current = items[active] ?? items[0];

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!zoomed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % count);
      else if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + count) % count);
      else if (e.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomed, count]);

  const prev = useCallback(() => setActive((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((i) => (i + 1) % count), [count]);

  // Touch swipe (mobile) — horizontal drag advances the gallery.
  const onTouchStart = useCallback((e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchX.current == null || count <= 1) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx > 40) prev();
    else if (dx < -40) next();
    touchX.current = null;
  }, [count, prev, next]);

  // -------------------------------------------------------------------------
  // FULL-SCREEN GALLERY ROUTE — vertical thumbnail RAIL + large main (live).
  // -------------------------------------------------------------------------
  if (fullscreen) {
    return (
      <div className='min-h-screen bg-black'>
        <div className='sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur'>
          <Link
            href={`/product/${category}/${productSlug}`}
            className='flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors'
          >
            <span className='material-symbols-outlined text-[18px]'>arrow_back</span>
            Back to product
          </Link>
          <span className='text-white/50 text-sm'>{count} items</span>
        </div>

        <div className='flex flex-col md:flex-row gap-3 p-3 md:p-6'>
          {/* Vertical thumbnail rail (horizontal scroll on mobile) */}
          <div className='flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[80vh] md:w-24 flex-shrink-0 pb-1'>
            {items.map((m, idx) => (
              <button
                key={m.src + idx}
                onClick={() => setActive(idx)}
                aria-label={`Item ${idx + 1}`}
                className={
                  'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ' +
                  (idx === active ? 'border-[#7D5A20]' : 'border-transparent hover:border-white/40')
                }
              >
                {m.type === 'youtube' ? (
                  // next/image is not configured for img.youtube.com — use a native img.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.thumb} alt={m.alt} className='absolute inset-0 h-full w-full object-cover' />
                ) : (
                  <Img src={m.thumb} alt={m.alt} fill sizes='80px' className='object-cover' />
                )}
                {m.type === 'youtube' && (
                  <span className='absolute inset-0 grid place-items-center bg-black/30'>
                    <span className='material-symbols-outlined text-white text-[22px]'>play_circle</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Large main */}
          <div className='relative flex-1 min-h-[60vh] md:min-h-[80vh] bg-black flex items-center justify-center'>
            {current?.type === 'youtube' ? (
              <iframe
                src={current.src}
                title={current.alt}
                className='w-full max-w-3xl aspect-video'
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                allowFullScreen
              />
            ) : (
              <div className='relative w-full max-w-3xl aspect-square'>
                <Img src={current.src} alt={current.alt} fill priority sizes='90vw' className='object-contain' />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PDP INLINE GALLERY — main media + thumbnail strip.
  // -------------------------------------------------------------------------
  const isVideo = current?.type === 'youtube';

  return (
    <div className='flex flex-col gap-3'>
      {/* Main media — capped height on mobile so name+price+CTA clear the fold (#21) */}
      <div
        className='relative group overflow-hidden rounded-xl bg-sand aspect-[4/3] max-h-[44vh] sm:aspect-square sm:max-h-none'
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {isVideo ? (
          <iframe
            src={current.src}
            title={current.alt}
            className='absolute inset-0 h-full w-full'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        ) : (
          <button
            type='button'
            className='absolute inset-0 cursor-zoom-in'
            onClick={() => setZoomed(true)}
            aria-label='Zoom image'
          >
            <Img
              src={current.src}
              alt={current.alt}
              fill
              priority={active === 0}
              sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 560px'
              className='object-cover transition-transform duration-500 group-hover:scale-105'
            />
          </button>
        )}

        {/* Nav arrows */}
        {count > 1 && (
          <>
            <button
              aria-label='Previous'
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className='absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/80 backdrop-blur text-clay opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10'
            >
              <span className='material-symbols-outlined text-[18px]'>chevron_left</span>
            </button>
            <button
              aria-label='Next'
              onClick={(e) => { e.stopPropagation(); next(); }}
              className='absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/80 backdrop-blur text-clay opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10'
            >
              <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
            </button>
          </>
        )}

        {/* Counter + gallery link */}
        <div className='absolute bottom-3 right-3 flex items-center gap-2 z-10'>
          {count > 1 && (
            <span className='bg-black/50 text-white text-xs px-2 py-0.5 rounded-full'>
              {active + 1}/{count}
            </span>
          )}
          <Link
            href={`/product/gallery/${category}/${productSlug}`}
            onClick={(e) => e.stopPropagation()}
            className='w-11 h-11 grid place-items-center rounded-full bg-white/80 backdrop-blur text-clay hover:bg-white transition-colors'
            aria-label='View all media'
          >
            <span className='material-symbols-outlined text-[16px]'>fullscreen</span>
          </Link>
        </div>
      </div>

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className='hidden sm:flex gap-2 overflow-x-auto pb-1 scrollbar-hide'>
          {items.map((m, idx) => (
            <button
              key={m.src + idx}
              onClick={() => { setActive(idx); }}
              aria-label={`Item ${idx + 1}`}
              className={
                'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ' +
                (idx === active ? 'border-[#7D5A20]' : 'border-transparent hover:border-bark/50')
              }
            >
              {m.type === 'youtube' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumb} alt={m.alt} className='absolute inset-0 h-full w-full object-cover' />
              ) : (
                <Img src={m.thumb} alt={m.alt} fill sizes='64px' className='object-cover' />
              )}
              {m.type === 'youtube' && (
                <span className='absolute inset-0 grid place-items-center bg-black/30'>
                  <span className='material-symbols-outlined text-white text-[18px]'>play_circle</span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay (images only) */}
      {zoomed && !isVideo && (
        <div className='fixed inset-0 z-[200] bg-black/95 flex items-center justify-center' onClick={() => setZoomed(false)}>
          <div className='relative w-full max-w-3xl max-h-[90vh] aspect-square mx-4' onClick={(e) => e.stopPropagation()}>
            <Img src={current.src} alt={current.alt} fill priority sizes='90vw' className='object-contain' />
          </div>
          {count > 1 && (
            <>
              <button aria-label='Previous' onClick={(e) => { e.stopPropagation(); prev(); }}
                className='absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'>
                <span className='material-symbols-outlined'>chevron_left</span>
              </button>
              <button aria-label='Next' onClick={(e) => { e.stopPropagation(); next(); }}
                className='absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'>
                <span className='material-symbols-outlined'>chevron_right</span>
              </button>
            </>
          )}
          <button aria-label='Close lightbox' onClick={() => setZoomed(false)}
            className='absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'>
            <span className='material-symbols-outlined'>close</span>
          </button>
          <span className='absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm'>{active + 1} / {count}</span>
        </div>
      )}
    </div>
  );
}
