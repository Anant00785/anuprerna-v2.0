import Link from 'next/link';
import Img from '@/components/ui/Img';
import type { StoryItem } from './loom';
import { formatOrdinalDate } from './formatDate';

// Strips HTML tags for the excerpt
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function StoryCard({ story }: { story: StoryItem }) {
  const excerpt = stripHtml(story.description).slice(0, 120);
  const href = '/story-details/' + story.slug + '/' + story.id;

  return (
    <Link href={href} className='group block'>
      {/* Image */}
      <div className='relative w-full overflow-hidden bg-sand' style={{ paddingBottom: '66.67%' }}>
        <Img
          src={story.bannerImageDesktop}
          alt={story.title}
          fill
          sizes='(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw'
          className='object-cover transition-transform duration-500 group-hover:scale-105'
        />
      </div>
      {/* Meta */}
      <div className='mt-3 px-0.5'>
        <p className='text-[10px] uppercase tracking-widest text-bark mb-1'>
          {story.storyContentCategory?.name}
        </p>
        <h3 className='text-sm font-medium text-clayd leading-snug line-clamp-2 group-hover:text-clay transition-colors'>
          {story.title}
        </h3>
        {excerpt && (
          <p className='mt-1.5 text-xs text-black/60 leading-relaxed line-clamp-2'>{excerpt}</p>
        )}
        <p className='mt-2 text-[11px] text-black/45'>
          Published on {formatOrdinalDate(story.lastUpdateTime || story.timeOfCreation)}
        </p>
      </div>
    </Link>
  );
}
