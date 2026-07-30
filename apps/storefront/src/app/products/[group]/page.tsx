import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { ProductListingPage } from "@/components/plp/ProductListingPage";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const isFinished = resolvedParams.group === "finished";
  return {
    title: isFinished
      ? "Artisan Finished Products | Anuprerna"
      : "Sustainable Handwoven Fabrics | Anuprerna Artisans",
    description: isFinished
      ? "Explore handmade scarves, garments, homeware, and accessories."
      : "Discover natural dye, Khadi cotton, linen, silk, and artisan handwoven fabrics.",
  };
}

export default async function ProductGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const resolvedParams = await params;
  const groupType = resolvedParams.group === "finished" ? "finished" : "fabric";

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <TopBar />
      <Header />
      <ProductListingPage group={groupType} />
      <Footer />
    </main>
  );
}
