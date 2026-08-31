'use client';

import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import Link from 'next/link';
import Img from '@/components/ui/Img';
import type { SearchProduct } from './loom';

function ProductCard({ product }: { product: SearchProduct }) {
  const { formatCode } = useCurrency();
  const href = '/product/' + product.productGroup + '-product/' + product.slug;
  return (
    <Link href={href} className='group block'>
      <div className='relative w-full bg-sand overflow-hidden' style={{ paddingBottom: '100%' }}>
        <Img
          src={product.heroImage}
          alt={product.heroImageAltText || product.name}
          fill
          sizes='(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw'
          className='object-cover transition-transform duration-500 group-hover:scale-105'
        />
        <span className='absolute top-2 right-2 material-symbols-outlined text-white text-xl drop-shadow z-10 opacity-0 group-hover:opacity-100 transition-opacity'>
          favorite
        </span>
      </div>
      <div className='mt-2.5 px-0.5'>
        <p className='text-[10px] uppercase tracking-wider text-bark mb-0.5'>{product.specialStatus}</p>
        <h3 className='text-xs font-medium text-black leading-snug line-clamp-2 group-hover:text-clay transition-colors'>
          {product.name}
        </h3>
        <p className='mt-1 text-sm font-semibold text-clay'>{formatCode(product.price)}</p>
        <p className='text-[10px] text-black/40 uppercase tracking-wide'>per {product.unit.toLowerCase()}</p>
      </div>
    </Link>
  );
}

const PAGE_SIZE = 8;

export default function SearchProductGrid({ products }: { products: SearchProduct[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = products.slice(0, visible);
  const hasMore = visible < products.length;

  return (
    <>
      {/* Live shows 4 columns on large screens */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8'>
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {hasMore && (
        <div className='flex justify-center mt-10'>
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className='flex items-center gap-1 rounded border border-[#D1D4DB] text-clay font-medium text-sm py-2 px-4 hover:border-clay transition-colors'
          >
            View More Products
            <svg width='16' height='14' viewBox='0 0 16 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M8.54036 6.98577L5.34985 4.09827L6.04274 3.47119L9.92614 6.98577L6.04274 10.5004L5.34985 9.87327L8.54036 6.98577Z' fill='#7D5A20' />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
