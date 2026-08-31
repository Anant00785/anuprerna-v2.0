import { searchProducts } from '@/components/seo-landing/loom';
import WholesalerCityPage from '@/components/seo-landing/WholesalerCityPage';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ city: string }>;
}

function slugToCity(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = slugToCity(citySlug);
  return {
    title: `Premium Fabric Wholesale Supplier in ${city} | Anuprerna`,
    description: `Anuprerna is a premium handloom fabric wholesale supplier in ${city}. Source artisan-crafted fabrics with flexible MOQs and global delivery.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { city: citySlug } = await params;
  const city = slugToCity(citySlug);
  const keyword = `${city.toLowerCase()} fabric wholesale`;
  // Fallback to generic cotton fabric search if city-specific returns nothing
  const products = await searchProducts(keyword, 12);

  return <WholesalerCityPage city={city} slug={citySlug} products={products} />;
}
