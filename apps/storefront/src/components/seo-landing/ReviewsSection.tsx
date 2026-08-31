'use client';

import { useState, useRef, useEffect } from 'react';

const REVIEWS = [
  {
    id: 1,
    quote:
      'Hi Team, actually i gifted this item to someone and today I got the feedback, it is really awesome product. The quality and finish are really great. Very happy with the purchase!',
    reviewer: 'Anu John',
    location: 'Kerala',
    stars: 5,
    date: 'Dec 18, 2025',
  },
  {
    id: 2,
    quote:
      'The fabric quality is exceptional. Exactly what I needed for my fashion line. The handwoven texture adds a premium feel that machine-made fabrics simply cannot replicate.',
    reviewer: 'Sarah M.',
    location: 'New York, USA',
    stars: 5,
    date: 'Nov 12, 2025',
  },
  {
    id: 3,
    quote:
      'Brilliant handwoven textures. The colors stayed vibrant after washing. Perfect for sustainable fashion collections — our customers absolutely love the artisanal quality.',
    reviewer: 'Priya K.',
    location: 'London, UK',
    stars: 5,
    date: 'Oct 5, 2025',
  },
  {
    id: 4,
    quote:
      'Working with Anuprerna has transformed our sourcing. Reliable lead times, honest communication, and genuinely beautiful handloom fabric that our buyers keep asking for.',
    reviewer: 'David L.',
    location: 'Melbourne, Australia',
    stars: 5,
    date: 'Sep 22, 2025',
  },
  {
    id: 5,
    quote:
      'The custom dyeing matched our brand palette perfectly. Samples arrived fast and the bulk order was consistent throughout. A trustworthy partner for ethical textiles.',
    reviewer: 'Meera R.',
    location: 'Dubai, UAE',
    stars: 5,
    date: 'Aug 8, 2025',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="material-symbols-outlined text-yellow-400 text-base" aria-hidden="true">
          star
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: (typeof REVIEWS)[number] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4 h-full">
      <StarRating count={review.stars} />
      <p className="text-gray-700 text-sm leading-relaxed flex-1">&ldquo;{review.quote}&rdquo;</p>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{review.reviewer}</p>
          <p className="text-xs text-gray-500">{review.location}</p>
        </div>
        <span className="text-xs text-gray-400">{review.date}</span>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  // How many cards are visible per "page" — responsive.
  const [perView, setPerView] = useState(1);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setPerView(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const maxIndex = Math.max(0, REVIEWS.length - perView);

  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const go = (dir: number) => {
    setIndex((prev) => Math.min(Math.max(prev + dir, 0), maxIndex));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      go(delta < 0 ? 1 : -1);
    }
    touchStartX.current = null;
  };

  const pageCount = maxIndex + 1;

  return (
    <section className="bg-[#F9F4F5] py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Don&rsquo;t just take our word for it — hear from businesses that trust Anuprerna for their
            fabric needs.
          </p>
        </div>

        <div className="relative">
          <div
            className="overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="region"
            aria-roledescription="carousel"
            aria-label="Customer reviews"
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
            >
              {REVIEWS.map((review) => (
                <div
                  key={review.id}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / perView}%` }}
                >
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous review"
            className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-0 lg:-translate-x-4 w-11 h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed z-10"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index >= maxIndex}
            aria-label="Next review"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-0 lg:translate-x-4 w-11 h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed z-10"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to review page ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-gray-900' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
