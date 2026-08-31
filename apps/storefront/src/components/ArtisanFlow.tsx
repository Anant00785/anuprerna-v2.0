// ArtisanFlow — compact trust strip (3 impact stat tiles + link to ArtisanFlow).
// Replaces the previous full-video + stats section for a calmer, scannable layout.
// Stats sourced from live platform data (same values as before — no new fetch needed).
// CLS note: no images in this component — zero CLS risk.
import Link from 'next/link';

const STATS = [
  {
    icon: 'eco',
    n: '45,708',
    label: 'kg of Carbon Offset',
  },
  {
    icon: 'group',
    n: '500+',
    label: 'Artisans Empowered in East India',
  },
  {
    icon: 'water_drop',
    n: '9,66,232',
    label: 'Litres of Water Saved',
  },
];

export default function ArtisanFlow() {
  return (
    <section className='w-full bg-[#F0EEE9] py-12'>
      <div className='container mx-auto max-w-screen-xl px-4'>

        {/* Heading */}
        <div className='text-center mb-8'>
          <p className='text-xs sm:text-sm uppercase tracking-[.2em] text-[#8E7862] mb-2'>
            Our commitment to people &amp; planet
          </p>
          <h2 className='text-2xl sm:text-3xl font-medium text-black'>
            Transparent, traceable &amp; <span className='text-[#7D5B20]'>handcrafted</span>
          </h2>
        </div>

        {/* 3 stat tiles */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8'>
          {STATS.map(s => (
            <div key={s.label}
                 className='flex flex-col items-center text-center bg-white rounded-2xl py-8 px-6 shadow-sm'>
              <span className='material-symbols-outlined text-[#7D5B20] text-4xl mb-3'>{s.icon}</span>
              <div className='text-3xl sm:text-4xl font-semibold text-[#6c5b48] mb-1'>{s.n}</div>
              <p className='text-sm text-gray-600 leading-snug'>{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className='text-center'>
          <Link href='/artisanflow'
               className='inline-flex items-center gap-2 text-sm sm:text-base text-[#7D5B20] font-semibold hover:underline underline-offset-4'>
            Explore ArtisanFlow — our end-to-end supply chain traceability platform
            <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
