import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { ManufacturingProcess } from "@/components/home/ManufacturingProcess";
import { WholesaleProgram } from "@/components/home/WholesaleProgram";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { ArtisanFlowShowcase } from "@/components/home/ArtisanFlowShowcase";
import { AllCraftsSection } from "@/components/home/AllCraftsSection";
import { AllCollaborationsSection } from "@/components/home/AllCollaborationsSection";
import { AllClustersSection } from "@/components/home/AllClustersSection";
import { AllStoriesSection } from "@/components/home/AllStoriesSection";
import { PressNewsSection } from "@/components/home/PressNewsSection";
import { CustomerTestimonials } from "@/components/home/CustomerTestimonials";
import { Footer } from "@/components/navigation/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Top Announcement Bar */}
      <TopBar />

      {/* Main Navigation Header */}
      <Header />

      {/* Section 1: Hero Carousel Accordion & Video Showcase */}
      <HeroSection />

      {/* Section 2: End to End Manufacturing Process */}
      <ManufacturingProcess />

      {/* Section 3: Wholesale Partners Program */}
      <WholesaleProgram />

      {/* Section 4: Featured Products Category Tabs & Cards */}
      <FeaturedProducts />

      {/* Section 5: ArtisanFlow Platform Showcase & Environmental Impact Stats */}
      <ArtisanFlowShowcase />

      {/* Section 6: All Crafts Grid */}
      <AllCraftsSection />

      {/* Section 7: All Collaborations Grid */}
      <AllCollaborationsSection />

      {/* Section 8: All Clusters Grid */}
      <AllClustersSection />

      {/* Section 9: All Stories Accordion Gallery */}
      <AllStoriesSection />

      {/* Section 10: We Are In The News (Press) */}
      <PressNewsSection />

      {/* Section 11: Customer Testimonials */}
      <CustomerTestimonials />

      {/* Main Footer */}
      <Footer />
    </main>
  );
}
