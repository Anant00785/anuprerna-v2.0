'use client';

import ProductCard from './ProductCard';
import type { CatalogueProduct } from './types';

interface ProductGridProps {
  products: CatalogueProduct[];
  aspect?: 'square' | 'portrait';
  /** With a sidebar present, the grid is 3-up at lg; standalone is 4-up. */
  withSidebar?: boolean;
  /** Whether a BFF fetch is in flight. */
  loading?: boolean;
  /** Catalogue group — gates the inline Order-Swatch action (fabric only). */
  group?: 'fabric' | 'finished';
  /** SWATCH_PRICE_PERCENTAGE — enables the inline card Order-Swatch action. */
  swatchPercentage?: number;
  /** Called when the user clicks "Login to get bulk price" on a card. */
  onLoginClick?: () => void;
}

export default function ProductGrid({
  products,
  aspect = 'square',
  withSidebar = true,
  loading = false,
  group = 'fabric',
  swatchPercentage,
  onLoginClick,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!products.length) {
    return (
      <p className="col-span-full text-center text-gray-500 py-16">
        No products match &mdash; adjust your filters.
      </p>
    );
  }

  const gridCols = withSidebar
    ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={"grid " + gridCols + " gap-4 lg:gap-5"}>
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          aspect={aspect}
          group={group}
          swatchPercentage={swatchPercentage}
          onLoginClick={onLoginClick}
        />
      ))}
    </div>
  );
}
