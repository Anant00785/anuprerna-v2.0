"use client";

import { useId } from "react";

interface CheckoutShipToProps {
  countryName: string;
  onCountryChange: (country: string) => void;
  disabled?: boolean;
}

const COMMON_COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Canada",
  "Netherlands",
  "Italy",
  "Spain",
  "Japan",
  "Singapore",
  "United Arab Emirates",
  "Switzerland",
  "Sweden",
  "New Zealand",
  "Austria",
  "Belgium",
  "Denmark",
  "Ireland",
  "Norway",
  "Portugal",
  "Saudi Arabia",
  "South Africa",
  "South Korea",
];

export function CheckoutShipTo({
  countryName,
  onCountryChange,
  disabled = false,
}: CheckoutShipToProps) {
  const selectId = useId();

  return (
    <div className="bg-[#f0eee9] p-4 sm:p-5 mb-4 rounded-sm flex items-center justify-between">
      <label htmlFor={selectId} className="text-[#3c3c3c] font-semibold text-sm sm:text-base uppercase tracking-wider">
        Ship to:
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={countryName}
          disabled={disabled}
          onChange={(e) => onCountryChange(e.target.value)}
          className="appearance-none bg-white border border-[#b7a98f] rounded px-4 py-2 pr-8 text-sm font-medium text-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#8e7a62] cursor-pointer disabled:opacity-50"
        >
          {COMMON_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-sm">
          expand_more
        </span>
      </div>
    </div>
  );
}
