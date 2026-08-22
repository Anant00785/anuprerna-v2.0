import { Suspense } from "react";
import type { Metadata } from "next";
import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | Anuprerna Artisan Fabrics",
  description: "Securely review your cart, enter shipping details, and complete your order with Anuprerna.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-10 h-10 border-3 border-[#ca9b6d] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <CheckoutPage />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
