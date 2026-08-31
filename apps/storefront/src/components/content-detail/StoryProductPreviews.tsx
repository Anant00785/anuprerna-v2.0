import Link from 'next/link';
import Img from '@/components/ui/Img';
import type { StoryProduct } from './loom';

// ---------------------------------------------------------------------------
// StoryProductPreviews — horizontal scroll row of fabric products linked to the story
// ---------------------------------------------------------------------------

function formatPrice(price: number, unit: string): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
  return formatted + (unit ? ' / ' + unit.toLowerCase() : '');
}

function buildProductHref(product: StoryProduct): string {
  const group = (product.product_group ?? 'fabric').toLowerCase();
  if (group === 'finished') return '/product/finished-product/' + product.slug;
  return '/product/fabric-product/' + product.slug;
}

interface StoryProductPreviewsProps {
  products: StoryProduct[];
  heading?: string;
}

export default function StoryProductPreviews({ products, heading }: StoryProductPreviewsProps) {
  if (!products || products.length === 0) return null;

  const display = products.slice(0, 6);

  return (
    <section className='mt-10 pt-6 border-t border-black/10'>
      <h2 className='text-base font-semibold text-black mb-4'>
        {heading ?? 'Featured Products'}
      </h2>
      {/* Mobile: horizontal scroll — Desktop: wrap grid */}
      <div className='flex lg:flex-wrap gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1'>
        {display.map((product) => (
          <Link
            key={product.id}
            href={buildProductHref(product)}
            className='group flex-shrink-0 w-36 lg:w-auto lg:basis-[calc(33.333%-0.75rem)]'
          >
            {/* Image */}
            <div
              className='relative w-full overflow-hidden bg-sand'
              style={{ paddingBottom: '100%' }}
            >
              <Img
                src={product.hero_image}
                alt={product.name}
                fill
                sizes='(max-width:640px) 144px, 200px'
                className='object-cover transition-transform duration-500 group-hover:scale-105'
              />
            </div>
            {/* Info */}
            <div className='mt-2 px-0.5'>
              <p className='text-xs font-medium text-black leading-snug line-clamp-2 group-hover:text-clay transition-colors'>
                {product.name}
              </p>
              <p className='mt-1 text-xs text-black/60'>
                {formatPrice(product.price, product.unit)}
              </p>
              <p className='mt-0.5 text-[10px] text-bark'>Login for bulk price</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
