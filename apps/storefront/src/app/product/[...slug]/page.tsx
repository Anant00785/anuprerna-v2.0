import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { ProductDetailPage } from "@/components/pdp/ProductDetailPage";

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  const fullSlug = slugArray[slugArray.length - 1] || "";

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <ProductDetailPage slug={fullSlug} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
