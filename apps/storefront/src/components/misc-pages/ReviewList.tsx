'use client';

import { useState } from 'react';

const LOGO_BROWN = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/logo-brown.svg';

const ALL_REVIEWS = [
  {
    name: 'Srishti Khurana', city: 'Mumbai', country: 'India', date: '26 May 2026',
    rating: 5, comment: '', productId: 'DSG086000J',
    productSlug: 'stripe-light-blue-natural-indigo-dyed-62-gsm-handwoven-fabric',
  },
  {
    name: 'tina dza', city: 'Bangalore', country: 'India', date: '29 Apr 2026',
    rating: 5, comment: 'What a lovely fabric! The min you touch it, you will know the quality.',
    productId: 'DAN1200729', productSlug: 'check-blue-brown-pure-cotton-110-gsm-handwoven-fabric',
  },
  {
    name: 'Sidonie Parashar', city: 'Kolkata', country: 'India', date: '23 Apr 2026',
    rating: 5,
    comment: 'Being an admirer of rich Indian textiles, I am pleased that jamdani is being developed beyond the sari. Since I have now switched to kurtas, I bought this to tailor into a kurta and can visualise how elegant the gold dotted white jamdani will look. Please introduce other colour combinations and maybe another design. Thank you. And good luck in promoting other textiles.',
    productId: 'JKD1000407', productSlug: 'white-base-golden-jori-circle-pure-cotton-55-gsm-handwoven-jamdani-fabric',
  },
  {
    name: 'Amber Plattner', city: 'Colorado Springs', country: 'United States', date: '18 Apr 2026',
    rating: 5, comment: 'Absolutely gorgeous! Arrived much quicker than I expected as well.',
    productId: 'SAK097000H', productSlug: 'plain-green-natural-ketya-silk-cotton-blend-150-gsm-handwoven-fabric',
  },
  {
    name: 'Barrett Purdum', city: 'Los Angeles', country: 'United States', date: '10 Apr 2026',
    rating: 5, comment: 'Absolutely beautiful textile. Very excited to sew it into a shirt.',
    productId: 'DSR086000M', productSlug: 'pure-cotton-yarn-dyed-65-gsm-fabric-design-checks-m',
  },
  {
    name: 'Anu John', city: 'Kerala', country: 'India', date: '18 Dec 2025',
    rating: 5, comment: 'Hi Team, actually i gifted this item to someone and today I got the feedback, it is really awesome product and I will purchase more items like this from you guys. Thank you so much.',
    productId: 'KRD072000M', productSlug: '',
  },
  {
    name: 'martin mehdi', city: 'Toulouse', country: 'France', date: '09 Dec 2025',
    rating: 5, comment: 'Beautiful fabric like always. I cannot imagine better.',
    productId: 'MKA230010570H87', productSlug: '',
  },
  {
    name: 'Sujata Ghosh', city: '', country: 'United States', date: '14 Nov 2025',
    rating: 5, comment: '', productId: 'JSG1000311', productSlug: '',
  },
  {
    name: 'Deepak Jena', city: 'Cuttack', country: 'India', date: '03 Oct 2025',
    rating: 5, comment: 'Nicely, medium thicker chequered fabric with superb texture.',
    productId: 'DBS1200078', productSlug: '',
  },
];

const PAGE_SIZE = 5;

function StarRow({ rating }: { rating: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#9c8a6c' : '#d3d3d3' }}>&#9733;</span>
      ))}
    </div>
  );
}

export default function ReviewList() {
  const [shown, setShown] = useState(PAGE_SIZE);
  const visible = ALL_REVIEWS.slice(0, shown);
  const hasMore = shown < ALL_REVIEWS.length;

  return (
    <>
      <div className='flex flex-col divide-y divide-black/10'>
        {visible.map((r, idx) => (
          <article key={idx} className='flex flex-col lg:flex-row gap-4 md:gap-6 py-6'>
            {/* Reviewer info */}
            <div className='w-full lg:w-1/4 flex gap-3 items-start'>
              <div className='shrink-0'>
                <img
                  src={LOGO_BROWN}
                  alt=''
                  width={80}
                  height={80}
                  className='w-[72px] h-[72px] rounded border-2 border-clay object-contain'
                />
              </div>
              <div className='flex flex-col'>
                <p className='font-medium text-sm'>{r.name}</p>
                <p className='text-xs text-bark'>
                  {r.city ? r.city + ', ' : ''}{r.country}
                </p>
                <p className='text-xs text-bark'>{r.date}</p>
              </div>
            </div>

            {/* Review content */}
            <div className='w-full lg:w-3/4'>
              <StarRow rating={r.rating} />
              {r.comment && (
                <p className='text-sm sm:text-base mt-2'>
                  <q>{r.comment}</q>
                </p>
              )}
              <p className='text-sm mt-2'>
                <span className='text-black/60'>Purchased item: </span>
                {r.productSlug ? (
                  <a
                    href={'/product/fabric-product/' + r.productSlug}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline text-bark hover:text-clay'
                  >
                    {r.productId}
                  </a>
                ) : (
                  <span className='text-bark'>{r.productId}</span>
                )}
              </p>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className='flex justify-center mt-8'>
          <button
            onClick={() => setShown(prev => prev + PAGE_SIZE)}
            className='px-8 py-3 bg-[#6c5b48] text-white text-sm font-medium hover:opacity-90 transition rounded'
          >
            View More
          </button>
        </div>
      )}
    </>
  );
}
