import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { ArtisanFlowPage } from "@/components/b2b/ArtisanFlowPage";

export default function ArtisanFlowRoute() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <ArtisanFlowPage />
        </main>
      </div>
      <Footer />
    </div>
  );
}
