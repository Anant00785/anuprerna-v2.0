"use client";

import React, { useState } from "react";
import { useCurrencyStore } from "@/stores/currency.store";

export interface FabricProfileItem {
  id: number | string;
  mockupImage?: string;
  mockupText?: string;
  fabricPreview: {
    id: number | string;
    name: string;
    sku: string;
    slug: string;
    heroImage: string;
    price: number;
    totalQuantity?: number;
    specialStatus?: {
      id?: number;
      name?: string;
    };
  };
}

export interface ProductCustomFabricProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  madeToOrderFabric?: any;
  fabricList: FabricProfileItem[];
  selectedFabric?: FabricProfileItem | null;
  onSelectFabric: (fabric: FabricProfileItem | null) => void;
}

function extractGSM(name: string = ""): number | null {
  const match = name.match(/(\d+)\s*GSM/i);
  return match ? parseInt(match[1], 10) : null;
}

export function ProductCustomFabricProfileDialog({
  isOpen,
  onClose,
  madeToOrderFabric,
  fabricList,
  selectedFabric,
  onSelectFabric,
}: ProductCustomFabricProfileDialogProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const currencyCode = selectedCurrency.toUpperCase();

  if (!isOpen) return null;

  const filteredList = fabricList.filter((item) => {
    const term = searchKeyword.toLowerCase();
    const name = item.fabricPreview?.name?.toLowerCase() || "";
    const sku = item.fabricPreview?.sku?.toLowerCase() || "";
    const status = item.fabricPreview?.specialStatus?.name?.toLowerCase() || "";
    return name.includes(term) || sku.includes(term) || status.includes(term);
  });

  const handleSelect = (item: FabricProfileItem | null) => {
    onSelectFabric(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Drawer */}
      <div className="w-full max-w-[800px] h-full bg-white shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Close Button Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1f1f1f]">
            Select Custom Fabric
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

        {/* Search Bar */}
        <div className="p-4 md:px-6 bg-[#FAFAF9] border-b border-gray-100">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#E5E7EB] shadow-xs">
            <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search fabrics by name, GSM, or SKU..."
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

        {/* Scrollable Fabric Cards List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
          {/* Default Made-To-Order Fabric */}
          {madeToOrderFabric && searchKeyword === "" && (
            <div
              onClick={() => handleSelect(null)}
              className={`relative rounded-xl border-2 p-3 flex gap-4 cursor-pointer transition-all ${
                !selectedFabric
                  ? "border-[#7D5A20] bg-[#FFFBF7] shadow-sm"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <img
                src={madeToOrderFabric.heroImage}
                alt={madeToOrderFabric.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="inline-block text-[11px] font-semibold text-[#7D5A20] bg-[#F7F2EB] px-2 py-0.5 rounded-full mb-1">
                    Default Fabric
                  </div>
                  <h3 className="font-semibold text-base md:text-lg text-gray-900 line-clamp-1">
                    {madeToOrderFabric.specialStatus?.name || madeToOrderFabric.name}{" "}
                    {extractGSM(madeToOrderFabric.name) ? `${extractGSM(madeToOrderFabric.name)} GSM` : ""}
                  </h3>
                  <div className="text-sm font-bold text-[#7D5A20] mt-0.5">
                    {currencyCode} {convertPrice(madeToOrderFabric.price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    SKU: {madeToOrderFabric.sku}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={`/product/fabric-product/${madeToOrderFabric.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-[#7D5A20] underline font-medium hover:text-black flex items-center gap-0.5"
                  >
                    <span>View Fabric Details</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              </div>

              {!selectedFabric && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#7D5A20] text-white flex items-center justify-center shadow">
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                </div>
              )}
            </div>
          )}

          {/* Alternate Custom Fabrics */}
          {filteredList.map((item) => {
            const fab = item.fabricPreview;
            const isSelected = selectedFabric?.fabricPreview?.id === fab.id || selectedFabric?.id === item.id;
            const gsm = extractGSM(fab.name);

            return (
              <div
                key={fab.id || item.id}
                onClick={() => handleSelect(item)}
                className={`relative rounded-xl border-2 p-3 flex gap-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-[#7D5A20] bg-[#FFFBF7] shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <img
                  src={fab.heroImage || item.mockupImage}
                  alt={fab.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-gray-900 line-clamp-1">
                      {fab.specialStatus?.name || fab.name} {gsm ? `${gsm} GSM` : ""}
                    </h3>
                    <div className="text-sm font-bold text-[#7D5A20] mt-0.5">
                      {currencyCode} {convertPrice(fab.price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 hidden md:block">
                      {fab.name}
                    </p>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      SKU: {fab.sku}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={`/product/fabric-product/${fab.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-[#7D5A20] underline font-medium hover:text-black flex items-center gap-0.5"
                    >
                      <span>View Fabric Details</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#7D5A20] text-white flex items-center justify-center shadow">
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  </div>
                )}
              </div>
            );
          })}

          {filteredList.length === 0 && searchKeyword !== "" && (
            <div className="py-12 text-center text-gray-500">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">search_off</span>
              <p className="text-sm">No fabrics found matching &quot;{searchKeyword}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface ProductCustomFabricProfileProps {
  product: any;
  fabricProfile: {
    id?: number | string;
    name?: string;
    fabricProfileItemList?: FabricProfileItem[];
  };
  selectedFabric?: FabricProfileItem | null;
  onSelectFabric: (fabric: FabricProfileItem | null) => void;
}

export function ProductCustomFabricProfile({
  product,
  fabricProfile,
  selectedFabric,
  onSelectFabric,
}: ProductCustomFabricProfileProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const rawList = fabricProfile?.fabricProfileItemList || [];
  const minOrderQty = product.madeToOrderProfile?.minimumOrderQuantity || 1;
  const filtered = rawList.filter(
    (item) => (item.fabricPreview?.totalQuantity ?? 0) > minOrderQty
  );
  const fabricList = filtered.length > 0 ? filtered : rawList;

  const defaultFabric =
    product.madeToOrderFabric ||
    (product.heroImage
      ? {
          name: product.name,
          heroImage: product.heroImage,
          sku: product.sku,
          price: product.price,
          slug: product.slug,
          specialStatus: product.specialStatus,
        }
      : null);

  const viewableList = fabricList.slice(0, 2);
  const remainingCount = Math.max(0, fabricList.length - 2);

  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-[#3c3c3c] text-sm">Choose Fabric</div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {/* Default Fabric Card */}
        {defaultFabric && (
          <div
            onClick={() => onSelectFabric(null)}
            className={`relative rounded-lg p-2 flex items-center gap-2 border-2 cursor-pointer transition-all ${
              !selectedFabric
                ? "border-[#7D5A20] bg-[#FFFBF7] shadow-xs"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <img
              src={defaultFabric.heroImage}
              alt={defaultFabric.name}
              className="w-10 h-10 rounded object-cover shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {defaultFabric.specialStatus?.name || "Default Fabric"}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                {extractGSM(defaultFabric.name)
                  ? `${extractGSM(defaultFabric.name)} GSM`
                  : defaultFabric.sku}
              </p>
            </div>

            {!selectedFabric && (
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#7D5A20] text-white flex items-center justify-center text-[10px]">
                ✓
              </div>
            )}
          </div>
        )}

        {/* Viewable Fabric Cards */}
        {viewableList.map((item) => {
          const fab = item.fabricPreview;
          const isSelected =
            selectedFabric?.fabricPreview?.id === fab.id || selectedFabric?.id === item.id;
          const gsm = extractGSM(fab.name);

          return (
            <div
              key={fab.id || item.id}
              onClick={() => onSelectFabric(item)}
              className={`relative rounded-lg p-2 flex items-center gap-2 border-2 cursor-pointer transition-all ${
                isSelected
                  ? "border-[#7D5A20] bg-[#FFFBF7] shadow-xs"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <img
                src={fab.heroImage || item.mockupImage}
                alt={fab.name}
                className="w-10 h-10 rounded object-cover shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {fab.specialStatus?.name || fab.name}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {gsm ? `${gsm} GSM` : fab.sku}
                </p>
              </div>

              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#7D5A20] text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
              )}
            </div>
          );
        })}

        {/* View All Button */}
        {fabricList.length > 2 && (
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="rounded-lg p-2 border-2 border-dashed border-gray-300 hover:border-[#7D5A20] text-[#7D5A20] flex items-center justify-center gap-1 text-xs font-semibold hover:bg-[#FFFBF7] transition-all cursor-pointer"
          >
            <span>View All ({remainingCount + (defaultFabric ? 1 : 0)})</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        )}
      </div>

      {/* Slide-over Dialog */}
      <ProductCustomFabricProfileDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        madeToOrderFabric={defaultFabric}
        fabricList={fabricList}
        selectedFabric={selectedFabric}
        onSelectFabric={onSelectFabric}
      />
    </div>
  );
}
