import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { ContactUsPage } from "@/components/contact/ContactUsPage";

export default function ContactRoute() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar />
        <Header />
        <main className="w-full">
          <ContactUsPage />
        </main>
      </div>
      <Footer />
    </div>
  );
}
