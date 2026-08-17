'use client';

import React from 'react';
import Link from 'next/link';
import { PLPProduct } from '@/types/domain/plp';
import { useCurrencyStore } from '@/stores/currency.store';
import { useWishlistStore } from '@/stores/wishlist.store';

interface WishlistCardProps {
  product: PLPProduct;
}

export const WishlistCard: React.FC<WishlistCardProps> = ({ product }) => {
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const currencyCode = selectedCurrency.toUpperCase();
  const rawPrice = Number(product.calculatedPrice || product.price || 0);
  const convertedPrice = convertPrice(rawPrice);

  const isStockAvailable =
    product.total_quantity > 0 ||
    (product.quantity || 0) > 0 ||
    (product.size_profile_option_list || []).some((s) => (s.quantity || 0) > 0);

  const badge = isStockAvailable ? 'In Stock' : 'Made to Order';
  const groupUrl = product.product_group === 'finished' ? 'finished-product' : 'fabric-product';
  const productUrl = `/product/${groupUrl}/${product.slug}`;

  return (
    <div className="fb-wishlist-card relative bg-white border border-[#75787F]/20 shadow-md rounded md:rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Badge */}
      {badge && (
        <div
          className={`rounded px-2 py-1 text-xs absolute top-2 left-2 z-10 font-medium ${
            badge === 'In Stock' ? 'bg-[#e6eac6] text-[#7f8142]' : 'bg-[#FFF8D0] text-[#ac9317]'
          }`}
        >
          {badge}
        </div>
      )}

      {/* Remove from Wishlist Button */}
      <button
        type="button"
        onClick={() => toggleWishlist(product.name, product.sku)}
        title="Remove from wishlist"
        className="fb-wishlist-card-btn absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-100 transition-colors"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>

      {/* Product Image Link */}
      <Link href={productUrl} className="block w-full">
        <div className="w-full aspect-square relative bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.hero_image || '/assets/img/item.png'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 text-center">
        <Link href={productUrl} className="block hover:underline">
          <p className="hidden md:block text-base font-medium text-gray-900 truncate">
            {product.name}
          </p>
          <p className="block md:hidden text-sm font-medium text-gray-900 truncate">
            {product.name}
          </p>

          <div className="flex items-center justify-center gap-1 my-2 text-lg font-medium text-gray-900">
            <span className="text-xs text-gray-500">{currencyCode}</span>
            <span>
              {convertedPrice.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs text-gray-500">/ {product.unit || 'METER'}</span>
          </div>

          {product.special_status && (
            <div className="mx-auto w-max px-2.5 py-1 bg-[#b7a98f] text-white rounded text-xs">
              {product.special_status}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
};
