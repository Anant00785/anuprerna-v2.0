"use client";

import React from "react";
import { FilterActiveChip } from "@/types/domain/plp";

interface FilterActiveControlsProps {
  chips: FilterActiveChip[];
  onRemoveChip: (chip: FilterActiveChip) => void;
  onClearAll: () => void;
}

export const FilterActiveControls: React.FC<FilterActiveControlsProps> = ({
  chips,
  onRemoveChip,
  onClearAll,
}) => {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap w-full items-center gap-2 mb-4">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 select-none">
        FILTERS
      </span>

      {chips.map((chip, idx) => {
        let label = "";
        if (chip.type === "range" && chip.range) {
          label = `${chip.range.value1} - ${chip.range.value2}`;
        } else if (chip.option) {
          label = chip.option.displayName || chip.option.value;
        }

        const categoryName = (chip.name || "CRAFT").toUpperCase();

        return (
          <div
            key={idx}
            className="bg-[#FFF6F4] text-xs text-gray-800 rounded-full px-3 py-1 border border-[#FCDFD8] flex items-center gap-1.5 shadow-2xs select-none"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              {categoryName}
            </span>
            <span className="font-medium text-gray-800">{label}</span>
            <button
              type="button"
              onClick={() => onRemoveChip(chip)}
              className="text-gray-400 hover:text-gray-700 ml-0.5 text-xs font-bold leading-none cursor-pointer transition-colors"
              title="Remove filter"
            >
              ✕
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-[#8E7862] hover:text-[#6c5b48] underline ml-1.5 cursor-pointer select-none transition-colors"
      >
        Clear all
      </button>
    </div>
  );
};
