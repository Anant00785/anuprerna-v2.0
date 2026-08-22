"use client";

import { useState } from "react";
import Link from "next/link";

export function TopBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-[#fbf4e8] text-[#302e2e] text-[12px] md:text-[13.5px] py-[3px] px-4 relative flex items-center justify-center font-normal border-b border-[#efeee9] z-50">
      <Link
        href="/products/fabric?dyed-plain-weaves=khesh-recycled-fabric&page=1&sort-by=availability"
        className="text-center hover:underline cursor-pointer block truncate max-w-[85vw] md:max-w-none"
      >
        <p>Khesh : Explore Our New Recycled Craft Fabric Designs Handcrafted By Artisans</p>
      </Link>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 md:right-5 text-gray-500 hover:text-black transition-colors p-0.5 text-xs"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
