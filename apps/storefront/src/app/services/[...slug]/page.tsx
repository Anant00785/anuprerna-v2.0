import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { CustomContentPage } from "@/components/content/CustomContentPage";

const SERVICES_MAP: Record<string, string> = {
  "fabric-swatches": "59195",
  "order-fabric-swatches": "59195",
  "custom-dyeing": "59105",
  "natural-sustainable-custom-dyeing": "59105",
  "eco-printing": "24862107",
  "wholesale-production": "59335",
  "custom-production": "59335",
  "custom-manufacturing": "703160",
  "finished-product": "703160",
};

export default async function ServicesCatchAllRoute({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const slugParts = resolvedParams.slug || [];
  const serviceKey = slugParts.join("/").toLowerCase();
  const lastSegment = slugParts[slugParts.length - 1]?.toLowerCase() || "";

  const blogId = SERVICES_MAP[serviceKey] || SERVICES_MAP[lastSegment] || "59195";

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <CustomContentPage blogId={blogId} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
