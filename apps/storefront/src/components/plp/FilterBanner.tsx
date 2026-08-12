"use client";

import React from "react";
import Link from "next/link";
import { FilterSegment } from "@/types/domain/plp";

interface FilterBannerProps {
  heading?: string;
  description?: string;
  image?: string;
  segments?: FilterSegment[];
  categoryPage?: string;
}

export const FilterBanner: React.FC<FilterBannerProps> = ({
  heading,
  description,
  image,
  segments = [],
  categoryPage = "",
}) => {
  if (!heading && segments.length === 0) return null;

  return (
    <div className="w-full mb-6">
      {/* Category Banner */}
      {heading && (
        <div className="bg-[#fbf4e8] rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="text-center md:text-left flex-1">
            <h1 className="font-serif text-2xl md:text-4xl text-[#302e2e] capitalize mb-3 font-normal">
              {heading}
            </h1>
            {description && (
              <p className="font-sans text-xs md:text-sm text-gray-700 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>
          {image && (
            <div className="hidden md:flex justify-end max-h-[220px] shrink-0">
              <img
                src={image}
                alt={heading}
                className="object-contain max-h-[200px]"
              />
            </div>
          )}
        </div>
      )}

      {/* Category Segments Bar ("Shop By Category") */}
      {segments && segments.length > 0 && (
        <div className="flex flex-col md:flex-row justify-start items-center gap-4 py-3">
          <h2 className="font-serif text-xl hidden md:block text-[#302e2e]">
            Shop By Category
          </h2>
          <div className="w-full md:w-auto flex flex-wrap justify-start items-center gap-3">
            {segments.map((seg, idx) => {
              if (seg.name.toLowerCase() === "homeware") return null;
              const segSlug = seg.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={idx}
                  href={`/products/finished?category=${categoryPage}&${segSlug}=all`}
                  className="rounded-md flex items-center gap-2 border border-[#D8D8D8] px-3 py-1.5 hover:bg-[#F0F5FA] transition-colors bg-white shadow-sm"
                >
                  {seg.icon && (
                    <img
                      src={seg.icon}
                      alt={seg.name}
                      className="w-10 h-10 object-contain"
                    />
                  )}
                  <span className="font-sans text-xs font-medium capitalize text-[#302e2e]">
                    {seg.name.toLowerCase()}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
