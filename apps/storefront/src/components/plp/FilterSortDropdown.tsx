"use client";

import React, { useState, useRef, useEffect } from "react";

interface FilterSortDropdownProps {
  selectedOption: string;
  onSortChange: (option: string) => void;
}

const SORT_OPTIONS = [
  { id: "availability", label: "By Availability" },
  { id: "new-arrival", label: "New Arrival" },
  { id: "low-to-high", label: "Price Low To High" },
  { id: "high-to-low", label: "Price High To Low" },
];

export const FilterSortDropdown: React.FC<FilterSortDropdownProps> = ({
  selectedOption,
  onSortChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg text-[#8E7862] py-1.5 px-3 bg-[#fffcf7] shadow md:shadow-md border border-[#75787F]/20 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#fcf4e8] transition-colors"
      >
        <span className="material-symbols-outlined text-[17px]">
          {isOpen ? "close" : "sort"}
        </span>
        <span>sort by</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#fffcf7] shadow-lg border border-[#75787F]/20 z-30 p-2 text-xs uppercase font-medium">
          {SORT_OPTIONS.map((opt) => {
            const isActive = selectedOption === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  onSortChange(opt.id);
                  setIsOpen(false);
                }}
                className={`py-2 px-3 cursor-pointer rounded transition-all border-b border-[#e1e0da] last:border-b-0 ${
                  isActive
                    ? "opacity-100 font-bold bg-[#8E7862]/10 text-[#7D5B20]"
                    : "opacity-60 hover:opacity-100 hover:bg-[#8E7862]/5 text-[#302e2e]"
                }`}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
