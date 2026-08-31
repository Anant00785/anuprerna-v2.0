import { notFound } from 'next/navigation';
import { getProduct } from '@/components/product/loom';
import ImageGallery from '@/components/product/ImageGallery';

export const revalidate = 1800;

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ProductGalleryPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  const norm = await getProduct(category, slug);
  if (!norm || norm === 'unavailable') notFound();

  return (
    <ImageGallery
      media={norm.media}
      images={norm.images}
      productSlug={slug}
      category={category}
      fullscreen
    />
  );
}
