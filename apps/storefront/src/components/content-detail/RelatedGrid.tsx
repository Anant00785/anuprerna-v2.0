import Link from 'next/link';
import Img from '@/components/ui/Img';
import type { RelatedContentItem } from './loom';
import { formatOrdinalDate } from '../content-list/formatDate';

// ---------------------------------------------------------------------------
// RelatedGrid — "More Stories" / "More Blogs" 3-up card grid
// ---------------------------------------------------------------------------

interface RelatedCard {
  id: number;
  slug: string;
  title: string;
  bannerImageDesktop: string;
  timeOfCreation?: number;
  category?: string;
}

interface RelatedGridProps {
  items: RelatedCard[];
  variant: 'story' | 'blog';
  heading?: string;
}

function buildHref(variant: 'story' | 'blog', slug: string, id: number): string {
  if (variant === 'story') return '/story-details/' + slug + '/' + id;
  return '/blogs/' + slug + '/' + id;
}

export default function RelatedGrid({ items, variant, heading }: RelatedGridProps) {
  if (!items || items.length === 0) return null;

  const label = heading ?? (variant === 'story' ? 'More Stories' : 'More Articles');

  return (
    <section className='mt-12 pt-8 border-t border-black/10'>
      <h2 className='text-xl font-bold text-black mb-6'>{label}</h2>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        {items.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            href={buildHref(variant, item.slug, item.id)}
            className='group block'
          >
            {/* Image */}
            <div
              className='relative w-full overflow-hidden bg-sand'
              style={{ paddingBottom: '66.67%' }}
            >
              <Img
                src={item.bannerImageDesktop}
                alt={item.title}
                fill
                sizes='(max-width:640px) 100vw, 33vw'
                className='object-cover transition-transform duration-500 group-hover:scale-105'
              />
            </div>
            {/* Text */}
            <div className='mt-3'>
              {item.category && (
                <p className='text-[10px] uppercase tracking-widest text-bark mb-1'>
                  {item.category}
                </p>
              )}
              <h3 className='text-sm font-medium text-black leading-snug line-clamp-2 group-hover:text-clay transition-colors'>
                {item.title}
              </h3>
              {item.timeOfCreation != null && (
                <p className='mt-1 text-[11px] text-black/45'>
                  {formatOrdinalDate(item.timeOfCreation)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
