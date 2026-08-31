import Img from '@/components/ui/Img';
import { relHref } from '@/lib/cms-html';
import type { BadgeItem } from './types';

interface KeyFeaturesProps {
  badges: BadgeItem[];
}

// Fabric PDP "Key Features" — mirrors live's fb-product-description Key Features
// block: the product's badge-profile items (GOTS for Chemicals/Colourants,
// Handwoven, Made in India, Ethically Made, Fair Trade, ...) rendered as round
// image chips inside a soft panel. Real Loom data (badgeProfileItemList) — no
// fabricated specs. FABRIC-ONLY: the finished PDP keeps the BadgeStrip
// ("Certifications & Ethics") presentation unchanged.
export default function KeyFeatures({ badges }: KeyFeaturesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <section className='w-full'>
      <h2 className='mb-2 text-base font-medium text-black/80'>Key Features</h2>
      <div className='rounded-lg bg-[#f9f7f4] p-4'>
        <div className='flex flex-wrap items-center justify-evenly gap-2 text-sm text-black/70'>
          {badges.map((b) => (
            <a
              key={b.id}
              href={relHref(b.link)}
              target='_blank'
              rel='noopener noreferrer'
              className='group flex w-16 flex-col items-center justify-center gap-1 text-center'
            >
              <div className='relative h-[35px] w-[35px] overflow-hidden rounded-full md:h-[50px] md:w-[50px]'>
                <Img
                  src={b.image}
                  alt={b.caption}
                  fill
                  sizes='50px'
                  className='object-cover transition-transform group-hover:scale-110'
                />
              </div>
              <p className='text-[12px] leading-tight'>{b.caption}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
