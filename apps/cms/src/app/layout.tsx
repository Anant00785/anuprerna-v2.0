import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anuprerna CMS",
  description: "Admin & content management (weave)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
