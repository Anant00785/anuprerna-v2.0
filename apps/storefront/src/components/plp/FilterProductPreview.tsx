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
          {hasMultipleSizes && (
            <span className="text-xs mr-1 text-[#75787F]">Starting from </span>
          )}
          <span className="text-xs mr-1 text-[#75787F]">{currencyCode}</span>

          {convertedDiscountedPrice ? (
            <span className="flex items-center gap-1.5">
              <span className="line-through text-xs sm:text-sm text-[#898E9A]">
                {convertedBasePrice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-base sm:text-lg text-[#2E2E2E] font-bold">
                {convertedDiscountedPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          ) : (
            <span>
              {convertedBasePrice.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          )}

          <span className="text-xs text-[#75787F] ml-1">/ {product.unit || "METER"}</span>
        </div>
      </Link>

      {/* Card Action Buttons */}
      <div className="px-3 pb-3 w-full flex items-stretch gap-2 mt-auto">
        <Link
          href={isLoggedIn ? productUrl : "/auth"}
          className="w-full bg-[#fffcf7] rounded md:rounded-lg border-2 border-[#8E7862] text-[#7D5B20] py-1.5 px-2 hover:border-[#6c5b48] hover:bg-[#fbf4e8] transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isLoggedIn ? "shoppingmode" : "account_circle"}
          </span>
          <span className="text-[11px] sm:text-xs text-center">
            {isLoggedIn
              ? `Bulk Order @ ${currencyCode} ${convertedBulkPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}`
              : "Login to get bulk price"}
          </span>
        </Link>

        {(() => {
          const productSku = product.sku || String(product.id || "");
          const inWishlist = hydrated && (isInWishlistStore(productSku) || Boolean(product.inWishlist));
          return (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (productSku) {
                  toggleWishlist(product.name, productSku);
                }
              }}
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
          );
        })()}
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
