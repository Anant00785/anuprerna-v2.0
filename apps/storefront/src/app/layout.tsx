import type { Metadata } from "next";
import { Mulish, DM_Serif_Text, Inter, Jost } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
});

const dmSerif = DM_Serif_Text({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anuprerna | Sustainable Handloom & Artisan Textiles",
  description: "Public storefront for natural, eco-friendly handloom fabrics and finished artisan products.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${mulish.variable} ${dmSerif.variable} ${inter.variable} ${jost.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,1,0"
        />
      </head>
      <body className="font-sans antialiased bg-anuprerna-350 text-fb-textBlack">
        {children}
      </body>
    </html>
  );
}

