"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { cartRepository } from "@/lib/api/repositories/cart.repository";
import type { CartItem } from "@/types/domain/cart";

/**
 * Right-hand cart side tab, matching the layout fabric ships in production:
 * title + count pill, one row per cart item, sub total, checkout.
 *
 * Rendered by Header and driven entirely by `useCartStore`, so the PDP's
 * "Add to Cart" and the header's cart button open the same panel.
 */
export function CartDrawer() {
  const { cart, isOpen, isLoading, error, close, refresh } = useCartStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currencyCode = selectedCurrency.toUpperCase();
  const items = cart?.items ?? [];

  const money = (value: number) =>
    convertPrice(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
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

  // Quantity is a NUMERIC on Loom's side (fabric sells by the metre), but the
  // stepper only moves in whole units, and 0 means "remove", not "free".
  const handleQuantity = async (item: CartItem, next: number) => {
    if (next < 1) return handleRemove(item);
    setBusyId(item.id);
    try {
      await cartRepository.updateQuantity(item, next);
      await refresh();
    } catch (err) {
      console.error("Failed to update cart quantity:", err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={close}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white z-[61] shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="fb-font-dm text-2xl font-medium text-[#1f1f1f]">Cart</h2>
            {cart && cart.itemCount > 0 && (
              <span className="bg-[#C79D6D] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {cart.itemCount}
              </span>
            )}
          </div>
          <button type="button" onClick={close} aria-label="Close cart" className="text-gray-500 hover:text-black">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isLoggedIn ? (
            <div className="py-16 text-center flex flex-col items-center gap-4">
              {/* Loom keys the cart to the bearer token, so there is nothing to
                  show — and nothing that can be added — while signed out. */}
              <p className="text-gray-500 text-sm">Sign in to see the items in your cart.</p>
              <Link href="/auth" onClick={close} className="bg-[#C79D6D] text-white px-6 py-2.5 rounded font-bold text-sm">
                Sign In
              </Link>
            </div>
          ) : isLoading && items.length === 0 ? (
            <div className="py-16 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#C79D6D] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p role="alert" className="py-16 text-center text-sm font-bold text-red-600">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-gray-500 text-sm">Your cart is empty.</p>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <img
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded border border-gray-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/fabric-product/${item.product.slug}`}
                      onClick={close}
                      className="block text-sm font-medium text-[#1f1f1f] hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm font-bold text-[#1f1f1f] mt-1">
                      {currencyCode} {money(item.unitPrice)}
                      <span className="font-normal text-gray-500"> / {item.unit ?? "UNIT"}</span>
                    </p>
                    <div className="flex items-center border border-[#D1D4DB] rounded bg-white overflow-hidden w-fit mt-2">
                      <button
                        type="button"
                        onClick={() => handleQuantity(item, item.quantity - 1)}
                        disabled={busyId === item.id}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-40"
                      >
                        &minus;
                      </button>
                      <span className="w-10 text-center text-sm font-bold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantity(item, item.quantity + 1)}
                        disabled={busyId === item.id}
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    disabled={busyId === item.id}
                    aria-label={`Remove ${item.product.name} from cart`}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-40 self-start"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isLoggedIn && items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <span className="fb-font-dm text-xl font-medium text-[#1f1f1f]">Sub Total</span>
                <p className="text-xs text-gray-500">including discounts (if any)</p>
              </div>
              <span className="text-xl font-bold text-[#1f1f1f]">
                {currencyCode} {money(cart?.subtotal ?? 0)}
              </span>
            </div>
            {/* ponytail: there is no checkout route in this storefront yet, so
                this points at the cart's own page once one exists. */}
            <button
              type="button"
              disabled
              title="Checkout is not built in this storefront yet"
              className="w-full bg-[#C79D6D] text-white font-bold py-3 rounded disabled:opacity-60"
            >
              Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
