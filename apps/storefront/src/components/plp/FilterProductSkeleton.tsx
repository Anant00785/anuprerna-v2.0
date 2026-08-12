"use client";

import React from "react";

export const FilterProductSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse bg-white border border-[#75787F]/20 shadow md:shadow-md rounded md:rounded-xl p-3 flex flex-col justify-between h-[420px]">
      <div>
        <div className="w-full aspect-square bg-gray-200 rounded md:rounded-lg mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded flex-1"></div>
        <div className="h-8 bg-gray-200 rounded w-10"></div>
      </div>
    </div>
  );
};
