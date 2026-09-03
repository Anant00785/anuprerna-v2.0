import { ProductDetailPage } from "@/components/pdp/ProductDetailPage";

export default async function ProductDetailsRoute({
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
        <main className="w-full">
          <ProductDetailPage slug={fullSlug} />
        </main>
      </div>
    </div>
  );
}
