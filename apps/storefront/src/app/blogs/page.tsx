import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { BlogListingPage } from "@/components/blogs/BlogListingPage";

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <BlogListingPage />
        </main>
      </div>
      <Footer />
    </div>
  );
}
