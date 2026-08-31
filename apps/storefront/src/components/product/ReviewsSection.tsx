'use client';

import { useState } from 'react';
import type { ProductReview } from './types';

// Port of ProductReviewSectionComponent (PDP "Hear from our Customers").
// Renders the consistent summary rating (single source of truth, shared with the
// top RatingLine) + the real review list from /get/product/review/{id}.
// id="reviews" so the top rating's click scrolls here.
interface ReviewsSectionProps {
  /** Pre-computed display rating string — SAME value as the top RatingLine. */
  displayRating: string;
  count: number;
  reviews: ProductReview[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className='inline-flex gap-0.5' aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox='0 0 16 16' className={'h-4 w-4 ' + (rating >= n ? 'fill-amber-400' : 'fill-bark/20')}>
          <path d='M8 1l1.85 3.75L14 5.35l-3 2.92.71 4.13L8 10.4l-3.71 2-0.71-4.13L.5 5.35l4.15-.6z' />
        </svg>
      ))}
    </span>
  );
}

function fmtDate(ts?: number): string {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function ReviewsSection({ displayRating, count, reviews }: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL = 3;
  const visible = showAll ? reviews : reviews.slice(0, INITIAL);

  return (
    <section id='reviews' className='mt-10 scroll-mt-24'>
      <div className='rounded-xl border border-sand bg-cream p-5'>
        {/* Consistent summary header */}
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Stars rating={Math.round(Number(displayRating))} />
            <span className='font-medium text-black'>{displayRating}</span>
            <span className='text-sm text-black/50'>· {count.toLocaleString('en-IN')} verified reviews</span>
          </div>
          <a href='/review' className='text-clay hover:underline text-xs'>Write a review</a>
        </div>

        {reviews.length > 0 ? (
          <>
            <h2 className='mt-5 mb-3 text-base font-semibold text-black'>Hear from our Customers</h2>
            <ul className='flex flex-col gap-4'>
              {visible.map((r, i) => (
                <li key={r.id ?? i} className='border-b border-sand pb-4 last:border-0 last:pb-0'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                      <img
                        className='h-9 w-9 rounded-full'
                        src={'https://ui-avatars.com/api/?rounded=true&background=B8A88F&color=fff&name=' + encodeURIComponent(r.name || 'A')}
                        alt=''
                        loading='lazy'
                      />
                      <div className='flex flex-col'>
                        <p className='text-sm font-semibold capitalize text-black'>{r.name}</p>
                        <Stars rating={r.rating} />
                      </div>
                    </div>
                    {r.createdAt ? <span className='text-xs text-black/40'>{fmtDate(r.createdAt)}</span> : null}
                  </div>
                  {r.description && (
                    <p className='mt-2 text-sm text-black/70'>
                      <q>{r.description}</q>
                    </p>
                  )}
                  {(r.city || r.country) && (
                    <p className='mt-1 text-xs capitalize text-black/40'>
                      {[r.city, r.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {reviews.length > INITIAL && (
              <button
                type='button'
                onClick={() => setShowAll((v) => !v)}
                className='mt-4 rounded border border-bark/30 px-3 py-1.5 text-xs text-clay hover:border-clay'
              >
                {showAll ? 'Show fewer' : 'Show more reviews'}
              </button>
            )}
          </>
        ) : (
          <p className='mt-4 text-sm text-black/50'>
            No individual reviews to show yet.
          </p>
        )}
      </div>
    </section>
  );
}
