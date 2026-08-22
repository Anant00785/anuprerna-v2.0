"use client";

import React, { useState } from "react";
import { useCurrencyStore } from "@/stores/currency.store";

export interface FinishProfileItem {
  id: number | string;
  image: string;
  label: string;
  price: number;
  description?: string;
}

export interface ProductFinishProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  finishProfile: {
    displayName?: string;
    finishProfileItemList?: FinishProfileItem[];
  };
  selectedFinishes: FinishProfileItem[];
  onFinishChange: (finishes: FinishProfileItem[]) => void;
}

export function ProductFinishProfileDialog({
  isOpen,
  onClose,
  finishProfile,
  selectedFinishes,
  onFinishChange,
}: ProductFinishProfileDialogProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const currencyCode = selectedCurrency.toUpperCase();

  if (!isOpen) return null;

  const list = finishProfile?.finishProfileItemList || [];
  const filteredList = list.filter((item) => {
    const term = searchKeyword.toLowerCase();
    const label = item.label?.toLowerCase() || "";
    const desc = item.description?.toLowerCase() || "";
    return label.includes(term) || desc.includes(term);
  });

  const toggleFinish = (item: FinishProfileItem) => {
    const exists = selectedFinishes.some((f) => f.id === item.id);
    if (exists) {
      onFinishChange(selectedFinishes.filter((f) => f.id !== item.id));
    } else {
      onFinishChange([...selectedFinishes, item]);
    }
  };

  const totalFinishPrice = selectedFinishes.reduce((sum, f) => sum + Number(f.price || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-[800px] h-full bg-white shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1f1f1f]">
            {finishProfile.displayName || "Choose Custom Finish / Organic Dye"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#D4A373] text-white flex items-center justify-center hover:bg-[#b58356] transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 md:px-6 bg-[#FAFAF9] border-b border-gray-100">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search finish options by name or plant extract..."
              className="w-full text-sm outline-none text-gray-800 placeholder-gray-400"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid of Finish Cards */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredList.map((finish) => {
            const isSelected = selectedFinishes.some((f) => f.id === finish.id);

            return (
              <div
                key={finish.id}
                onClick={() => toggleFinish(finish)}
                className={`relative rounded-xl border-2 p-3 flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? "border-[#7D5A20] bg-[#FFFBF7] shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div>
                  <img
                    src={finish.image}
                    alt={finish.label}
                    className="w-full aspect-square rounded-lg object-cover mb-2"
                  />
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 capitalize">
                    {finish.label.toLowerCase()}
                  </h3>
                  <div className="text-xs font-bold text-[#7D5A20] mt-0.5">
                    + {currencyCode} {convertPrice(finish.price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </div>
                  {finish.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {finish.description}
                    </p>
                  )}
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7D5A20] text-white flex items-center justify-center text-xs shadow">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Bar: Selected Summary & Action Buttons */}
        <div className="border-t border-gray-200 p-4 bg-white flex flex-col gap-3">
          {selectedFinishes.length > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">Selected:</span>
                {selectedFinishes.map((f) => (
                  <span
                    key={f.id}
                    onClick={() => toggleFinish(f)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F7F2EB] text-[#7D5A20] rounded-full text-xs font-medium cursor-pointer hover:bg-[#ebdcc8]"
                  >
                    <span>{f.label.toLowerCase()}</span>
                    <span>&times;</span>
                  </span>
                ))}
              </div>

              <div className="text-sm font-bold text-gray-900">
                Total Add-on: {currencyCode} {convertPrice(totalFinishPrice).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-[#7D5A20] text-white font-semibold text-sm hover:bg-[#66491a] transition-colors"
            >
              Apply Selection ({selectedFinishes.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ProductFinishProfileProps {
  finishProfile: {
    displayName?: string;
    finishProfileItemList?: FinishProfileItem[];
  };
  selectedFinishes: FinishProfileItem[];
  onFinishChange: (finishes: FinishProfileItem[]) => void;
}

export function ProductFinishProfile({
  finishProfile,
  selectedFinishes,
  onFinishChange,
}: ProductFinishProfileProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const rawList = finishProfile?.finishProfileItemList || [];
  const viewableFinishes = rawList.slice(0, 6);
  const remainingCount = Math.max(0, rawList.length - 6);

  const toggleFinish = (item: FinishProfileItem) => {
    const exists = selectedFinishes.some((f) => f.id === item.id);
    if (exists) {
      onFinishChange(selectedFinishes.filter((f) => f.id !== item.id));
    } else {
      onFinishChange([...selectedFinishes, item]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-[#3c3c3c] text-sm">
        {finishProfile.displayName || "Choose Finish / Organic Dye"}
      </div>

      {/* Selected Chips */}
      {selectedFinishes.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedFinishes.map((finish) => (
            <button
              key={finish.id}
              type="button"
              onClick={() => toggleFinish(finish)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F7F2EB] text-[#7D5A20] rounded-full text-xs font-medium hover:bg-[#eddcc7] transition-colors cursor-pointer"
            >
              <span className="capitalize">{finish.label.toLowerCase()}</span>
              <span className="font-bold ml-0.5">&times;</span>
            </button>
          ))}
        </div>
      )}

      {/* Swatch Thumbnail Cards */}
      <div className="flex flex-wrap items-center gap-2">
        {viewableFinishes.map((finish) => {
          const isSelected = selectedFinishes.some((f) => f.id === finish.id);

          return (
            <div
              key={finish.id}
              onClick={() => toggleFinish(finish)}
              className={`relative rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${
                isSelected
                  ? "border-[#7D5A20] ring-1 ring-[#7D5A20]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              title={`${finish.label} (+₹${finish.price})`}
            >
              <img
                src={finish.image}
                alt={finish.label}
                className="w-14 h-14 object-cover object-bottom"
              />
              {isSelected && (
                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#7D5A20] text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
              )}
            </div>
          );
        })}

        {remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#7D5A20] text-gray-700 hover:text-[#7D5A20] text-xs font-bold flex items-center justify-center text-center hover:bg-[#FFFBF7] transition-all cursor-pointer"
          >
            +{remainingCount} More
          </button>
        )}
      </div>

      {/* Finish Profile Dialog */}
      <ProductFinishProfileDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        finishProfile={finishProfile}
        selectedFinishes={selectedFinishes}
        onFinishChange={onFinishChange}
      />
    </div>
  );
}
