"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PLPProduct } from "@/types/domain/plp";
import { useCurrencyStore } from "@/stores/currency.store";
import { useAuthStore } from "@/stores/auth.store";
import { useWishlistStore } from "@/stores/wishlist.store";

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
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlistStore = useWishlistStore((s) => s.isInWishlist);

  // Gated on `hydrated` for the same reason as the header: the auth store is
  // persist-backed and is empty on the server and first client render.
  const storeLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const isLoggedIn = hydrated && storeLoggedIn;

  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const currencyCode = selectedCurrency.toUpperCase();

  const rawBasePrice = Number(product.calculatedPrice || product.price || 0);
  const convertedBasePrice = convertPrice(rawBasePrice);
  const convertedDiscountedPrice = product.calculatedDiscountedPrice
    ? convertPrice(Number(product.calculatedDiscountedPrice))
    : null;

  // Calculate bulk price matching Angular filter-product-preview.component.ts ngOnInit 1:1
  let rawBulkPrice = rawBasePrice;
  if (product.product_group === "finished") {
    // Angular: selectedMadeToOrderFabricPrice = product.made_to_order_fabric_price
    //   ? product.made_to_order_fabric_price : product.price;
    const rawFabricPrice =
      product.made_to_order_fabric_price ??
      (product as any).madeToOrderFabric?.price ??
      0;
    const selectedFabricPrice = Number(rawFabricPrice) > 0 ? Number(rawFabricPrice) : Number(product.price || 0);

    // getConsumedFabric matching Angular 1:1
    let consumedFabric = 1;
    if ((product as any).product_size_profile_option_list?.[0]?.consumed_fabric) {
      consumedFabric = Number((product as any).product_size_profile_option_list[0].consumed_fabric);
    } else if (product.size_profile_option_list?.[0]) {
      const opt = product.size_profile_option_list[0] as any;
      consumedFabric = Number(opt.size_profile_option_consumed_fabric || opt.consumed_fabric || 1);
    } else if ((product as any).made_to_order_profile_consumed_fabric) {
      consumedFabric = Number((product as any).made_to_order_profile_consumed_fabric);
    }

    const fabricPrice = selectedFabricPrice * consumedFabric;

    if (product.volume_discount) {
      // Angular: productVD = product.price - (product.price * (volume_discount / 100))
      const productVD = Number(product.price || 0) - (Number(product.price || 0) * (product.volume_discount / 100));

      // Angular: fabricVD = made_to_order_fabric_discount
      //   ? fabricPrice - (fabricPrice * (_calculateDiscountSlab(consumedFabric) / 100)) : 0
      let fabricVD = 0;
      const mtoFabricDiscount = (product as any).made_to_order_fabric_discount;
      if (mtoFabricDiscount && Array.isArray(mtoFabricDiscount) && mtoFabricDiscount.length > 0) {
        // _calculateDiscountSlab: find highest discount slab where min order qty <= volume_discount_minimum_order_quantity * consumedFabric
        const minOrderQty = (product as any).volume_discount_minimum_order_quantity
          ? (product as any).volume_discount_minimum_order_quantity * consumedFabric
          : 0;
        let discountSlab = 0;
        const sorted = [...mtoFabricDiscount].sort((a: any, b: any) => a.discount - b.discount);
        sorted.forEach((item: any) => {
          if (item.minimum_order_quantity <= minOrderQty) {
            discountSlab = item.discount;
          }
        });
        fabricVD = fabricPrice - (fabricPrice * (discountSlab / 100));
      }
      rawBulkPrice = productVD + fabricVD;
    } else {
      // Angular: this.bulkPrice = this.product.calculatedPrice;
      rawBulkPrice = rawBasePrice;
    }
  } else {
    if (product.volume_discount) {
      rawBulkPrice = Number(product.price || 0) - (Number(product.price || 0) * (product.volume_discount / 100));
    } else {
      rawBulkPrice = Number(product.price || 0);
    }
  }
  const convertedBulkPrice = convertPrice(rawBulkPrice);
  const hasMultipleSizes = Boolean(product.size_profile_option_list && product.size_profile_option_list.length > 1);

  // Determine badge text
  const isStockAvailable =
    product.total_quantity > 0 ||
    (product.quantity || 0) > 0 ||
    (product.size_profile_option_list || []).some((s) => s.quantity > 0);

  const badge = isStockAvailable ? "In Stock" : "Made to Order";

  const productUrl = `/product/${product.product_group || (product as any).productGroup || "fabric"}-product/${product.slug}`;
  const heroImg = product.hero_image || (product as any).heroImage || "";
  const hoverImg = product.hover_image || (product as any).hoverImage || "";
  const displayImage = isHovered && hoverImg ? hoverImg : (heroImg || hoverImg);

  const productSku = product.sku || String(product.id || "");
  const inWishlist = hydrated && (isInWishlistStore(productSku) || Boolean(product.inWishlist));
  const categoryLabel = product.special_status || product.category || (product as any).sub_category || "Dyeable Khadi...";
  const unitLabel = (product.unit || "meter").toLowerCase();

  return (
    <div className="fb-filter-product-preview bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative">
      {/* Top Image & In Stock Badge */}
      <Link href={productUrl} className="block relative w-full aspect-square bg-[#f8f8f8] overflow-hidden">
        {badge && (
          <div
            className={`absolute top-2.5 right-2.5 z-10 text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-sm ${
              badge === "In Stock"
                ? "bg-[#EAF3EA] text-[#3B664B]"
                : "bg-[#FFF8D0] text-[#8C7410]"
            }`}
          >
            {badge}
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage || "/assets/img/item.png"}
          alt={product.name}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          loading="lazy"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Card Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Row 1: Category Pill & Wishlist Heart */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="bg-[#EFEBF4] text-[#6E6482] text-[11px] font-medium px-2.5 py-0.5 rounded-full truncate max-w-[180px]">
              {categoryLabel}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (productSku) {
                  toggleWishlist(product.name, productSku);
                }
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
              title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  inWishlist ? "fill-red-500 text-red-500" : "fill-none stroke-gray-400 hover:stroke-red-500"
                }`}
                strokeWidth="1.6"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </button>
          </div>

          {/* Row 2: Product Title */}
          <Link href={productUrl} className="block group/title">
            <h4 className="text-sm sm:text-[15px] font-medium text-gray-900 line-clamp-2 mb-2 leading-snug group-hover/title:text-[#8E7862] transition-colors">
              {product.name}
            </h4>
          </Link>

          {/* Row 3: Price Display */}
          <div className="flex items-baseline gap-1 text-gray-900 mb-1">
            {hasMultipleSizes && <span className="text-xs text-gray-400 mr-0.5">From</span>}
            <span className="text-xs text-gray-400 font-medium">{currencyCode}</span>

            {convertedDiscountedPrice ? (
              <span className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">
                  {convertedDiscountedPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="line-through text-xs text-gray-400">
                  {convertedBasePrice.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            ) : (
              <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">
                {convertedBasePrice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}

            <span className="text-xs text-gray-500 font-normal">/ {unitLabel}</span>
          </div>

          {/* Row 4: Bulk Order Text */}
          <div className="text-xs font-medium text-[#4A7C59] mb-3">
            Bulk order @ {currencyCode}{" "}
            {convertedBulkPrice.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            / {unitLabel}
          </div>
        </div>

        {/* Row 5: Customise & Order CTA */}
        <Link
          href={productUrl}
          className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-800 tracking-wider uppercase group-hover:text-[#8E7862] transition-colors"
        >
          <span>CUSTOMISE & ORDER</span>
          <span className="material-symbols-outlined text-base transform group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>
      </div>

      {/* Related Products Swatch Preview Circles */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="px-3 py-2 w-full flex justify-center items-center flex-wrap gap-1.5 border-t border-gray-100 bg-[#fafafa]">
          {relatedProducts.slice(0, 5).map((related, rIdx) => (
            <Link
              key={rIdx}
              href={`/product/${related.product_group || "fabric"}-product/${related.slug}`}
              className="w-6 h-6 rounded-full border border-gray-300 overflow-hidden hover:scale-110 transition-transform shadow-xs"
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
              className="w-6 h-6 rounded-full border border-gray-300 text-[9px] font-bold text-gray-600 bg-white flex justify-center items-center"
            >
              +{relatedProducts.length - 5}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
