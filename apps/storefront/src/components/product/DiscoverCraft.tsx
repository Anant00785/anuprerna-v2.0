import Link from 'next/link';
import Img from '@/components/ui/Img';
import { formatOrdinalDate } from '@/components/content-list/formatDate';
import type { StoryItem } from '@/components/content-list/loom';

interface DiscoverCraftProps {
  stories: StoryItem[];
}

// Fabric PDP "Discover The Craft" — mirrors live's fb-product-content-cards.
// DATA-DRIVEN from /get/story/related/product/{recordId}: the craft + cluster
// stories tied to this product (title, category, banner, publish date, slug/id).
// Each card deep-links to the in-app /story-details/{slug}/{id} route (live's
// /stories/... 301s there). FABRIC-ONLY.
export default function DiscoverCraft({ stories }: DiscoverCraftProps) {
  if (!stories || stories.length === 0) return null;

  return (
    <section className='mt-16'>
      <h2 className='mb-6 text-xl font-medium text-black'>Discover The Craft</h2>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-3'>
        {stories.map((s) => {
          // `StoryItem.title` is TYPED `string`, but /get/story/related/product/{id}
          // returns rows whose title is null, so `s.title.trim()` threw — and because
          // this renders inside the PDP body, the whole product section (including
          // Add to Cart) was replaced by the error boundary while the route still
          // answered 200. It read as an empty page rather than a failure.
          const title = String(s.title ?? '').trim();
          return (
            <Link
              key={s.id}
              href={'/story-details/' + s.slug + '/' + s.id}
              className='group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-cream transition-shadow hover:shadow-md'
            >
              <div className='relative h-[260px] w-full overflow-hidden bg-sand sm:h-[300px]'>
                <Img
                  src={s.bannerImageMobile || s.bannerImageDesktop}
                  alt={title}
                  fill
                  sizes='(max-width: 640px) 100vw, 50vw'
                  className='object-cover object-top transition-transform duration-500 group-hover:scale-105'
                />
              </div>
              <div className='p-3'>
                <h3 className='my-1 text-base font-medium capitalize text-black transition-colors group-hover:text-clay'>
                  {title.toLowerCase()}
                </h3>
                <p className='text-xs font-medium capitalize text-bark sm:text-sm'>
                  {(s.storyContentCategory?.name || '').toLowerCase()} | Published on {formatOrdinalDate(s.timeOfCreation)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
