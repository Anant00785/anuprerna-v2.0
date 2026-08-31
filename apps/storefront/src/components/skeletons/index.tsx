// -----------------------------------------------------------------------------
// Route skeletons — server components (no client JS). Rendered by loading.tsx
// files while a page's data resolves, so slower pages show their real STRUCTURE
// instantly instead of a frozen blank screen. Tasteful pulse via Tailwind's
// animate-pulse on neutral sand blocks matched to the storefront palette.
// -----------------------------------------------------------------------------

function Block({ className = '' }: { className?: string }) {
  return <div className={'rounded bg-sand ' + className} />;
}

// ---- PLP / catalogue / search-results: sidebar + grid of product cards ------
export function PlpSkeleton() {
  return (
    <main className='min-h-screen bg-white pb-20 animate-pulse'>
      <div className='mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8'>
        <Block className='h-3 w-40 mb-6' />
        <div className='flex gap-8 items-start'>
          {/* Sidebar */}
          <aside className='hidden lg:block w-64 lg:w-72 shrink-0 self-start space-y-6'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='space-y-3'>
                <Block className='h-4 w-32' />
                <Block className='h-3 w-full' />
                <Block className='h-3 w-5/6' />
                <Block className='h-3 w-2/3' />
              </div>
            ))}
          </aside>
          {/* Grid */}
          <section className='flex-1 min-w-0'>
            <div className='hidden md:flex items-center justify-between mb-8'>
              <Block className='h-5 w-40' />
              <Block className='h-8 w-32' />
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className='flex flex-col rounded-xl border border-gray-100 bg-cream overflow-hidden'>
                  <Block className='aspect-[3/4] w-full rounded-none' />
                  <div className='p-3 space-y-2'>
                    <Block className='h-2.5 w-16' />
                    <Block className='h-3.5 w-full' />
                    <Block className='h-4 w-20 mt-1' />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

// ---- PDP: image gallery box + title/price info panel ------------------------
export function PdpSkeleton() {
  return (
    <main className='min-h-screen bg-white animate-pulse'>
      <div className='mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-6'>
        <Block className='h-3 w-56 mb-6' />
        <div className='flex flex-col lg:flex-row gap-8 lg:gap-12'>
          {/* Gallery */}
          <div className='lg:w-1/2 flex gap-3'>
            <div className='hidden sm:flex flex-col gap-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Block key={i} className='h-16 w-16' />
              ))}
            </div>
            <Block className='flex-1 aspect-square w-full rounded-xl' />
          </div>
          {/* Info panel */}
          <div className='lg:w-1/2 space-y-5'>
            <Block className='h-3 w-24' />
            <Block className='h-7 w-3/4' />
            <Block className='h-5 w-32' />
            <div className='space-y-2 pt-2'>
              <Block className='h-3 w-full' />
              <Block className='h-3 w-5/6' />
              <Block className='h-3 w-4/6' />
            </div>
            <Block className='h-11 w-full max-w-xs mt-4' />
            <Block className='h-11 w-full max-w-xs' />
            <div className='flex gap-3 pt-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Block key={i} className='h-10 w-24' />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ---- Article / story / blog / content detail --------------------------------
export function ArticleSkeleton() {
  return (
    <main className='min-h-screen bg-white animate-pulse'>
      <div className='mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8'>
        <Block className='h-3 w-48 mb-6' />
        <Block className='h-9 w-5/6 mb-3' />
        <Block className='h-4 w-40 mb-8' />
        <Block className='aspect-[16/7] w-full rounded-xl mb-10' />
        <div className='flex gap-10'>
          <article className='flex-1 min-w-0 space-y-3'>
            {Array.from({ length: 10 }).map((_, i) => (
              <Block key={i} className={'h-3 ' + (i % 4 === 3 ? 'w-2/3' : 'w-full')} />
            ))}
            <Block className='h-40 w-full rounded-lg my-6' />
            {Array.from({ length: 6 }).map((_, i) => (
              <Block key={i} className={'h-3 ' + (i % 3 === 2 ? 'w-1/2' : 'w-full')} />
            ))}
          </article>
          <aside className='hidden lg:block w-64 shrink-0 space-y-3'>
            <Block className='h-4 w-32' />
            {Array.from({ length: 6 }).map((_, i) => (
              <Block key={i} className='h-3 w-full' />
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}

// ---- Search / display results: search box + results grid --------------------
export function SearchSkeleton() {
  return (
    <main className="min-h-screen bg-white animate-pulse">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10">
        <Block className="h-12 w-full max-w-2xl mx-auto mb-10 rounded-full" />
        <Block className="h-4 w-40 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-gray-100 bg-cream overflow-hidden">
              <Block className="aspect-[3/4] w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Block className="h-3.5 w-full" />
                <Block className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
