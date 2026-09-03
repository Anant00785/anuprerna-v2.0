"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { cartRepository } from "@/lib/api/repositories/cart.repository";
import type { CartItem } from "@/types/domain/cart";

export function CartDrawer() {
  const { cart, isOpen, isLoading, error, close, refresh } = useCartStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<{ [itemId: string]: string }>({});

  if (!isOpen) return null;

  const currencyCode = selectedCurrency.toUpperCase();
  const items = cart?.items ?? [];

  const money = (value: number) =>
    convertPrice(value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const handleRemove = async (item: CartItem) => {
    setBusyId(item.id);
    try {
      await cartRepository.removeCartItem(item.id);
      await refresh();
    } catch (err) {
      console.error("Failed to remove cart item:", err);
    } finally {
      setBusyId(null);
    }
  };

  const handleMoveToWishlist = async (item: CartItem) => {
    setBusyId(item.id);
    try {
      toggleWishlist(item.product.name, item.product.sku || item.productId);
      await cartRepository.removeCartItem(item.id);
      await refresh();
    } catch (err) {
      console.error("Failed to move to wishlist:", err);
    } finally {
      setBusyId(null);
    }
  };

  const handleQuantity = async (item: CartItem, next: number) => {
    const isPreOrder =
      (item.orderType ?? "").toUpperCase() === "PRE_ORDER" ||
      (item.orderType ?? "").toUpperCase().includes("PRE") ||
      item.productGroup === "bulk";

    if (next < 1 && !isPreOrder) return handleRemove(item);

    const minQty = isPreOrder ? (item.minOrderQuantity && item.minOrderQuantity > 1 ? item.minOrderQuantity : 25) : 1;
    if (isPreOrder && next < minQty) {
      setItemErrors((prev) => ({
        ...prev,
        [item.id]: `Minimum order quantity is ${minQty} ${item.unit ? item.unit.toLowerCase() : "meter"}(s)`,
      }));
      return;
    }

    const availableStock = item.availableStock ?? item.product.availableQuantity;
    if (!isPreOrder && availableStock !== undefined && availableStock > 0 && next > availableStock) {
      setItemErrors((prev) => ({
        ...prev,
        [item.id]: `Only ${availableStock} quantity is left`,
      }));
      return;
    }

    // Clear error for this item
    setItemErrors((prev) => {
      const nextState = { ...prev };
      delete nextState[item.id];
      return nextState;
    });

    setBusyId(item.id);
    try {
      await cartRepository.updateQuantity(item, next);
      await refresh();
    } catch (err: any) {
      console.error("Failed to update cart quantity:", err);
      setItemErrors((prev) => ({
        ...prev,
        [item.id]: err.message || "Failed to update quantity",
      }));
    } finally {
      setBusyId(null);
    }
  };

  const formatCustomSize = (customSizeStr?: string) => {
    if (!customSizeStr) return null;
    try {
      const parsed = typeof customSizeStr === "string" ? JSON.parse(customSizeStr) : customSizeStr;
      const entries = Object.entries(parsed);
      if (entries.length === 0) return null;
      return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
    } catch {
      return customSizeStr;
    }
  };

  return (
    <>
      {/* Dimmed backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] animate-in fade-in duration-200"
        onClick={close}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[580px] lg:w-[640px] bg-white z-[1000] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="fb-font-dm text-2xl font-bold text-[#1f1f1f]">Cart</h2>
            {cart && cart.itemCount > 0 && (
              <span className="bg-[#D4A373] text-white text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                {cart.itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Scrollable Items Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isLoggedIn ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-6xl text-gray-300">shopping_bag</span>
              <p className="text-gray-600 text-sm font-medium">Sign in to view items in your cart.</p>
              <Link
                href="/auth"
                onClick={close}
                className="bg-[#D4A373] hover:bg-[#b58356] text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
              >
                Sign In
              </Link>
            </div>
          ) : isLoading && items.length === 0 ? (
            <div className="py-24 flex justify-center">
              <div className="w-10 h-10 border-4 border-[#D4A373] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p role="alert" className="text-sm font-bold text-red-600 mb-2">
                {error}
              </p>
              <button
                type="button"
                onClick={() => refresh()}
                className="text-xs text-[#7D5A20] font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-6xl text-gray-300">shopping_cart</span>
              <p className="text-gray-500 text-sm font-medium">Your cart is empty.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {items.map((item) => {
                const isSwatch = item.productGroup === "swatch";
                const isMTO = item.orderType === "MADE_TO_ORDER";
                const isPreOrder = item.orderType === "PRE_ORDER";
                const customSizeLabel = formatCustomSize(item.customSize);
                const productHref = `/product/${item.productGroup === "finished" ? "finished-product" : "fabric-product"}/${item.product.slug || item.productId}`;

                return (
                  <div key={item.id} className="py-4 flex gap-4 items-start">
                    {/* Item Thumbnail */}
                    <Link href={productHref} onClick={close} className="shrink-0">
                      {isSwatch ? (
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-[#D4A373] p-1 flex items-center justify-center bg-gray-50">
                          <img
                            src={item.product.thumbnail || "/images/placeholder.jpg"}
                            alt={item.product.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
                            }}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      ) : (
                        <img
                          src={item.product.thumbnail || "/images/placeholder.jpg"}
                          alt={item.product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
                          }}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                    </Link>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Order Type Badges */}
                        {isMTO && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8f780f] bg-[#FFF8D0] px-2 py-0.5 rounded-full mb-1">
                            <span>Made To Order</span>
                            <span className="material-symbols-outlined text-[12px]">info</span>
                          </div>
                        )}
                        {isPreOrder && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7D5A20] bg-[#FFF8D0] border border-[#FFEBAA] px-2 py-0.5 rounded-full mb-1">
                            <span>Pre Order (50% Advance)</span>
                          </div>
                        )}

                        {/* Product Title */}
                        <Link
                          href={productHref}
                          onClick={close}
                          className="block text-sm font-semibold text-[#1f1f1f] hover:text-[#7D5A20] transition-colors line-clamp-2"
                        >
                          {isSwatch ? "Swatch - " : ""}
                          {item.product.name}
                        </Link>

                        {/* Customization Details */}
                        {item.selectedFabricName && (
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            Selected Fabric: {item.selectedFabricName}
                          </p>
                        )}
                        {item.sizeDisplayName && (
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            Selected Size: {item.sizeDisplayName}
                          </p>
                        )}
                        {item.finishDisplayName && (
                          <p className="text-xs text-[#6B7280] mt-0.5 capitalize">
                            Selected Finish: {item.finishDisplayName}
                          </p>
                        )}
                        {customSizeLabel && (
                          <p className="text-xs text-[#6B7280] mt-0.5 capitalize">
                            Custom Size: {customSizeLabel}
                          </p>
                        )}

                        {/* Unit Price */}
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          {item.discountedUnitPrice && item.discountedUnitPrice < item.unitPrice ? (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                {currencyCode} {money(item.unitPrice)}
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {currencyCode} {money(item.discountedUnitPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-gray-900">
                              {currencyCode} {money(item.unitPrice)}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 font-normal">
                            / {item.unit ? item.unit.toLowerCase() : "meter"}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      {(() => {
                        const availableStock = item.availableStock ?? item.product.availableQuantity;
                        const isPreOrder =
                          (item.orderType ?? "").toUpperCase() === "PRE_ORDER" ||
                          (item.orderType ?? "").toUpperCase().includes("PRE") ||
                          item.productGroup === "bulk";
                        const minQty = isPreOrder ? (item.minOrderQuantity && item.minOrderQuantity > 1 ? item.minOrderQuantity : 25) : 1;
                        const isAtMin = isPreOrder && item.quantity <= minQty;
                        const isMaxStockReached =
                          !isPreOrder &&
                          availableStock !== undefined &&
                          availableStock > 0 &&
                          item.quantity >= availableStock;

                        const itemErr = itemErrors[item.id];

                        return (
                          <div className="flex flex-col gap-1 mt-2.5">
                            <div className="flex items-center border border-[#D1D4DB] rounded-md bg-white overflow-hidden w-fit">
                              <button
                                type="button"
                                onClick={() => handleQuantity(item, item.quantity - 1)}
                                disabled={busyId === item.id || isAtMin}
                                aria-label="Decrease quantity"
                                className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-40 cursor-pointer transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (isNaN(val)) return;
                                  handleQuantity(item, val);
                                }}
                                className="w-12 text-center text-xs font-bold text-gray-900 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantity(item, item.quantity + 1)}
                                disabled={busyId === item.id || isMaxStockReached}
                                aria-label="Increase quantity"
                                className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-30 cursor-pointer transition-colors"
                              >
                                +
                              </button>
                            </div>
                            {isPreOrder && isAtMin && (
                              <span className="text-[10px] text-[#A67C52] font-semibold">
                                Minimum order quantity is {minQty} {item.unit ? item.unit.toLowerCase() : "meter"}
                              </span>
                            )}
                            {itemErr ? (
                              <span className="text-[10px] text-red-600 font-semibold animate-in fade-in">
                                {itemErr}
                              </span>
                            ) : isMaxStockReached ? (
                              <span className="text-[10px] text-red-600 font-semibold">
                                Only {availableStock} quantity is left
                              </span>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action Buttons: Delete & Wishlist */}
                    <div className="flex flex-col items-center gap-2 self-start pt-1">
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        disabled={busyId === item.id}
                        aria-label={`Remove ${item.product.name}`}
                        className="text-gray-400 hover:text-red-600 disabled:opacity-40 cursor-pointer transition-colors p-1"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveToWishlist(item)}
                        disabled={busyId === item.id}
                        aria-label={`Save ${item.product.name} to wishlist`}
                        className="text-gray-400 hover:text-[#7D5A20] disabled:opacity-40 cursor-pointer transition-colors p-1"
                        title="Move to Wishlist"
                      >
                        <span className="material-symbols-outlined text-lg">bookmark_heart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subtotal Footer */}
        {isLoggedIn && items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-base font-bold text-[#1f1f1f]">Sub Total</span>
                <p className="text-xs text-gray-500">including discounts (if any)</p>
                {/* Says what the number is and is not. Shipping needs a
                    destination and a delivery method, neither of which the cart
                    has, so it is not in this figure and is not guessed. */}
                <p className="text-xs text-gray-500">Shipping calculated at checkout</p>
              </div>
              <span className="text-lg md:text-xl font-bold text-[#1f1f1f]">
                {currencyCode} {money(cart?.subtotal ?? 0)}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={close}
              className="block w-full bg-[#D4A373] hover:bg-[#b58356] text-white font-medium py-3 rounded-lg text-center text-base transition-colors shadow-sm cursor-pointer"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
