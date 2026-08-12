import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { OurStoryPage } from "@/components/story/OurStoryPage";

export default function OurStoryRoute() {
  return (
    <div className="min-h-screen bg-[#fffcf7] flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <OurStoryPage />
        </main>
      </div>
      <Footer />
    </div>
  );
}
