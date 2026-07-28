"use client";

import { useState } from "react";

export function TopBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-[#fbf4e8] text-fb-textBlack text-xs md:text-sm py-2 px-4 relative flex items-center justify-center font-medium border-b border-[#f0e6d6]">
      <p className="text-center tracking-wide">
        Khesh : Explore Our New Recycled Craft Fabric Designs Handcrafted By Artisans
      </p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 md:right-6 text-gray-500 hover:text-black transition-colors p-1 text-sm font-semibold"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
