"use client";

import React from "react";
import { PLPProduct, FilterRelatedProduct } from "@/types/domain/plp";
import { FilterProductPreview } from "./FilterProductPreview";
import { FilterProductSkeleton } from "./FilterProductSkeleton";

interface FilterProductGridProps {
  products: PLPProduct[];
  isLoading?: boolean;
  relatedProductsMap?: Map<number, PLPProduct[]>;
}

export const FilterProductGrid: React.FC<FilterProductGridProps> = ({
  products,
  isLoading = false,
  relatedProductsMap = new Map(),
}) => {
  if (isLoading) {
    return (
      <div className="pb-5 px-2 grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-x-4 md:gap-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <FilterProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="w-full my-16 flex flex-col justify-center items-center gap-4">
        <img
          className="max-w-[220px] object-contain"
          src="/assets/img/noproduct_placehlder.png"
          alt="No products found"
        />
        <p className="text-gray-500 text-sm font-medium">No products match your selected filters.</p>
      </div>
    );
  }

  return (
    <div className="pb-5 px-2">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-x-4 md:gap-y-3">
        {products.map((product, idx) => {
          const swatches = relatedProductsMap.get(product.product_id) || [];
          return (
            <FilterProductPreview
              key={product.id || idx}
              index={idx}
              product={product}
              relatedProducts={swatches}
            />
          );
        })}
      </div>
    </div>
  );
};
