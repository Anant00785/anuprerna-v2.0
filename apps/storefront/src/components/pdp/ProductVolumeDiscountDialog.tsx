"use client";

import React from "react";
import { useCurrencyStore } from "@/stores/currency.store";
import { calculateVDProductPrice, VDProfileItem } from "@/lib/pdp/pricing-engine";

export interface VolumeDiscountItem extends VDProfileItem {
  preOrder: boolean;
  advancePayment: number;
  deliveryFromDays: number;
  deliveryToDays: number;
}

export interface VolumeDiscountProfile {
  profileName: string;
  disclaimer?: string;
  volumeDiscountProfileItemList: VolumeDiscountItem[];
}

export interface ProductVolumeDiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  basePrice: number;
  selectFinishPrice?: number;
  customSizePrice?: number;
  selectedFabric?: any;
  unit: string;
  volumeDiscountProfile?: VolumeDiscountProfile | null;
  consumedFabric?: number;
}

export function ProductVolumeDiscountDialog({
  isOpen,
  onClose,
  product,
  basePrice,
  selectFinishPrice = 0,
  customSizePrice = 0,
  selectedFabric,
  unit,
  volumeDiscountProfile,
  consumedFabric = 1,
}: ProductVolumeDiscountDialogProps) {
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const currencyCode = selectedCurrency.toUpperCase();

  if (!isOpen || !volumeDiscountProfile) return null;

  // Angular sorts tiers ascending by discount for display
  const tiers = [...(volumeDiscountProfile.volumeDiscountProfileItemList || [])].sort(
    (a, b) => a.discount - b.discount
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-[500px] bg-white rounded-xl shadow-2xl p-6 flex flex-col z-10 animate-in zoom-in-95 duration-200">
        {/* Top Left Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -left-3 w-8 h-8 rounded bg-[#D4A373] text-white flex items-center justify-center hover:bg-[#b58356] transition-colors shadow-md cursor-pointer"
          title="Close"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>

        {/* Modal Title */}
        <h2 className="font-bold text-[#3c3c3c] mb-4 text-center text-lg md:text-xl">
          {volumeDiscountProfile.profileName}
        </h2>

        {/* Tier Pricing List */}
        <div className="flex flex-col divide-y divide-gray-100 mb-4">
          {tiers.map((vd, idx) => {
            const tierPrice = product
              ? calculateVDProductPrice({
                  product,
                  selectedFabric,
                  selectFinishPrice,
                  customSizePrice,
                  selectedVDProfile: vd,
                  quantity: vd.minimumOrderQuantity,
                  consumedFabric,
                })
              : basePrice * (1 - (vd.discount || 0) / 100);

            const formattedPrice = convertPrice(tierPrice).toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            });

            return (
              <div
                key={idx}
                className="py-2.5 flex justify-between items-center text-sm md:text-base capitalize"
              >
                <div className="font-medium text-gray-700">
                  For {vd.minimumOrderQuantity} {unit.toLowerCase()}s
                </div>
                <div className="font-bold text-[#7D5A20]">
                  {currencyCode} {formattedPrice} / {unit.toLowerCase()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer Warning Box */}
        {volumeDiscountProfile.disclaimer && (
          <div className="p-3 bg-[#FFF8D0] border border-[#FFEBAA] rounded-lg text-xs text-[#6B5A10] leading-relaxed flex items-start gap-2 mt-2">
            <span className="material-symbols-outlined text-base text-[#7D5A20] shrink-0 mt-0.5">
              error
            </span>
            <div className="whitespace-pre-line">{volumeDiscountProfile.disclaimer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
