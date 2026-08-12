"use client";

import React from "react";

interface FilterPaginatorProps {
  totalItems: number;
  itemsPerPage?: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const FilterPaginator: React.FC<FilterPaginatorProps> = ({
  totalItems,
  itemsPerPage = 31,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const maxPagesToShow = 5;

  if (totalPages <= 1) return null;

  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  const adjustedStartPage = Math.max(1, Math.min(startPage, totalPages - maxPagesToShow + 1));

  const pages = Array.from(
    { length: endPage - adjustedStartPage + 1 },
    (_, i) => adjustedStartPage + i
  );

  return (
    <div className="w-full flex justify-center items-center my-6">
      <div className="flex justify-center items-center gap-1.5 flex-wrap">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`rounded-lg py-1 px-2 text-[#8E7862] transition-all flex items-center justify-center ${
            currentPage === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-[#fffcf7] shadow md:shadow-md border border-[#75787F]/20 hover:bg-[#8E7862] hover:text-white"
          }`}
          title="First Page"
        >
          <span className="material-symbols-outlined text-[16px]">
            keyboard_double_arrow_left
          </span>
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`rounded-lg py-1 px-2.5 text-[#8E7862] transition-all flex items-center justify-center ${
            currentPage === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-[#fffcf7] shadow md:shadow-md border border-[#75787F]/20 hover:bg-[#8E7862] hover:text-white"
          }`}
          title="Previous Page"
        >
          <span className="material-symbols-outlined text-[14px]">
            arrow_back_ios
          </span>
        </button>

        {/* Page Numbers */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`rounded-lg py-1 px-3 text-xs md:text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#8E7862] text-white font-bold shadow-md"
                  : "bg-[#fffcf7] text-[#8E7862] shadow md:shadow-md border border-[#75787F]/20 hover:bg-[#8E7862] hover:text-white"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`rounded-lg py-1 px-2.5 text-[#8E7862] transition-all flex items-center justify-center ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-[#fffcf7] shadow md:shadow-md border border-[#75787F]/20 hover:bg-[#8E7862] hover:text-white"
          }`}
          title="Next Page"
        >
          <span className="material-symbols-outlined text-[14px]">
            arrow_forward_ios
          </span>
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`rounded-lg py-1 px-2 text-[#8E7862] transition-all flex items-center justify-center ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-[#fffcf7] shadow md:shadow-md border border-[#75787F]/20 hover:bg-[#8E7862] hover:text-white"
          }`}
          title="Last Page"
        >
          <span className="material-symbols-outlined text-[16px]">
            double_arrow
          </span>
        </button>
      </div>
    </div>
  );
};
