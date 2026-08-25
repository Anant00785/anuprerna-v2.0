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

const BOTANICAL_INSETS = {
  madder: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/static-data/Madder.jpg",
  indigo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/static-data/Indigo.jpg",
  green: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/static-data/Myrobalan.jpg",
  yellow: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/static-data/Pomegranate.jpg",
  maroon: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/static-data/Manjistha.jpg",
};

export function getBotanicalInset(label: string = ""): string {
  const l = label.toLowerCase();
  if (l.includes("madder") || l.includes("pink") || l.includes("rose")) return BOTANICAL_INSETS.madder;
  if (l.includes("indigo") || l.includes("blue") || l.includes("navy")) return BOTANICAL_INSETS.indigo;
  if (l.includes("green") || l.includes("myrobalan") || l.includes("sage") || l.includes("olive")) return BOTANICAL_INSETS.green;
  if (l.includes("yellow") || l.includes("pomegranate") || l.includes("turmeric") || l.includes("ochre")) return BOTANICAL_INSETS.yellow;
  return BOTANICAL_INSETS.maroon;
}

export const FULL_NATURAL_DYE_LIST: FinishProfileItem[] = [
  { id: 1, label: "Light Dusty Pink Natural Madder Dye", price: 357, description: "Hue of light dusty pink dyed using madder or Manjistha dye.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/PENTN7FGNSWP4W6PW254LI6JXG8907796.jpg" },
  { id: 2, label: "Dark Dusty Pink Natural Madder Dye", price: 397, description: "Dark dusty pink hue dyed using madder or Manjistha dye.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/KY57BIHN7AX260C568Y557C5NFF804241.jpg" },
  { id: 3, label: "Blue Natural Indigo Dye", price: 303, description: "Hue of blue that has been dyed using indigo plant dye.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZWADZPMYSPI8Q00OID5TIASCOG3502523.jpg" },
  { id: 4, label: "Royal Indigo Navy Dye", price: 380, description: "Deep rich royal indigo hue from organic indigo ferments.", image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80" },
  { id: 5, label: "Sky Blue Indigo Dye", price: 320, description: "Soft airy sky blue shade extracted from natural indigo leaves.", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
  { id: 6, label: "Myrobalan Green Dye", price: 340, description: "Sustainable herbal dye with olive green tones.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/N0DMJMIDQAO2SXK92WEN2FCJG1K806173.jpg" },
  { id: 7, label: "Forest Herbal Green Dye", price: 360, description: "Earthy deep forest green achieved via Myrobalan and Indigo blends.", image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80" },
  { id: 8, label: "Sage Leaf Green Dye", price: 335, description: "Subtle muted sage green tone derived from natural pomegranate and indigo.", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" },
  { id: 9, label: "Pomegranate Yellow Dye", price: 325, description: "Warm mustard yellow from natural pomegranate rind.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/B83N7C8CFCROO1L3N54IPN0KHV8I06138.jpg" },
  { id: 10, label: "Golden Turmeric Yellow Dye", price: 310, description: "Vibrant golden sunshine yellow dyed using raw turmeric root.", image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80" },
  { id: 11, label: "Raw Ochre Earth Yellow Dye", price: 345, description: "Warm ochre clay tone extracted from natural mineral pigments.", image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80" },
  { id: 12, label: "Iron Black Natural Dye", price: 355, description: "Deep charcoal tone from natural iron rust solution.", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80" },
  { id: 13, label: "Slate Grey Herbal Dye", price: 330, description: "Cool slate charcoal hue from iron acetate and tannin.", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" },
  { id: 14, label: "Terracotta Rust Madder Dye", price: 375, description: "Earthy warm terracotta rust shade from concentrated Madder root.", image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80" },
  { id: 15, label: "Walnut Bark Brown Dye", price: 365, description: "Deep rich chocolate brown extracted from Himalayan walnut hulls.", image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80" },
  { id: 16, label: "Chestnut Tan Herbal Dye", price: 350, description: "Warm chestnut brown shade dyed using natural tannins.", image: "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80" },
  { id: 17, label: "Mulberry Berry Purple Dye", price: 390, description: "Subtle berry plum violet from wild mulberry and sappanwood.", image: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80" },
  { id: 18, label: "Crimson Sappanwood Red Dye", price: 410, description: "Rich crimson red extracted from natural Indian sappanwood heartwood.", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80" },
  { id: 19, label: "Coral Rose Herbal Dye", price: 360, description: "Soft warm coral pink derived from light sappanwood and alum.", image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80" },
  { id: 20, label: "Raw Khadi Sand Beige Dye", price: 295, description: "Unbleached natural ecru sand tone with zero added synthetic chemicals.", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80" },
  { id: 21, label: "Warm Linen Beige Dye", price: 310, description: "Soft warm oatmeal beige dyed using natural tea leaves and Myrobalan.", image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80" },
  { id: 22, label: "Olive Drab Earth Dye", price: 345, description: "Classic muted olive drab tone from pomegranate rind and iron liquor.", image: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=800&q=80" },
];

const PANTONE_GUIDE_SWATCHES = [
  { code: "Pantone 100", hex: "#F3ED7C" },
  { code: "Pantone 101", hex: "#F5EE40" },
  { code: "Pantone 102", hex: "#FBEB00" },
  { code: "Pantone 103", hex: "#C3B100" },
  { code: "Pantone 108", hex: "#FEE100" },
  { code: "Pantone 109", hex: "#FED100" },
  { code: "Pantone 110", hex: "#D9AC00" },
  { code: "Pantone 111", hex: "#A48600" },
  { code: "Pantone 116", hex: "#FFCD00" },
  { code: "Pantone 117", hex: "#C89600" },
  { code: "Pantone 118", hex: "#9E7500" },
  { code: "Pantone 119", hex: "#7B5C00" },
  { code: "Pantone 124", hex: "#EAAA00" },
  { code: "Pantone 125", hex: "#B88300" },
  { code: "Pantone 126", hex: "#8A6200" },
  { code: "Pantone 127", hex: "#F3DD8B" },
  { code: "Pantone 132", hex: "#956A00" },
  { code: "Pantone 133", hex: "#624600" },
  { code: "Pantone 134", hex: "#F9CE81" },
  { code: "Pantone 135", hex: "#F7BE67" },
  { code: "Pantone 140", hex: "#784B00" },
  { code: "Pantone 141", hex: "#F4C46D" },
  { code: "Pantone 142", hex: "#F3B251" },
  { code: "Pantone 143", hex: "#F29D38" },
  { code: "Pantone 150", hex: "#F5A352" },
  { code: "Pantone 151", hex: "#FF8200" },
  { code: "Pantone 152", hex: "#E15C00" },
  { code: "Pantone 153", hex: "#B84300" },
  { code: "Pantone 160", hex: "#A54000" },
  { code: "Pantone 161", hex: "#632700" },
  { code: "Pantone 162", hex: "#FFAA8A" },
  { code: "Pantone 163", hex: "#FF8559" },
  { code: "19-1537 TCX Winery", hex: "#64243B" },
  { code: "Pantone 180", hex: "#B93A32" },
  { code: "Pantone 181", hex: "#772421" },
  { code: "Pantone 185", hex: "#E4002B" },
  { code: "Pantone 210", hex: "#FF7CB0" },
  { code: "Pantone 220", hex: "#A0005D" },
  { code: "Pantone 280", hex: "#012169" },
  { code: "Pantone 285", hex: "#0072CE" },
  { code: "Pantone 300", hex: "#005BBB" },
  { code: "Pantone 303", hex: "#002A3A" },
  { code: "Pantone 340", hex: "#00965E" },
  { code: "Pantone 361", hex: "#1EB980" },
  { code: "Pantone 375", hex: "#97D700" },
  { code: "Pantone 450", hex: "#5C5638" },
  { code: "Pantone 453", hex: "#C7C4A5" },
  { code: "Pantone 468", hex: "#D8C7A5" },
];

export interface ProductFinishProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  finishProfile?: {
    displayName?: string;
    finishProfileItemList?: FinishProfileItem[];
  } | null;
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

  const rawList =
    finishProfile?.finishProfileItemList && finishProfile.finishProfileItemList.length > 0
      ? finishProfile.finishProfileItemList
      : FULL_NATURAL_DYE_LIST;

  const filteredList = rawList.filter((item) => {
    const term = searchKeyword.toLowerCase();
    const label = item.label?.toLowerCase() || "";
    const desc = item.description?.toLowerCase() || "";
    return label.includes(term) || desc.includes(term);
  });

  const toggleFinish = (item: FinishProfileItem) => {
    const exists = selectedFinishes.some((f) => String(f.id) === String(item.id));
    if (exists) {
      onFinishChange(selectedFinishes.filter((f) => String(f.id) !== String(item.id)));
    } else {
      onFinishChange([item]); // Single or multiple dye select
    }
  };

  const totalFinishPrice = selectedFinishes.reduce((sum, f) => sum + Number(f.price || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-[800px] h-full bg-white shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1f1f1f]">
            {finishProfile?.displayName || "Custom Natural Vegetable Dye"}
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
              placeholder="Search dye options by name or plant extract..."
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
            const isSelected = selectedFinishes.some((f) => String(f.id) === String(finish.id));

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
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2">
                    <img
                      src={finish.image}
                      alt={finish.label}
                      className="w-full h-full object-cover"
                    />
                    <img
                      src={getBotanicalInset(finish.label)}
                      alt="Plant extract"
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white object-cover shadow"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 capitalize">
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

        {/* Bottom Bar */}
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
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-[#7D5A20] text-white font-semibold text-sm hover:bg-[#66491a] transition-colors cursor-pointer"
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
  finishProfile?: {
    displayName?: string;
    finishProfileItemList?: FinishProfileItem[];
  } | null;
  selectedFinishes: FinishProfileItem[];
  onFinishChange: (finishes: FinishProfileItem[]) => void;
  customPantone?: string;
  onCustomPantoneChange?: (pantone: string) => void;
}

export function ProductFinishProfile({
  finishProfile,
  selectedFinishes,
  onFinishChange,
  customPantone = "",
  onCustomPantoneChange,
}: ProductFinishProfileProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPantoneGuideOpen, setIsPantoneGuideOpen] = useState(false);
  const [isCustomDyeModalOpen, setIsCustomDyeModalOpen] = useState(false);
  const [tempPantone, setTempPantone] = useState(customPantone);
  const [dyeNotes, setDyeNotes] = useState("");

  const rawList =
    finishProfile?.finishProfileItemList && finishProfile.finishProfileItemList.length > 0
      ? finishProfile.finishProfileItemList
      : FULL_NATURAL_DYE_LIST;

  const viewableFinishes = rawList.slice(0, 6);
  const remainingCount = Math.max(0, rawList.length - 6);

  const isOriginal = selectedFinishes.length === 0 && !customPantone;
  const isCustomDyeActive = Boolean(customPantone);

  const handleSelectOriginal = () => {
    onFinishChange([]);
    if (onCustomPantoneChange) onCustomPantoneChange("");
  };

  const toggleFinish = (item: FinishProfileItem) => {
    if (onCustomPantoneChange) onCustomPantoneChange("");
    const exists = selectedFinishes.some((f) => String(f.id) === String(item.id));
    if (exists) {
      onFinishChange(selectedFinishes.filter((f) => String(f.id) !== String(item.id)));
    } else {
      onFinishChange([item]);
    }
  };

  const handleApplyCustomPantone = () => {
    if (onCustomPantoneChange) onCustomPantoneChange(tempPantone || "Custom Shade");
    onFinishChange([]);
    setIsCustomDyeModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Custom Organic Dye Section */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs md:text-sm font-bold text-[#3c3c3c]">Custom Organic Dye</span>
        <span className="text-xs text-gray-500">Original Fabric Color As Displayed</span>

        <div className="flex items-center gap-2 flex-wrap mt-1">
          {/* As per Original Button */}
          <button
            type="button"
            onClick={handleSelectOriginal}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              isOriginal
                ? "border-2 border-[#C79D6D] bg-[#FFFBF7] text-[#7D5A20] shadow-xs"
                : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            As per Original
          </button>

          {/* Custom Dye Button */}
          <button
            type="button"
            onClick={() => setIsCustomDyeModalOpen(true)}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              isCustomDyeActive
                ? "border-2 border-[#C79D6D] bg-[#FFFBF7] text-[#7D5A20] shadow-xs"
                : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {customPantone ? `Custom: ${customPantone}` : "Custom Dye"}
          </button>

          {/* Guide Button */}
          <button
            type="button"
            onClick={() => setIsPantoneGuideOpen(true)}
            className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Guide</span>
            <span className="material-symbols-outlined text-sm text-gray-500">info</span>
          </button>
        </div>
      </div>

      {/* 2. Custom Natural Vegetable Dye Section */}
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="text-xs md:text-sm font-bold text-[#3c3c3c]">
          {finishProfile?.displayName || "Custom Natural Vegetable Dye"}
        </span>

        {/* Selected Dye Chip */}
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

        {/* Swatch Thumbnails */}
        <div className="flex flex-wrap items-center gap-2">
          {viewableFinishes.map((finish) => {
            const isSelected = selectedFinishes.some((f) => String(f.id) === String(finish.id));

            return (
              <div
                key={finish.id}
                onClick={() => toggleFinish(finish)}
                className={`relative w-14 h-14 rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${
                  isSelected
                    ? "border-[#7D5A20] ring-1 ring-[#7D5A20]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                title={`${finish.label} (+₹${finish.price})`}
              >
                <img
                  src={finish.image}
                  alt={finish.label}
                  className="w-full h-full object-cover"
                />
                <img
                  src={getBotanicalInset(finish.label)}
                  alt="Botanical"
                  className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full border border-white object-cover shadow-xs"
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
              className="w-14 h-14 rounded-lg border border-gray-300 hover:border-[#7D5A20] text-gray-700 hover:text-[#7D5A20] text-xs font-medium flex items-center justify-center text-center hover:bg-[#FFFBF7] transition-all cursor-pointer leading-tight bg-white"
            >
              + {remainingCount}<br />More
            </button>
          )}
        </div>
      </div>

      {/* Full Dialog for All Dyes */}
      <ProductFinishProfileDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        finishProfile={finishProfile}
        selectedFinishes={selectedFinishes}
        onFinishChange={onFinishChange}
      />

      {/* Pantone Guide Modal */}
      {isPantoneGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 flex flex-col gap-4 relative max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#1f1f1f]">Pantone TCX Color Reference Guide</h3>
              <button
                type="button"
                onClick={() => setIsPantoneGuideOpen(false)}
                className="text-gray-400 hover:text-gray-900 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Select or copy a Pantone TCX code for custom dyeing. Our master dyers match shades accurately on organic fabrics.
            </p>

            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-1">
              {PANTONE_GUIDE_SWATCHES.map((swatch, sIdx) => (
                <div
                  key={sIdx}
                  onClick={() => {
                    setTempPantone(swatch.code);
                    if (onCustomPantoneChange) onCustomPantoneChange(swatch.code);
                    onFinishChange([]);
                    setIsPantoneGuideOpen(false);
                  }}
                  className="p-2 border rounded-lg hover:border-[#7D5A20] cursor-pointer flex flex-col items-center gap-1.5 group bg-gray-50 hover:bg-[#FFFBF7] transition-all"
                >
                  <div className="w-full h-10 rounded shadow-xs border border-black/10" style={{ backgroundColor: swatch.hex }} />
                  <span className="text-[10px] text-center font-mono font-medium text-gray-700 group-hover:text-[#7D5A20] truncate w-full">
                    {swatch.code}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsPantoneGuideOpen(false)}
              className="w-full bg-[#C79D6D] text-white font-bold py-2.5 rounded-lg hover:bg-[#b0885a] transition-colors text-sm cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Custom Dye Modal */}
      {isCustomDyeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 relative">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#1f1f1f]">Custom Dyeing Request</h3>
              <button
                type="button"
                onClick={() => setIsCustomDyeModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Pantone / Shade Code or Name
                </label>
                <input
                  type="text"
                  value={tempPantone}
                  onChange={(e) => setTempPantone(e.target.value)}
                  placeholder="e.g. Pantone 19-1537 TCX or Sage Green"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-[#C79D6D]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Special Dyeing Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={dyeNotes}
                  onChange={(e) => setDyeNotes(e.target.value)}
                  placeholder="Enter specific shade requirements or fastness instructions..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:outline-[#C79D6D]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCustomDyeModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomPantone}
                className="flex-1 py-2.5 bg-[#C79D6D] text-white rounded-lg text-xs font-bold hover:bg-[#b0885a]"
              >
                Apply Custom Dye
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
