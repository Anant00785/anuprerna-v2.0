import Img from '@/components/ui/Img';
import { relHref } from '@/lib/cms-html';
import type { BadgeItem } from './types';

interface BadgeStripProps {
  badges: BadgeItem[];
}

export default function BadgeStrip({ badges }: BadgeStripProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className='border border-sand rounded-xl p-4 bg-cream'>
      <p className='text-[10px] uppercase tracking-widest text-bark mb-4 text-center'>Certifications &amp; Ethics</p>
      <div className='flex flex-wrap justify-center gap-4'>
        {badges.map((b) => (
          <a
            key={b.id}
            href={relHref(b.link)}
            target='_blank'
            rel='noopener noreferrer'
            className='flex flex-col items-center gap-1.5 group w-16'
          >
            <div className='relative w-12 h-12 flex-shrink-0'>
              <Img
                src={b.image}
                alt={b.caption}
                fill
                sizes='48px'
                className='object-contain transition-transform group-hover:scale-110'
              />
            </div>
            <span className='text-[9px] uppercase tracking-wide text-bark text-center leading-tight'>
              {b.caption}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
