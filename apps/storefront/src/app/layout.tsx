import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anuprerna",
  description: "Handloom & artisan textiles — public storefront",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
