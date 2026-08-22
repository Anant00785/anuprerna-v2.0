import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { CustomContentPage } from "@/components/content/CustomContentPage";

export default function WholesaleFabricSourcingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <CustomContentPage blogId="59195" />
        </main>
      </div>
      <Footer />
    </div>
  );
}
