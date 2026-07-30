"use client";

import React from "react";
import { FilterControls, FilterActiveChip } from "@/types/domain/plp";
import { FilterControl } from "./FilterControl";
import { FilterActiveControls } from "./FilterActiveControls";

interface FilterContainerProps {
  controls: FilterControls;
  totalResults: number;
  chips: FilterActiveChip[];
  isMobile?: boolean;
  onControlsChange: () => void;
  onRemoveChip: (chip: FilterActiveChip) => void;
  onClearAll: () => void;
}

export const FilterContainer: React.FC<FilterContainerProps> = ({
  controls,
  totalResults,
  chips,
  isMobile = false,
  onControlsChange,
  onRemoveChip,
  onClearAll,
}) => {
  const inStockGroup = controls.cohorts.find((c) => c.key.key === "inStock");
  const inStockOption = inStockGroup?.cohort?.options[0];

  const handleInStockToggle = () => {
    if (inStockOption) {
      inStockOption.active = !inStockOption.active;
      onControlsChange();
    }
  };

  return (
    <div className="w-full flex flex-col justify-start items-stretch">
      {/* Desktop Active Chips */}
      {!isMobile && (
        <FilterActiveControls
          chips={chips}
          onRemoveChip={onRemoveChip}
          onClearAll={onClearAll}
        />
      )}

      {/* Showing Products Count Badge */}
      {totalResults > 0 && (
        <div className="w-full rounded text-[#8E7862] py-1.5 px-3 bg-[#fffcf7] border border-[#75787F]/20 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-normal mb-4">
          <span>Showing</span>
          <span className="font-semibold">{totalResults}</span>
          <span>Products</span>
        </div>
      )}

      {/* SHOW IN-STOCK ONLY Toggle Switch */}
      {inStockOption && (
        <div className="mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
          <label
            htmlFor="in-stock-toggle"
            className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#302e2e] cursor-pointer select-none"
          >
            SHOW IN-STOCK ONLY
          </label>
          <button
            id="in-stock-toggle"
            type="button"
            role="switch"
            aria-checked={Boolean(inStockOption.active)}
            onClick={handleInStockToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              inStockOption.active ? "bg-[#8E7862]" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                inStockOption.active ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}

      {/* Filter Control Cohorts */}
      <section className="fb-filter-container flex flex-col justify-start items-stretch max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
        {controls.cohorts.map((group, idx) => (
          <FilterControl
            key={group.key.key || idx}
            control={group}
            onControlChange={onControlsChange}
          />
        ))}
      </section>
    </div>
  );
};
