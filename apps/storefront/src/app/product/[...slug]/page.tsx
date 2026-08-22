import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { ProductDetailPage } from "@/components/pdp/ProductDetailPage";
import { ProductGalleryPage } from "@/components/pdp/ProductGalleryPage";

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];

  const isGalleryRoute = slugArray[0] === "gallery";

  if (isGalleryRoute) {
    const category = slugArray[1] || "";
    const slug = slugArray[2] || "";
    const selectedImageName = slugArray[3] || "";

    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <div>
          <TopBar />
          <Header />
          <main className="w-full py-6">
            <ProductGalleryPage
              category={category}
              slug={slug}
              selectedImageName={selectedImageName}
            />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

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
