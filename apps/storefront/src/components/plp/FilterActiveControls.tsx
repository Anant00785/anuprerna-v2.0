"use client";

import React from "react";
import { FilterActiveChip, FilterControls } from "@/types/domain/plp";

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
    <div className="flex flex-wrap w-full justify-center md:justify-start items-center mb-3 gap-1.5">
      {chips.map((chip, idx) => {
        let label = "";
        if (chip.type === "range" && chip.range) {
          label = `${chip.name.toLowerCase()} : ${chip.range.value1} - ${chip.range.value2}`;
        } else if (chip.option) {
          label = (chip.option.displayName || chip.option.value).toLowerCase();
        }

        return (
          <div
            key={idx}
            onClick={() => onRemoveChip(chip)}
            className="bg-[#fcf4e8] text-[12px] text-[#302e2e] rounded-lg px-2.5 py-1 border border-[#75787F]/20 cursor-pointer flex gap-1 items-center justify-center hover:bg-[#f6ebd9] transition-colors"
          >
            <span>{label}</span>
            <span className="material-symbols-outlined text-[13px] leading-none">
              close
            </span>
          </div>
        );
      })}

      <button
        onClick={onClearAll}
        className="text-[12px] bg-white text-[#302e2e] rounded-lg px-2.5 py-1 border border-[#75787F]/20 cursor-pointer flex gap-1 items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <span>clear</span>
        <span className="material-symbols-outlined text-[13px] leading-none">
          close
        </span>
      </button>
    </div>
  );
};
