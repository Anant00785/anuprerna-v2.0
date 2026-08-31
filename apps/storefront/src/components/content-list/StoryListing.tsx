'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import CategoryTabs from './CategoryTabs';
import StoryCard from './StoryCard';
import type { StoryItem } from './loom';

// Tab definitions match the live site's story filter row exactly.
const TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Organic & Natural', value: 'CRAFTS' },
  { label: 'Indian Premium Silk', value: 'INDIAN_PREMIUM_SILK' },
  { label: 'Resist Dyed', value: 'RESIST_DYED' },
  { label: 'Embroidery', value: 'EMBROIDERY' },
  { label: 'Printing', value: 'PRINTING' },
  { label: 'Dyed Plain Weaves', value: 'DYED_PLAIN_WEAVES' },
  { label: 'Collaborations', value: 'COLLABORATIONS' },
];

// URL <-> tab mapping: ?category=<lowercased value> (shareable, deep-linkable)
const VALUE_TO_PARAM = (v: string) => v.toLowerCase().replace(/_/g, '-');
const PARAM_TO_VALUE = (p: string): string => {
  const norm = p.toUpperCase().replace(/-/g, '_');
  return TABS.some((t) => t.value === norm) ? norm : 'ALL';
};

const PAGE_SIZE = 30;

// Map a story to the correct tab based on storyContentType + category name.
function storyMatchesTab(s: StoryItem, tab: string): boolean {
  if (tab === 'ALL') return true;
  const type = (s.storyContentCategory?.storyContentType ?? '').toUpperCase();
  const nameRaw = (s.storyContentCategory?.name ?? '').toUpperCase();
  if (tab === 'COLLABORATIONS') return type === 'COLLABORATIONS';
  if (type !== 'CRAFTS' && type !== 'CLUSTERS') return false;
  if (tab === 'CRAFTS') return nameRaw.includes('ORGANIC') || nameRaw.includes('NATURAL');
  if (tab === 'INDIAN_PREMIUM_SILK') return nameRaw.includes('SILK');
  if (tab === 'RESIST_DYED') return nameRaw.includes('RESIST');
  if (tab === 'EMBROIDERY') return nameRaw.includes('EMBROIDERY');
  if (tab === 'PRINTING') return nameRaw.includes('PRINT');
  if (tab === 'DYED_PLAIN_WEAVES') return nameRaw.includes('DYED') || nameRaw.includes('PLAIN') || nameRaw.includes('WALL');
  return false;
}

export default function StoryListing({ stories }: { stories: StoryItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hydrate active tab from ?category= on load
  const initialTab = PARAM_TO_VALUE(searchParams.get('category') ?? '');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Keep tab in sync if the URL changes (back/forward, external links)
  useEffect(() => {
    const fromUrl = PARAM_TO_VALUE(searchParams.get('category') ?? '');
    setActiveTab(fromUrl);
  }, [searchParams]);

  const handleSelect = useCallback(
    (value: string) => {
      setActiveTab(value);
      setVisible(PAGE_SIZE);
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value === 'ALL') params.delete('category');
      else params.set('category', VALUE_TO_PARAM(value));
      const qs = params.toString();
      router.replace(qs ? pathname + '?' + qs : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const filtered = useMemo(
    () => stories.filter((s) => storyMatchesTab(s, activeTab)),
    [stories, activeTab],
  );

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <>
      <CategoryTabs tabs={TABS} active={activeTab} onSelect={handleSelect} />

      {filtered.length === 0 ? (
        <p className='text-center text-black/50 py-16'>No stories found in this category.</p>
      ) : (
        <>
          <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10'>
            {shown.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>

          {hasMore && (
            <div className='flex justify-center mt-12'>
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className='rounded border border-[#D1D4DB] text-clay font-medium text-sm py-2 px-6 hover:border-clay transition-colors'
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
