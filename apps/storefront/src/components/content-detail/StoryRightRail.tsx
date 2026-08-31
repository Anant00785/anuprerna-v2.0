import Link from 'next/link';
import type { ContentPreview, RelatedContentItem } from './loom';

// ---------------------------------------------------------------------------
// StoryRightRail — story-detail right sidebar (mirrors live fb-story-details-about):
//   1. About Us card + "Discover Our Impact" CTA
//   2. Related Stories list (from /recommended) + prev/next links
// ---------------------------------------------------------------------------

interface StoryRightRailProps {
  recommended: ContentPreview[];
  previousStory?: RelatedContentItem | null;
  nextStory?: RelatedContentItem | null;
}

function RailLink({ slug, id, title }: { slug: string; id: number; title: string }) {
  return (
    <div className='w-full flex items-start gap-1 pr-2'>
      <span className='material-symbols-outlined mt-0.5 text-[15px] leading-none text-[#7d5b1f]'>
        arrow_right
      </span>
      <Link
        href={'/story-details/' + slug + '/' + id}
        className='my-1 text-xs capitalize text-black/75 hover:underline'
      >
        {title.toLowerCase()}
      </Link>
    </div>
  );
}

export default function StoryRightRail({
  recommended,
  previousStory,
  nextStory,
}: StoryRightRailProps) {
  // De-dupe prev/next that already appear in the recommended list (matches live ngOnChanges).
  const recIds = new Set(recommended.map((r) => r.id));
  const showNext = nextStory && nextStory.id && !recIds.has(nextStory.id);
  const showPrev = previousStory && previousStory.id && !recIds.has(previousStory.id);

  return (
    <div className='flex flex-col gap-4'>
      {/* About Us */}
      <div className='flex flex-col items-start'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className='rounded-md object-cover w-full max-h-[220px] aspect-square mb-2'
          src='https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-1.png'
          alt='Anuprerna'
        />
        <h2 className='text-[#7d5b1f] text-lg font-semibold py-1'>About Us</h2>
        <p className='text-sm text-left text-black/75 leading-relaxed'>
          Discover Anuprerna&rsquo;s sustainable handloom fabrics crafted by 500+ skilled artisans
          in East India. We also offer low MOQ custom manufacturing of apparel, stoles, scarves,
          handbags, and home furnishings in organic khadi, cotton, linen, wool, bamboo, mulberry,
          ahimsa silk and more.
        </p>
        <Link
          href='/content/about-us/about-our-impact/57938'
          className='w-max mt-4 bg-[#fffcf7] hover:bg-white hover:shadow-md rounded-md border-2 border-[#8E7862] text-[#8E7862] py-1 px-3 hover:border-[#6c5b48] transition flex items-center justify-center gap-2 text-sm'
        >
          Discover Our Impact
        </Link>
      </div>

      {/* Related Stories */}
      {(recommended.length > 0 || showNext || showPrev) && (
        <div className='hidden md:flex flex-col items-start mt-2'>
          <h2 className='text-[#7d5b1f] text-lg font-semibold mb-1'>Related Stories</h2>
          {recommended.map((rec) => (
            <RailLink key={rec.id} slug={rec.slug} id={rec.id} title={rec.title} />
          ))}
          {showNext && nextStory && (
            <RailLink slug={nextStory.slug} id={nextStory.id} title={nextStory.title} />
          )}
          {showPrev && previousStory && (
            <RailLink slug={previousStory.slug} id={previousStory.id} title={previousStory.title} />
          )}
        </div>
      )}
    </div>
  );
}
