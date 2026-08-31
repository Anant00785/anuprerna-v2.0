import { searchProducts, adsSlugToKeyword, getLatestBlogs } from '@/components/seo-landing/loom';
import AdsLandingPage from '@/components/seo-landing/AdsLandingPage';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slugToTitle(slug);
  return {
    title: `${title} — Handloom Fabric | Anuprerna`,
    description: `Discover ${title.toLowerCase()} from Anuprerna — artisan-crafted handloom fabrics with flexible MOQs, custom dyeing, and global delivery.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const title = slugToTitle(slug);
  const keyword = adsSlugToKeyword(slug);
  const [products, blogs] = await Promise.all([
    searchProducts(keyword),
    getLatestBlogs(4),
  ]);

  return <AdsLandingPage slug={slug} title={title} products={products} blogs={blogs} />;
}
