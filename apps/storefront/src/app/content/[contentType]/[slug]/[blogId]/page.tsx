import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { CustomContentPage } from "@/components/content/CustomContentPage";

export default async function CustomContentDetailsRoute({
  params,
}: {
  params: Promise<{ contentType: string; slug: string; blogId: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <CustomContentPage blogId={resolvedParams.blogId} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
