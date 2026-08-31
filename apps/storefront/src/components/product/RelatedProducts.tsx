import Img from '@/components/ui/Img';
import type { CatalogueProduct } from '@/components/catalogue/types';
import RelatedProductPrice from './RelatedProductPrice';

interface RelatedProductsProps {
  products: CatalogueProduct[];
  title?: string;
}

export default function RelatedProducts({
  products,
  title = 'You May Also Like',
}: RelatedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className='mt-16'>
      <h2 className='text-xl font-medium text-black mb-6'>{title}</h2>
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
        {products.slice(0, 8).map((p) => {
          const href = `/product/${p.productGroup}-product/${p.slug}`;
          const craftLabel = p.subCategoryName || p.segmentName;
          return (
            <a
              key={p.id}
              href={href}
              className='group flex flex-col rounded-xl border border-gray-100 bg-cream overflow-hidden hover:shadow-md transition-shadow'
            >
              <div className='relative aspect-square overflow-hidden bg-sand'>
                <Img
                  src={p.heroImage}
                  alt={p.heroImageAlt || p.name}
                  fill
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                  className='object-cover transition-transform duration-500 group-hover:scale-105'
                />
                {p.hoverImage && p.hoverImage !== p.heroImage && (
                  <Img
                    src={p.hoverImage}
                    alt={p.hoverImageAlt || p.name}
                    fill
                    sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                    className='object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 absolute inset-0'
                  />
                )}
              </div>
              <div className='p-3 flex flex-col gap-1'>
                {craftLabel && (
                  <span className='text-[10px] uppercase tracking-widest text-bark truncate'>
                    {craftLabel}
                  </span>
                )}
                <h3 className='text-sm text-gray-800 line-clamp-2 group-hover:text-clay transition-colors'>
                  {p.name}
                </h3>
                <RelatedProductPrice price={p.calculatedPrice} unit={p.unit} />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
