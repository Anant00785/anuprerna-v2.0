import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { ProductListingPage } from "@/components/plp/ProductListingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artisan Finished Products | Anuprerna",
  description:
    "Explore handmade scarves, garments, homeware, and accessories collaboratively crafted with Bengal handloom weavers.",
};

export default function FinishedProductsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <TopBar />
      <Header />
      <ProductListingPage group="finished" />
      <Footer />
    </main>
  );
}
