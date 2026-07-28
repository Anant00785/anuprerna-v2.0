"use client";

import { useState, useRef, useEffect } from "react";

const CURRENCIES = [
  { id: "inr", name: "INR", symbol: "₹" },
  { id: "usd", name: "USD", symbol: "$" },
  { id: "eur", name: "EUR", symbol: "€" },
  { id: "gbp", name: "GBP", symbol: "£" },
  { id: "aud", name: "AUD", symbol: "A$" },
  { id: "cad", name: "CAD", symbol: "C$" },
];

export function ForexDropdown({ className = "" }: { className?: string }) {
  const [selectedCurrency, setSelectedCurrency] = useState("inr");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOption = CURRENCIES.find((c) => c.id === selectedCurrency) || CURRENCIES[0];

  return (
    <div ref={containerRef} className={`select_trigger_cont relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fb-product-currency flex items-center gap-0.5 text-sm font-medium hover:text-[#9c8a6c] transition-colors py-1 px-1.5 rounded"
        type="button"
      >
        <span className="sort_text uppercase text-xs sm:text-sm font-semibold">{activeOption.name}</span>
        <span className="material-symbols-outlined text-lg leading-none">
          {isOpen ? "arrow_drop_up" : "arrow_drop_down"}
        </span>
      </button>

      {isOpen && (
        <div className="select absolute right-0 top-full mt-1 bg-white border border-[#EFEEE9] rounded-md shadow-lg z-50 min-w-[100px] py-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
          {CURRENCIES.map((option) => {
            const isActive = selectedCurrency === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedCurrency(option.id);
                  setIsOpen(false);
                }}
                className={`option w-full text-left px-3 py-1.5 text-xs uppercase font-medium transition-colors flex items-center justify-between ${
                  isActive ? "active_sort_option bg-[#f7f6f2] font-semibold text-[#9c8a6c]" : "hover:bg-[#f7f6f2] text-gray-800"
                }`}
              >
                <span>{option.name}</span>
                <span className="text-[10px] text-gray-500 font-normal">{option.symbol}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
