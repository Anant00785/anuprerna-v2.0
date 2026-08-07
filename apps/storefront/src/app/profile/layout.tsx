import React from 'react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Header />
      <main className="flex-1 w-full max-w-[1350px] mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="w-full lg:w-[20%] flex-shrink-0">
            <ProfileSidebar userName="Ananya Sharma" showWholesaleProgram={true} />
          </div>
          <div className="w-full lg:w-[80%] min-h-[400px]">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
