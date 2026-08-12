import { Suspense } from "react";
import { TopBar } from "@/components/navigation/TopBar";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { AuthContainer } from "@/components/auth/AuthContainer";

export const metadata = {
  title: "Sign In / Sign Up | Anuprerna",
  description: "Sign in or create an account to manage your profile and orders.",
};

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#fffcf7] font-sans">
      <TopBar />
      <Header />
      <Suspense
        fallback={
          <div className="min-h-[80vh] flex items-center justify-center bg-[#fffcf7]">
            <div className="w-8 h-8 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        <AuthContainer />
      </Suspense>
      <Footer />
    </main>
  );
}
