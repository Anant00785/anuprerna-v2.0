"use client";

import React, { useState, useEffect } from "react";
import { useCurrencyStore } from "@/stores/currency.store";

export interface SizeProfileOption {
  id: number | string;
  label: string;
  keyFeature?: string;
  sortOrder?: number;
}

export interface ProductSizeItem {
  id: number | string;
  quantity: number;
  disabled?: boolean;
  sizeProfileOption: SizeProfileOption;
}

export interface CustomSizeProfileItem {
  label: string;
  placeholder?: string;
  mandatory?: boolean;
  fieldType?: number | string; // 1 = number, text otherwise
}

export interface CustomSizeProfile {
  id: number | string;
  price: number;
  disclaimer?: string;
  customSizeProfileItemList?: CustomSizeProfileItem[];
}

export interface SizeProfile {
  id?: number | string;
  displayName?: string;
  image?: string;
  disclaimer?: string;
  sizeProfileOptionList?: SizeProfileOption[];
}

export interface ProductSizeGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup?: string;
  sizeProfile?: SizeProfile;
}

export function ProductSizeGuideDialog({
  isOpen,
  onClose,
  productGroup = "finished",
  sizeProfile,
}: ProductSizeGuideDialogProps) {
  const [isCm, setIsCm] = useState(false);

  if (!isOpen || !sizeProfile) return null;

  const isFinished = productGroup === "finished";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[900px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-[#FAFAF9]">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1f1f1f]">
            {isFinished ? "Size Guide" : "Pantone & Dye Guide"}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
          {/* Disclaimer */}
          {sizeProfile.disclaimer && (
            <div className="p-3.5 bg-[#FFFBF7] border border-[#C79D6D]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#7D5A20]">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
              <p className="leading-relaxed">{sizeProfile.disclaimer}</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Measurements Table (For finished goods) */}
            {isFinished && sizeProfile.sizeProfileOptionList && (
              <div className="w-full flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-800">Product Measurements</h3>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={!isCm ? "text-[#7D5A20] font-bold" : "text-gray-400"}>Inches</span>
                    <button
                      type="button"
                      onClick={() => setIsCm(!isCm)}
                      className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                        isCm ? "bg-[#7D5A20]" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isCm ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className={isCm ? "text-[#7D5A20] font-bold" : "text-gray-400"}>Centimeters</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-[#F7F5F0] text-[#1f1f1f] font-bold border-b border-gray-200">
                        <th className="p-2.5 text-left pl-4">Size Option</th>
                        <th className="p-2.5">Key Specification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeProfile.sizeProfileOptionList.map((opt, idx) => (
                        <tr
                          key={opt.id || idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-[#FAFAF9]"}
                        >
                          <td className="p-2.5 text-left pl-4 font-semibold text-gray-900">
                            {opt.label}
                          </td>
                          <td className="p-2.5 text-gray-600 font-medium">
                            {opt.keyFeature || "Standard Fit / Dimension"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Guide Diagram Image */}
            {sizeProfile.image && (
              <div className="shrink-0 flex justify-center items-center bg-[#FAFAF9] p-4 rounded-xl border border-gray-100">
                <img
                  src={sizeProfile.image}
                  alt={sizeProfile.displayName || "Size Guide"}
                  className="max-h-[320px] max-w-full object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ProductSizeProfileProps {
  product: any;
  sizeProfile?: SizeProfile;
  productSizeProfileList?: ProductSizeItem[];
  selectedSize?: SizeProfileOption | null;
  onSizeSelect: (size: SizeProfileOption) => void;
  customSizeSubmittedData?: Record<string, string> | null;
  onCustomSizeSubmit: (data: Record<string, string> | null) => void;
}

export function ProductSizeProfile({
  product,
  sizeProfile,
  productSizeProfileList = [],
  selectedSize,
  onSizeSelect,
  customSizeSubmittedData,
  onCustomSizeSubmit,
}: ProductSizeProfileProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(false);
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const currencyCode = selectedCurrency.toUpperCase();

  const customSizeProfile: CustomSizeProfile | undefined = product.customSizeProfile;
  const customItems = customSizeProfile?.customSizeProfileItemList || [];

  // Sort size items by sortOrder
  const sortedSizes = [...productSizeProfileList].sort(
    (a, b) => (a.sizeProfileOption?.sortOrder ?? 0) - (b.sizeProfileOption?.sortOrder ?? 0)
  );

  const defaultInStock =
    sortedSizes.find((it: any) => !it.disabled && Number(it.quantity ?? it.totalQuantity ?? it.availableQuantity ?? 0) > 0) ||
    sortedSizes.find((it: any) => !it.disabled) ||
    sortedSizes[0];

  const activeOption =
    selectedSize || defaultInStock?.sizeProfileOption || (defaultInStock as any) || null;

  const handleSelectSizeOption = (sizeOpt: SizeProfileOption) => {
    setShowCustomForm(false);
    onCustomSizeSubmit(null);
    onSizeSelect(sizeOpt);
  };

  const handleCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate mandatory fields
    const missing = customItems.some((it) => it.mandatory && !customValues[it.label]?.trim());
    if (missing) {
      setFormError(true);
      return;
    }
    setFormError(false);
    setShowCustomForm(false);
    onCustomSizeSubmit(customValues);
  };

  const isCustomActive = Boolean(customSizeSubmittedData) || showCustomForm;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="font-bold text-[#3c3c3c] text-sm">
          {sizeProfile?.displayName || "Choose Size"}
        </div>
      </div>

      {/* Selected Key Feature Subtitle */}
      {activeOption && !isCustomActive && activeOption.keyFeature && (
        <div className="text-xs text-gray-500 font-medium -mt-1">
          {activeOption.keyFeature}
        </div>
      )}

      {/* Submitted Custom Dimensions Summary */}
      {customSizeSubmittedData && (
        <div className="p-2 bg-[#FFFBF7] rounded border border-[#C79D6D]/40 text-xs text-[#7D5A20] flex items-center justify-between flex-wrap gap-1">
          <span>
            <strong>Custom: </strong>
            {Object.entries(customSizeSubmittedData)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")}
          </span>
          <button
            type="button"
            onClick={() => onCustomSizeSubmit(null)}
            className="text-[11px] underline font-bold hover:text-black"
          >
            Reset
          </button>
        </div>
      )}

      {/* Size Buttons Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {sortedSizes.map((item) => {
          const opt = item.sizeProfileOption || (item as any);
          if (!opt) return null;
          const isSelected =
            !isCustomActive &&
            (activeOption?.id ? String(activeOption.id) === String(opt.id) : activeOption?.label === opt.label);

          return (
            <button
              key={opt.id || opt.label}
              type="button"
              onClick={() => handleSelectSizeOption(opt)}
              className={`px-3.5 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? "border-[#7D5A20] bg-[#FFFBF7] text-[#7D5A20] ring-1 ring-[#7D5A20]"
                  : "border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        {/* Custom Size Button */}
        {product.customSizeProfileEnabled && customSizeProfile && (
          <button
            type="button"
            onClick={() => {
              setShowCustomForm(!showCustomForm);
            }}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
              isCustomActive
                ? "border-[#7D5A20] bg-[#FFFBF7] text-[#7D5A20] ring-1 ring-[#7D5A20]"
                : "border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
            }`}
          >
            <span>Custom {product.productGroup === "finished" ? "Size" : "Dimension"}</span>
          </button>
        )}

        {/* Size Guide Trigger Button */}
        {sizeProfile && (
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-1.5 rounded text-xs font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-sm">straighten</span>
            <span>Size Guide</span>
          </button>
        )}
      </div>

      {/* Inline Custom Size Form */}
      {showCustomForm && product.customSizeProfileEnabled && customSizeProfile && (
        <form
          onSubmit={handleCustomFormSubmit}
          className="p-3.5 bg-[#FAFAF9] rounded-xl border border-gray-200 mt-2 flex flex-col gap-3 animate-in fade-in duration-200"
        >
          {customSizeProfile.disclaimer && (
            <p className="text-xs text-amber-800 font-medium">
              * {customSizeProfile.disclaimer}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {customItems.map((customIt) => (
              <div key={customIt.label} className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-700">
                  {customIt.label}
                  {customIt.mandatory && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type={customIt.fieldType === 1 ? "number" : "text"}
                  placeholder={customIt.placeholder || customIt.label}
                  value={customValues[customIt.label] || ""}
                  onChange={(e) =>
                    setCustomValues({ ...customValues, [customIt.label]: e.target.value })
                  }
                  className="px-2.5 py-1.5 text-xs bg-white rounded border border-gray-300 outline-none focus:border-[#7D5A20]"
                />
              </div>
            ))}
          </div>

          {formError && (
            <span className="text-xs text-red-600 font-bold">
              Please fill all required fields (*)
            </span>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500 font-medium">
              Customization Charge: +{currencyCode} {convertPrice(customSizeProfile.price || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#7D5A20] text-white text-xs font-bold rounded hover:bg-[#66491a] transition-colors"
            >
              Apply Custom Size
            </button>
          </div>
        </form>
      )}

      {/* Size Guide Modal */}
      <ProductSizeGuideDialog
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        productGroup={product.productGroup}
        sizeProfile={sizeProfile}
      />
    </div>
  );
}
