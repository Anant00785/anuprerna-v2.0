import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { ProductListingPage } from "@/components/plp/ProductListingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sustainable Handwoven Fabrics | Anuprerna Artisans",
  description:
    "Discover natural dye, Khadi cotton, linen, silk, and artisan handwoven fabrics from Anuprerna.",
};

export default function FabricProductsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <TopBar />
      <Header />
      <ProductListingPage group="fabric" />
      <Footer />
    </main>
  );
}
