import type { Metadata } from "next";
import "./globals.css";
import PageFeedbackWidget from "@/components/feedback/PageFeedbackWidget";

export const metadata: Metadata = {
  title: "Weave — Anuprerna CMS",
  description: "Internal CMS for Anuprerna Artisan Alliance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <PageFeedbackWidget />
      </body>
    </html>
  );
}
