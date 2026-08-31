import { Suspense } from 'react';
import { getStoryList } from '@/components/content-list/loom';
import StoryListing from '@/components/content-list/StoryListing';

export const revalidate = 300;

export default async function StoriesPage() {
  const stories = await getStoryList();

  return (
    <main className='bg-white min-h-screen'>
      <div className='mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14'>
        {/* Page heading */}
        <div className='mb-8'>
          <h1 className='text-2xl sm:text-3xl font-medium text-black tracking-tight'>Stories</h1>
        </div>

        {/* Category tabs + grid — client-side filtering */}
        <Suspense fallback={null}>
          <StoryListing stories={stories} />
        </Suspense>
      </div>
    </main>
  );
}
