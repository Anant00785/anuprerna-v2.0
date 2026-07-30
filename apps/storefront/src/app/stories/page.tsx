import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { StoryListingPage } from "@/components/stories/StoryListingPage";

export default function StoriesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <StoryListingPage />
        </main>
      </div>
      <Footer />
    </div>
  );
}
