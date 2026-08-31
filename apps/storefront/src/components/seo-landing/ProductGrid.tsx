import type { SeoProduct } from './loom';
import CardPrice from './CardPrice';

interface ProductGridProps {
  products: SeoProduct[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) {
    return (
      <p className="col-span-full text-center text-gray-500 py-8">
        No products found for this collection.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: SeoProduct }) {
  const href = `/product/${product.productGroup}-product/${product.slug}`;

  return (
    <a
      href={href}
      className="group rounded-[12px] border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
    >
      {/* Image with hover-swap */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* Primary image */}
        <img
          src={product.heroImage}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
        />
        {/* Hover image */}
        <img
          src={product.hoverImage || product.heroImage}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-serif text-base font-semibold text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-1">{product.sku}</p>
        {product.specialStatus && (
          <span className="inline-block text-xs font-medium text-clay bg-sand px-2 py-0.5 rounded-full mb-2 w-fit">
            {product.specialStatus}
          </span>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-gray-900">
            <CardPrice price={product.price} />
            <span className="text-xs text-gray-500 font-normal">/{product.unit || 'meter'}</span>
          </span>
          <span className="text-xs bg-gray-900 text-white px-3 py-1 rounded-full">
            View Details
          </span>
        </div>
      </div>
    </a>
  );
}
