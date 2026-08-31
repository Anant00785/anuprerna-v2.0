import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProduct } from '@/components/product/loom';
import Img from '@/components/ui/Img';

export const revalidate = 1800;

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SingleImagePage({
  params,
}: {
  params: Promise<{ category: string; slug: string; image: string }>;
}) {
  const { category, slug, image } = await params;
  const idx = parseInt(image, 10);

  const norm = await getProduct(category, slug);
  if (!norm || norm === 'unavailable') notFound();

  const { images } = norm;
  if (isNaN(idx) || idx < 0 || idx >= images.length) notFound();

  const current = images[idx];
  const prevIdx = (idx - 1 + images.length) % images.length;
  const nextIdx = (idx + 1) % images.length;

  return (
    <div className='min-h-screen bg-black flex flex-col'>
      {/* Top bar */}
      <div className='flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur'>
        <Link
          href={`/product/gallery/${category}/${slug}`}
          className='flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors'
        >
          <span className='material-symbols-outlined text-[18px]'>arrow_back</span>
          All images
        </Link>
        <span className='text-white/50 text-sm'>{idx + 1} / {images.length}</span>
        <Link
          href={`/product/${category}/${slug}`}
          className='text-white/70 hover:text-white text-sm transition-colors flex items-center gap-1'
        >
          <span className='material-symbols-outlined text-[18px]'>shopping_bag</span>
          View product
        </Link>
      </div>

      {/* Main image */}
      <div className='flex-1 flex items-center justify-center relative px-4 py-6'>
        <div className='relative w-full max-w-3xl aspect-square'>
          <Img
            src={current.src}
            alt={current.alt}
            fill
            priority
            sizes='(max-width: 1024px) 100vw, 768px'
            className='object-contain'
          />
        </div>

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <Link
              href={`/product/gallery/${category}/${slug}/${prevIdx}`}
              aria-label='Previous image'
              className='absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'
            >
              <span className='material-symbols-outlined'>chevron_left</span>
            </Link>
            <Link
              href={`/product/gallery/${category}/${slug}/${nextIdx}`}
              aria-label='Next image'
              className='absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'
            >
              <span className='material-symbols-outlined'>chevron_right</span>
            </Link>
          </>
        )}
      </div>

      {/* Thumbnail strip at bottom */}
      {images.length > 1 && (
        <div className='flex justify-center gap-2 px-4 pb-4 overflow-x-auto'>
          {images.map((img, i) => (
            <Link
              key={img.src}
              href={`/product/gallery/${category}/${slug}/${i}`}
              aria-label={`Image ${i + 1}`}
              className={
                'relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ' +
                (i === idx ? 'border-white' : 'border-transparent hover:border-white/40')
              }
            >
              <Img src={img.src} alt={img.alt} fill sizes='56px' className='object-cover' />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
