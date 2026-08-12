"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PLPProduct } from "@/types/domain/plp";
import { useCurrencyStore } from "@/stores/currency.store";

interface FilterProductPreviewProps {
  product: PLPProduct;
  relatedProducts?: PLPProduct[];
  index?: number;
}

export const FilterProductPreview: React.FC<FilterProductPreviewProps> = ({
  product,
  relatedProducts = [],
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [inWishlist, setInWishlist] = useState(Boolean(product.inWishlist));

  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const currencyCode = selectedCurrency.toUpperCase();

  const rawBasePrice = Number(product.calculatedPrice || product.price || 0);
  const convertedBasePrice = convertPrice(rawBasePrice);
  const convertedDiscountedPrice = product.calculatedDiscountedPrice
    ? convertPrice(Number(product.calculatedDiscountedPrice))
    : null;

  // Determine badge text
  const isStockAvailable =
    product.total_quantity > 0 ||
    (product.quantity || 0) > 0 ||
    (product.size_profile_option_list || []).some((s) => s.quantity > 0);

  const badge = isStockAvailable ? "In Stock" : "Made to Order";

  const productUrl = `/product/${product.product_group || "fabric"}-product/${product.slug}`;
  const displayImage = isHovered && product.hover_image ? product.hover_image : product.hero_image;

  return (
    <div className="fb-filter-product-preview flex flex-col justify-between items-center relative bg-white border border-[#75787F]/20 shadow md:shadow-md rounded md:rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Stock Status Badge */}
      {badge && (
        <div
          className={`rounded px-2 py-1 text-xs absolute top-2 left-2 z-10 font-medium ${
            badge === "In Stock"
              ? "bg-[#e6eac6] text-[#7f8142]"
              : "bg-[#FFF8D0] text-[#ac9317]"
          }`}
        >
          {badge}
        </div>
      )}

      {/* Main Card Content Link */}
      <Link href={productUrl} className="w-full block group">
        <div className="px-3 pt-3 pb-1 relative overflow-hidden rounded md:rounded-lg">
          <div className="w-full aspect-square relative bg-gray-100 rounded md:rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage || "/assets/img/item.png"}
              alt={product.name}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              loading="lazy"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Special Status / Category Subtitle */}
        <div className="text-[#75787F] text-xs md:text-sm mt-3 mb-1.5 px-3 truncate">
          {product.special_status || product.category || "Handwoven Fabric"}
        </div>

        {/* Product Title */}
        <div className="text-black text-sm md:text-base mb-1 px-3 font-medium line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </div>

        {/* Price Display */}
        <div className="flex justify-start items-center mb-3 text-lg md:text-xl font-medium px-3 text-[#2E2E2E] flex-wrap sm:flex-nowrap">
          <span className="text-xs mr-1 text-[#75787F]">{currencyCode}</span>

          {!convertedDiscountedPrice ? (
            <span>
              {convertedBasePrice.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="line-through text-xs sm:text-sm text-[#898E9A]">
                {convertedBasePrice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-base sm:text-lg text-emerald-700 font-semibold">
                {convertedDiscountedPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          )}

          <span className="text-xs text-[#75787F] ml-1">/ {product.unit || "METER"}</span>
        </div>
      </Link>

      {/* Card Action Buttons */}
      <div className="px-3 pb-3 w-full flex items-stretch gap-2 mt-auto">
        <Link
          href="/auth"
          className="w-full bg-[#fffcf7] rounded md:rounded-lg border-2 border-[#8E7862] text-[#7D5B20] py-1.5 px-2 hover:border-[#6c5b48] hover:bg-[#fbf4e8] transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">
            account_circle
          </span>
          <span className="text-[11px] sm:text-xs text-center">Login to get bulk price</span>
        </Link>

        <button
          type="button"
          onClick={() => setInWishlist(!inWishlist)}
          className="w-max bg-[#fffcf7] rounded md:rounded-lg text-[#7D5B20] py-1.5 px-2.5 cursor-pointer flex justify-center items-center border border-[#75787F]/20 hover:bg-[#fcf4e8] transition-colors"
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inWishlist ? "/assets/img/favourite.svg" : "/assets/img/non-favourite.svg"}
            alt="Wishlist"
            className="w-5 h-5"
          />
        </button>
      </div>

      {/* Related Products Swatch Preview Circles */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="p-2 w-full flex justify-center items-center flex-wrap gap-1.5 border-t border-gray-100">
          {relatedProducts.slice(0, 5).map((related, rIdx) => (
            <Link
              key={rIdx}
              href={`/product/${related.product_group || "fabric"}-product/${related.slug}`}
              className="w-7 h-7 rounded-full border-2 border-[#b7a98f] overflow-hidden hover:scale-110 transition-transform"
              title={related.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={related.hero_image}
                alt={related.name}
                className="w-full h-full object-cover"
              />
            </Link>
          ))}
          {relatedProducts.length > 5 && (
            <Link
              href={productUrl}
              className="w-7 h-7 rounded-full border-2 border-[#b7a98f] text-[10px] font-bold text-[#7D5B20] bg-[#fffcf7] flex justify-center items-center"
            >
              +{relatedProducts.length - 5}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
