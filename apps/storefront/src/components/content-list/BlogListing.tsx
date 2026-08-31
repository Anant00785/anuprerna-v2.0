'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import CategoryTabs from './CategoryTabs';
import BlogCard from './BlogCard';
import type { BlogItem } from './loom';

// Match the live site tab order (from the mobile screenshot)
const TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Trends', value: 'TRENDS' },
  { label: 'Fabric & Fibers', value: 'FABRIC_FIBERS' },
  { label: 'Sustainable Supply Chain', value: 'SUSTAINABLE' },
  { label: 'Podcast', value: 'PODCAST' },
  { label: 'Client Collaborations', value: 'CLIENT' },
];

// URL <-> tab mapping: ?category=<lowercased value> (shareable, deep-linkable)
const VALUE_TO_PARAM = (v: string) => v.toLowerCase().replace(/_/g, '-');
const PARAM_TO_VALUE = (p: string): string => {
  const norm = p.toUpperCase().replace(/-/g, '_');
  return TABS.some((t) => t.value === norm) ? norm : 'ALL';
};

const PAGE_SIZE = 30;

function blogMatchesTab(blog: BlogItem, tab: string): boolean {
  if (tab === 'ALL') return true;
  const name = (blog.blogContentCategory?.name ?? '').toLowerCase();
  if (tab === 'TRENDS') return name.includes('trend');
  if (tab === 'FABRIC_FIBERS') return name.includes('fabric') || name.includes('fiber') || name.includes('fibre') || name.includes('textile') || name.includes('weaving') || name.includes('crafts') || name.includes('circular') || name.includes('spring');
  if (tab === 'SUSTAINABLE') return name.includes('sustainable') || name.includes('supply');
  if (tab === 'PODCAST') return name.includes('podcast');
  if (tab === 'CLIENT') return name.includes('client') || name.includes('collaboration');
  return false;
}

export default function BlogListing({ blogs }: { blogs: BlogItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab = PARAM_TO_VALUE(searchParams.get('category') ?? '');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [visible, setVisible] = useState(PAGE_SIZE);

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
    () => blogs.filter((b) => blogMatchesTab(b, activeTab)),
    [blogs, activeTab],
  );

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <>
      <CategoryTabs tabs={TABS} active={activeTab} onSelect={handleSelect} />

      {filtered.length === 0 ? (
        <p className='text-center text-black/50 py-16'>No posts found in this category.</p>
      ) : (
        <>
          <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10'>
            {shown.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
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
