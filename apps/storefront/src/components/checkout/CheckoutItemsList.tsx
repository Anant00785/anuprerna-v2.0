"use client";

import Link from "next/link";
import { CartItem } from "@/types/domain/cart";
import { formatDeliveryDate, calculateDeliveryTimestamp } from "@/lib/checkout/checkout-calculations";

interface CheckoutItemsListProps {
  items: CartItem[];
  currencyCode: string;
  money: (val: number) => string;
  shipmentFromDay?: number;
  shipmentToDay?: number;
  onUpdateQuantity: (item: CartItem, quantity: number) => void;
  onRemoveItem: (item: CartItem) => void;
  onMoveToWishlist: (item: CartItem) => void;
  busyId?: string | null;
}

export function CheckoutItemsList({
  items,
  currencyCode,
  money,
  shipmentFromDay = 5,
  shipmentToDay = 7,
  onUpdateQuantity,
  onRemoveItem,
  onMoveToWishlist,
  busyId,
}: CheckoutItemsListProps) {
  const inStockItems = items.filter(
    (i) => (i.orderType ?? "IN_STOCK") === "IN_STOCK"
  );
  const madeToOrderItems = items.filter(
    (i) => i.orderType === "MADE_TO_ORDER"
  );
  const preOrderItems = items.filter(
    (i) => i.orderType === "PRE_ORDER"
  );

  const renderItemRow = (item: CartItem) => {
    const isBusy = busyId === item.id;
    const isSwatch =
      item.productGroup === "swatch" ||
      item.product.name.toLowerCase().includes("swatch") ||
      Boolean(item.product.sku?.toLowerCase().includes("swatch"));
    const groupUrl = item.productGroup === "finished" ? "finished-product" : "fabric-product";
    const productUrl = `/product/${groupUrl}/${item.product.slug}`;
    const unit = item.unit || (item.productGroup === "fabric" ? "Meter" : "Unit");

    const isPreOrder =
      (item.orderType ?? "").toUpperCase() === "PRE_ORDER" ||
      (item.orderType ?? "").toUpperCase().includes("PRE") ||
      item.productGroup === "bulk";
    const minQty = isPreOrder ? (item.minOrderQuantity && item.minOrderQuantity > 1 ? item.minOrderQuantity : 25) : 1;
    const availableStock = item.availableStock ?? item.product.availableQuantity;
    const isStockLimited =
      !isPreOrder &&
      availableStock !== undefined &&
      availableStock > 0 &&
      item.quantity >= availableStock;

    const isAtMin = isPreOrder && item.quantity <= minQty;

    return (
      <div
        key={item.id}
        className="flex flex-col sm:flex-row items-start justify-between gap-5 py-5 border-b border-gray-100 last:border-b-0"
      >
        {/* Product Image */}
        <Link href={productUrl} className="shrink-0">
          <img
            src={item.product.thumbnail || "/images/placeholder.jpg"}
            alt={item.product.name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/placeholder.jpg";
            }}
            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-gray-200 bg-white shadow-2xs"
          />
        </Link>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <Link
            href={productUrl}
            className="text-sm sm:text-base font-semibold text-gray-900 hover:underline leading-snug block"
          >
            {isSwatch ? "SWATCH - " : ""}
            {item.product.name}
          </Link>

          {/* Size / Fabric / Finish info */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-gray-600">
            {item.sizeDisplayName && (
              <span className="flex items-center gap-1.5">
                <span className="text-[#ca9b6d] font-bold">|</span>
                <span className="text-gray-500 font-medium">Size</span>
                <span className="font-semibold text-gray-900 uppercase">
                  {item.sizeDisplayName}
                </span>
              </span>
            )}

            {item.selectedFabricName && (
              <span className="text-xs text-gray-600">
                · Fabric: <span className="font-medium text-gray-900">{item.selectedFabricName}</span>
              </span>
            )}

            {item.customSize && (
              <span className="text-xs text-gray-600">
                · Custom Size: {item.customSize}
              </span>
            )}

            {item.finishDisplayName && (
              <span className="text-xs text-gray-600">
                · Finish: {item.finishDisplayName}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mt-2 mb-3">
            {!item.discountedUnitPrice || item.discountedUnitPrice === item.unitPrice ? (
              <p className="text-sm sm:text-base text-gray-900 font-bold">
                {currencyCode} {money(item.unitPrice)}
                <span className="text-xs text-gray-500 font-normal"> / {unit.toLowerCase()}</span>
              </p>
            ) : (
              <div className="flex items-center font-bold gap-2 text-sm sm:text-base">
                <span className="line-through text-xs text-gray-400">
                  {currencyCode} {money(item.unitPrice)}
                </span>
                <span className="text-gray-900 font-bold">
                  {currencyCode} {money(item.discountedUnitPrice)}
                </span>
                <span className="text-xs text-gray-500 font-normal"> / {unit.toLowerCase()}</span>
              </div>
            )}
          </div>

          {/* Quantity Stepper with Label */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Quantity ({unit})
            </label>
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center border border-gray-300 rounded-md bg-white overflow-hidden shadow-2xs w-fit">
                <button
                  type="button"
                  disabled={isBusy || isAtMin}
                  onClick={() => onUpdateQuantity(item, Math.max(minQty, item.quantity - 1))}
                  aria-label="Decrease quantity"
                  className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer font-bold transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (isNaN(val)) return;
                    const maxAllowed =
                      !isPreOrder && availableStock !== undefined && availableStock > 0
                        ? availableStock
                        : 99999;
                    const nextVal = Math.max(minQty, Math.min(maxAllowed, val));
                    onUpdateQuantity(item, nextVal);
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value) || minQty;
                    if (val < minQty) {
                      onUpdateQuantity(item, minQty);
                    }
                  }}
                  className="w-12 text-center text-xs font-bold text-gray-900 focus:outline-none"
                  min={minQty}
                />
                <button
                  type="button"
                  disabled={isBusy || isStockLimited}
                  onClick={() => onUpdateQuantity(item, item.quantity + 1)}
                  aria-label="Increase quantity"
                  className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer font-bold transition-colors"
                >
                  +
                </button>
              </div>
              {isPreOrder && isAtMin && (
                <span className="text-[10px] text-[#A67C52] font-semibold">
                  Minimum pre-order quantity is {minQty} {unit.toLowerCase()}
                </span>
              )}
              {isStockLimited && (
                <span className="text-[10px] text-red-600 font-semibold">
                  Only {availableStock} quantity is left
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex sm:flex-col items-center gap-3 shrink-0 self-end sm:self-start pt-1">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onRemoveItem(item)}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg">delete_outline</span>
            <span>Remove</span>
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onMoveToWishlist(item)}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#ca9b6d] text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg">bookmark_border</span>
            <span>Save for later</span>
          </button>
        </div>
      </div>
    );
  };

  // Delivery Dates Calculations per Order Type (Matching Angular 1:1)
  const inStockEstFrom = calculateDeliveryTimestamp(shipmentFromDay);
  const inStockEstTo = calculateDeliveryTimestamp(shipmentToDay);

  const mtoFromLead =
    madeToOrderItems.length > 0
      ? Math.max(...madeToOrderItems.map((i) => i.deliveryFromDays || 15))
      : 15;
  const mtoToLead =
    madeToOrderItems.length > 0
      ? Math.max(...madeToOrderItems.map((i) => i.deliveryToDays || 25))
      : 25;
  const mtoEstFrom = calculateDeliveryTimestamp(shipmentFromDay + mtoFromLead);
  const mtoEstTo = calculateDeliveryTimestamp(shipmentToDay + mtoToLead);

  const preOrderFromLead =
    preOrderItems.length > 0
      ? Math.max(...preOrderItems.map((i) => i.deliveryFromDays || 50))
      : 50;
  const preOrderToLead =
    preOrderItems.length > 0
      ? Math.max(...preOrderItems.map((i) => i.deliveryToDays || 60))
      : 60;
  const preOrderEstFrom = calculateDeliveryTimestamp(shipmentFromDay + preOrderFromLead);
  const preOrderEstTo = calculateDeliveryTimestamp(shipmentToDay + preOrderToLead);

  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* 1. In Stock Items Card */}
      {inStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-gray-900">Cart Item:</h3>
            <span className="inline-flex items-center gap-1 bg-[#e8f5e9] text-[#2e7d32] text-[11px] font-bold px-2.5 py-0.5 rounded border border-[#c8e6c9]">
              <span>IN STOCK</span>
              <span className="material-symbols-outlined text-[13px]">info</span>
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-800 mt-2.5 mb-4 flex items-center gap-1.5">
            <span>🚚</span>
            <span>
              Estimated Delivery: {formatDeliveryDate(inStockEstFrom)} -{" "}
              {formatDeliveryDate(inStockEstTo)}
            </span>
          </p>

          <div className="divide-y divide-gray-100">
            {inStockItems.map(renderItemRow)}
          </div>
        </div>
      )}

      {/* 2. Made to Order Items Card */}
      {madeToOrderItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-gray-900">Cart Item:</h3>
            <span className="inline-flex items-center gap-1 bg-[#fff8d0] text-[#8f780f] text-[11px] font-bold px-2.5 py-0.5 rounded border border-[#fef08a]">
              <span>MADE TO ORDER</span>
              <span className="material-symbols-outlined text-[13px]">info</span>
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-800 mt-2.5 mb-4 flex items-center gap-1.5">
            <span>🚚</span>
            <span>
              Estimated Delivery: {formatDeliveryDate(mtoEstFrom)} -{" "}
              {formatDeliveryDate(mtoEstTo)}
            </span>
          </p>

          <div className="divide-y divide-gray-100">
            {madeToOrderItems.map(renderItemRow)}
          </div>
        </div>
      )}

      {/* 3. Pre Order Items Card */}
      {preOrderItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-gray-900">Cart Item:</h3>
            <span className="inline-flex items-center gap-1 bg-[#fff8d0] text-[#8f780f] text-[11px] font-bold px-2.5 py-0.5 rounded border border-[#fef08a]">
              <span>PRE ORDER (50% ADVANCE)</span>
              <span className="material-symbols-outlined text-[13px]">info</span>
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-800 mt-2.5 mb-4 flex items-center gap-1.5">
            <span>🚚</span>
            <span>
              Estimated Delivery: {formatDeliveryDate(preOrderEstFrom)} -{" "}
              {formatDeliveryDate(preOrderEstTo)}
            </span>
          </p>

          <div className="divide-y divide-gray-100">
            {preOrderItems.map(renderItemRow)}
          </div>
        </div>
      )}
    </div>
  );
}
