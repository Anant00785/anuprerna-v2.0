"use client";

import React, { useState, useRef, useEffect } from "react";

interface FilterSortDropdownProps {
  selectedOption: string;
  onSortChange: (option: string) => void;
}

const SORT_OPTIONS = [
  { id: "availability", label: "Availability", icon: "📦" },
  { id: "new-arrival", label: "Recommended", icon: "✨" },
  { id: "low-to-high", label: "Price: Low to High", icon: "💸" },
  { id: "high-to-low", label: "Price: High to Low", icon: "💰" },
];

export const FilterSortDropdown: React.FC<FilterSortDropdownProps> = ({
  selectedOption,
  onSortChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    SORT_OPTIONS.find((opt) => opt.id === selectedOption) || SORT_OPTIONS[0];

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
    <div className="flex items-center gap-2.5 text-left" ref={dropdownRef}>
      <span className="text-sm text-gray-500 font-normal select-none">Sort by</span>

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl border border-black px-3.5 py-1.5 bg-white shadow-xs flex items-center gap-2 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer select-none"
        >
          <span className="text-base leading-none">{currentOption.icon}</span>
          <span className="font-medium text-gray-900">{currentOption.label}</span>
          <span className="material-symbols-outlined text-lg text-gray-700 leading-none">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white shadow-2xl border border-gray-100 z-50 p-1.5 flex flex-col gap-0.5 text-sm font-medium">
            {SORT_OPTIONS.map((opt) => {
              const isActive = selectedOption === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onSortChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-[#F1F3F5] text-gray-900 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </div>
                  {isActive && (
                    <span className="text-[#3B664B] font-bold text-sm">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
