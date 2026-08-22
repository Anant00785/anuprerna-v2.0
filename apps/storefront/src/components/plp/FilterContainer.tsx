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
    <div className="w-full flex-1 flex flex-col justify-start items-stretch min-h-0 overflow-hidden">
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
        <div className="w-full rounded text-[#8E7862] py-1.5 px-3 bg-[#fffcf7] border border-[#75787F]/20 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-normal mb-3 shrink-0">
          <span>Showing</span>
          <span className="font-semibold">{totalResults}</span>
          <span>Products</span>
        </div>
      )}

      {/* SHOW IN-STOCK ONLY Toggle Switch matching media_1787351759783.png */}
      {inStockOption && (
        <div className="mb-3 pb-2 flex items-center gap-3 shrink-0 border-b border-gray-100">
          <button
            id="in-stock-toggle"
            type="button"
            role="switch"
            aria-checked={Boolean(inStockOption.active)}
            onClick={handleInStockToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              inStockOption.active ? "bg-[#8a6d46]" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#fdfbf7] shadow ring-0 transition duration-200 ease-in-out ${
                inStockOption.active ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <label
            htmlFor="in-stock-toggle"
            className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-black cursor-pointer select-none"
          >
            SHOW IN-STOCK ONLY
          </label>
        </div>
      )}

      {/* Filter Control Cohorts with Custom Slim Scrollbar extending all the way down */}
      <section className="fb-filter-container flex-1 flex flex-col justify-start items-stretch overflow-y-auto pr-2 pb-8 min-h-0">
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
