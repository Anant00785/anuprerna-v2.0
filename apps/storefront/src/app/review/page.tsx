import { getReviewStats } from '@/components/misc-pages/loom';
import ReviewList from '@/components/misc-pages/ReviewList';

export const metadata = { title: 'Customer Reviews — Anuprerna' };

export default async function ReviewPage() {
  const stats = await getReviewStats();
  // Render the count + star rating ONLY when REAL Loom stats exist. Never invent numbers.
  const count = stats?.count ?? 0;
  const rating = stats?.rating ?? 0;
  const hasStats = count > 0;

  return (
    <main className='min-h-[60vh] bg-white text-black'>
      <section className='mx-auto max-w-screen-xl px-5 pt-10 pb-20'>
        {/* Header */}
        <h1 className='text-2xl sm:text-5xl text-[#7D5B20] font-medium mb-2'>
          Hear from our <span className='text-black'>Customers</span>
        </h1>
        {hasStats ? (
          <div className='flex items-center gap-2 mb-8'>
            <span className='text-lg sm:text-xl'>{count.toLocaleString('en-IN')} Shop Reviews</span>
            <StarRow rating={rating} />
          </div>
        ) : (
          // Keep the vertical rhythm stable when there are no stats to show.
          <div className='mb-8' />
        )}

        {/* Review list with pagination */}
        <ReviewList />
      </section>
    </main>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#9c8a6c' : '#d3d3d3' }}>&#9733;</span>
      ))}
    </div>
  );
}
