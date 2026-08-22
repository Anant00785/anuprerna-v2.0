"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { useCartStore } from "@/stores/cart.store";

export default function CartPage() {
  const router = useRouter();
  const { open: openCart } = useCartStore();

  useEffect(() => {
    openCart();
  }, [openCart]);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-[#efeee9] p-12 rounded-2xl max-w-lg mx-auto shadow-sm space-y-4">
            <span className="material-symbols-outlined text-5xl text-[#8E7862]">
              shopping_bag
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Your Shopping Cart</h1>
            <p className="text-sm text-gray-600">
              Opening your cart drawer to view items, modify quantities, and proceed to checkout.
            </p>
            <button
              type="button"
              onClick={openCart}
              className="inline-block bg-[#8E7862] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#7a6652] transition-colors cursor-pointer"
            >
              Open Cart Drawer
            </button>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
