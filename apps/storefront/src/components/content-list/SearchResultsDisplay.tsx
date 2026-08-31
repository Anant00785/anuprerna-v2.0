import Link from 'next/link';
import Img from '@/components/ui/Img';
import SearchProductGrid from './SearchProductGrid';
import { formatOrdinalDate } from './formatDate';
import type { SearchResults, StoryItem, BlogItem } from './loom';

// Loom search caps at limit=50; when we receive exactly 50, it's almost
// certainly a capped/truncated set, so we present it honestly as 'top 50'
// rather than implying an exact total.
const SEARCH_CAP = 50;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function StoryCardSmall({ story }: { story: StoryItem }) {
  const href = '/story-details/' + story.slug + '/' + story.id;
  const excerpt = stripHtml(story.description).slice(0, 90);
  return (
    <Link href={href} className='group block'>
      <div className='relative w-full overflow-hidden bg-sand' style={{ paddingBottom: '60%' }}>
        <Img
          src={story.bannerImageDesktop}
          alt={story.title}
          fill
          sizes='(max-width:640px) 100vw, 33vw'
          className='object-cover transition-transform duration-500 group-hover:scale-105'
        />
      </div>
      <div className='mt-3'>
        <p className='text-[10px] uppercase tracking-widest text-bark mb-1'>{story.storyContentCategory?.name}</p>
        <h3 className='text-sm font-medium text-clayd line-clamp-2 group-hover:text-clay transition-colors'>{story.title}</h3>
        <p className='mt-1 text-xs text-black/55 line-clamp-2'>{excerpt}</p>
        <p className='mt-1.5 text-[11px] text-black/40'>{formatOrdinalDate(story.lastUpdateTime || story.timeOfCreation)} · {story.readingTime} min read</p>
      </div>
    </Link>
  );
}

function BlogCardSmall({ blog }: { blog: BlogItem }) {
  const href = '/blogs/' + blog.slug + '/' + blog.id;
  const excerpt = stripHtml(blog.description).slice(0, 90);
  return (
    <Link href={href} className='group block'>
      <div className='relative w-full overflow-hidden bg-sand' style={{ paddingBottom: '60%' }}>
        <Img
          src={blog.bannerImageDesktop}
          alt={blog.title}
          fill
          sizes='(max-width:640px) 100vw, 33vw'
          className='object-cover transition-transform duration-500 group-hover:scale-105'
        />
      </div>
      <div className='mt-3'>
        <p className='text-[10px] uppercase tracking-widest text-bark mb-1'>{blog.blogContentCategory?.name}</p>
        <h3 className='text-sm font-medium text-clayd line-clamp-2 group-hover:text-clay transition-colors'>{blog.title}</h3>
        <p className='mt-1 text-xs text-black/55 line-clamp-2'>{excerpt}</p>
        <p className='mt-1.5 text-[11px] text-black/40'>{formatOrdinalDate(blog.lastUpdateTime || blog.timeOfCreation)} · {blog.readingTime} min read</p>
      </div>
    </Link>
  );
}

export default function SearchResultsDisplay({
  term,
  results,
  suggestion,
}: {
  term: string;
  results: SearchResults;
  suggestion?: string | null;
}) {
  const { products, stories, blogs } = results;
  const totalProducts = products.length;
  const capped = totalProducts >= SEARCH_CAP;
  const hasContent = stories.length > 0 || blogs.length > 0;

  // Honest count label: when capped, say 'top 50' (we don't know the true total).
  const countLabel = capped
    ? 'Showing top ' + SEARCH_CAP + ' products'
    : 'Showing ' + totalProducts + ' product' + (totalProducts === 1 ? '' : 's');

  return (
    <div className='w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-16'>
      {/* 'Did you mean…' — shown when the query is a close miss against a
          catalogue term (typo) so the buyer can recover with one click. */}
      {suggestion && (
        <p className='mt-8 text-sm text-black/70'>
          Did you mean{' '}
          <Link
            href={'/display/search?search=' + encodeURIComponent(suggestion)}
            className='text-clay font-medium underline underline-offset-2 hover:text-clayd'
          >
            {suggestion}
          </Link>
          ?
        </p>
      )}

      {/* Product results — 4-col grid + View More pagination */}
      {totalProducts > 0 && (
        <section className='mt-10'>
          <p className='text-sm text-black/60 mb-5'>{countLabel}</p>
          <SearchProductGrid products={products} />
        </section>
      )}

      {/* Crafts-matching section (stories + blogs) */}
      {hasContent && (
        <section className='mt-14'>
          <h2 className='text-base font-medium text-black mb-6'>
            Crafts matching{' '}
            <span className='text-clay'>{term}</span>
          </h2>

          {stories.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8'>
              {stories.map((s) => (
                <StoryCardSmall key={s.id} story={s} />
              ))}
            </div>
          )}

          {blogs.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
              {blogs.map((b) => (
                <BlogCardSmall key={b.id} blog={b} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {totalProducts === 0 && !hasContent && (
        <div className='text-center py-20'>
          <p className='text-black/50'>No results found for &ldquo;{term}&rdquo;. Try a different search term.</p>
        </div>
      )}
    </div>
  );
}
