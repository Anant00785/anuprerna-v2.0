"use client";

import React, { useState } from "react";
import { FilterControlGroup, FilterOption } from "@/types/domain/plp";

interface FilterControlProps {
  control: FilterControlGroup;
  onControlChange: () => void;
}

export const FilterControl: React.FC<FilterControlProps> = ({
  control,
  onControlChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [fullView, setFullView] = useState(false);

  const { title, key, cohort, rangeCohort } = control;

  if (key.type === "toggle" || key.key === "category") {
    return null;
  }

  // Parent checkbox change for sub-cohort
  const handleMainChange = (parentOpt: FilterOption) => {
    const nextState = !parentOpt.active;
    parentOpt.active = nextState;
    if (parentOpt.subOptions) {
      parentOpt.subOptions.forEach((sub) => {
        sub.active = nextState;
      });
    }
    onControlChange();
  };

  // Child sub-option checkbox change
  const handleSubChange = (parentOpt: FilterOption, subOpt: FilterOption) => {
    subOpt.active = !subOpt.active;
    if (parentOpt.subOptions) {
      parentOpt.active = parentOpt.subOptions.every((s) => s.active);
    }
    onControlChange();
  };

  // Generic option change
  const handleOptionChange = (opt: FilterOption) => {
    opt.active = !opt.active;
    onControlChange();
  };

  // Range change
  const handleRangeChange = (val1: number, val2: number) => {
    if (rangeCohort) {
      rangeCohort.value1 = val1;
      rangeCohort.value2 = val2;
      rangeCohort.active = val1 > rangeCohort.defaultMin || val2 < rangeCohort.defaultMax;
      onControlChange();
    }
  };

  return (
    <div className="fb-filter-control flex flex-col justify-start items-stretch my-2 border-b border-gray-100 pb-3">
      {/* Group Header */}
      <div className="flex flex-row justify-between items-center cursor-pointer py-1" onClick={() => setCollapsed(!collapsed)}>
        <h3 className="capitalize text-lg font-semibold text-[#302e2e]">{title}</h3>
        <span className="material-symbols-outlined text-gray-600 select-none">
          {collapsed ? "add" : "remove"}
        </span>
      </div>

      {/* Group Body */}
      {!collapsed && (
        <div className="mt-2 flex flex-col gap-2">
          {/* Sub Type (Craft / Category) */}
          {key.type === "sub" && cohort && (
            <>
              {cohort.options.slice(0, fullView ? cohort.options.length : 2).map((parentOpt, pIdx) => (
                <div key={pIdx} className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-base font-semibold text-[#9c8a6c] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(parentOpt.active)}
                      onChange={() => handleMainChange(parentOpt)}
                      className="w-4 h-4 rounded text-[#8E7862] focus:ring-[#8E7862] border-gray-300 cursor-pointer"
                    />
                    <span className="capitalize">{parentOpt.value}</span>
                  </label>

                  {parentOpt.subOptions?.map((subOpt, sIdx) => (
                    <label key={sIdx} className="ml-5 flex items-center gap-2 text-sm text-[#302e2e] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(subOpt.active)}
                        onChange={() => handleSubChange(parentOpt, subOpt)}
                        className="w-4 h-4 rounded text-[#8E7862] focus:ring-[#8E7862] border-gray-300 cursor-pointer"
                      />
                      <span className="capitalize">{subOpt.value}</span>
                    </label>
                  ))}
                </div>
              ))}

              {cohort.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setFullView(!fullView)}
                  className="w-full rounded border-2 border-[#8E7862]/60 text-[#8E7862] py-1 px-3 hover:border-[#6c5b48] hover:bg-[#8E7862]/5 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold mt-2"
                >
                  <span>{fullView ? "Show Less" : "Show More"}</span>
                  <span className="material-symbols-outlined text-[18px]">
                    {fullView ? "expand_less" : "expand_more"}
                  </span>
                </button>
              )}
            </>
          )}

          {/* CSV Type (Color, Material, Pattern) & Default Type */}
          {(key.type === "csv" || key.type === "default") && cohort && (
            <>
              {cohort.options.slice(0, fullView ? cohort.options.length : 5).map((opt, oIdx) => {
                const isColor = key.key === "color";
                const labelText = opt.displayName || opt.value;

                return (
                  <label key={oIdx} className="flex items-center gap-2.5 text-sm text-[#302e2e] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(opt.active)}
                      onChange={() => handleOptionChange(opt)}
                      className="w-4 h-4 rounded text-[#8E7862] focus:ring-[#8E7862] border-gray-300 cursor-pointer"
                    />

                    {isColor ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-black shadow-sm shrink-0"
                          style={{ backgroundColor: opt.hex || "#ddd" }}
                        />
                        <span className="capitalize text-sm font-medium">{labelText}</span>
                      </div>
                    ) : (
                      <span className="capitalize text-sm font-medium">{labelText}</span>
                    )}
                  </label>
                );
              })}

              {cohort.options.length > 5 && (
                <button
                  type="button"
                  onClick={() => setFullView(!fullView)}
                  className="w-full rounded border-2 border-[#8E7862]/60 text-[#8E7862] py-1 px-3 hover:border-[#6c5b48] hover:bg-[#8E7862]/5 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold mt-2"
                >
                  <span>{fullView ? "Show Less" : "Show More"}</span>
                  <span className="material-symbols-outlined text-[18px]">
                    {fullView ? "expand_less" : "expand_more"}
                  </span>
                </button>
              )}
            </>
          )}

          {/* Range Type (Price, GSM, Availability) */}
          {key.type === "range" && rangeCohort && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex justify-between items-center text-xs font-medium text-[#75787F]">
                <span>Min: {rangeCohort.value1}</span>
                <span>Max: {rangeCohort.value2}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={rangeCohort.defaultMin}
                  max={rangeCohort.defaultMax}
                  value={rangeCohort.value1}
                  onChange={(e) =>
                    handleRangeChange(Number(e.target.value), Math.max(Number(e.target.value), rangeCohort.value2))
                  }
                  className="w-full accent-[#8E7862] cursor-pointer"
                />
                <input
                  type="range"
                  min={rangeCohort.defaultMin}
                  max={rangeCohort.defaultMax}
                  value={rangeCohort.value2}
                  onChange={(e) =>
                    handleRangeChange(Math.min(Number(e.target.value), rangeCohort.value1), Number(e.target.value))
                  }
                  className="w-full accent-[#8E7862] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
