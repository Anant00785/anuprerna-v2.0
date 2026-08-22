"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckoutPriceBreakdown, CheckoutStep } from "@/types/domain/checkout";

interface CheckoutPriceSummaryProps {
  price: CheckoutPriceBreakdown;
  currencyCode: string;
  money: (amount: number) => string;
  onApplyVoucher: (code: string) => Promise<void>;
  onCancelVoucher: () => void;
  note: string;
  onNoteChange: (note: string) => void;
  currentStep: CheckoutStep;
  onContinue: () => void;
  isProcessing?: boolean;
}

export function CheckoutPriceSummary({
  price,
  currencyCode,
  money,
  onApplyVoucher,
  onCancelVoucher,
  note,
  onNoteChange,
  currentStep,
  onContinue,
  isProcessing = false,
}: CheckoutPriceSummaryProps) {
  const [isVoucherOpen, setIsVoucherOpen] = useState<boolean>(Boolean(price.couponCode));
  const [voucherInput, setVoucherInput] = useState<string>("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState<boolean>(false);
  const [isNoteVisible, setIsNoteVisible] = useState<boolean>(true);

  const handleApply = async () => {
    if (!voucherInput.trim()) return;
    setIsApplyingVoucher(true);
    try {
      await onApplyVoucher(voucherInput.trim());
      setVoucherInput("");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const buttonLabel =
    currentStep === "cart"
      ? "Continue to Delivery"
      : currentStep === "shipping"
      ? "Continue to Payment"
      : "Place Order";

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Main Order Summary Card */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 sm:p-7">
        <h3 className="text-base font-bold text-gray-900 mb-4">
          Order Summary
        </h3>

        {/* Subtotal */}
        <div className="flex justify-between items-center py-1.5 text-sm text-gray-700">
          <span>Subtotal:</span>
          <span className="font-semibold text-gray-900">
            {currencyCode} {money(price.subtotal)}
          </span>
        </div>

        {/* Loyalty / Wholesale Discount */}
        {price.wholesaleDiscountAmount > 0 && (
          <div className="flex justify-between items-center py-1.5 text-xs sm:text-sm text-emerald-700">
            <span>Wholesale Discount:</span>
            <span className="font-bold">- {currencyCode} {money(price.wholesaleDiscountAmount)}</span>
          </div>
        )}

        {price.volumeDiscountAmount > 0 && (
          <div className="flex justify-between items-center py-1.5 text-xs sm:text-sm text-gray-600">
            <span>Volume Discount:</span>
            <span className="font-semibold">- {currencyCode} {money(price.volumeDiscountAmount)}</span>
          </div>
        )}

        {/* Shipping Cost */}
        <div className="flex justify-between items-center py-1.5 text-sm text-gray-700">
          <span>Shipping Cost:</span>
          {price.isShippingFree ? (
            <span className="font-bold text-green-700 uppercase text-xs bg-green-50 px-2 py-0.5 rounded border border-green-200">
              Free Shipping
            </span>
          ) : (
            <span className="font-semibold text-gray-900">
              {currencyCode} {money(price.shippingCost)}
            </span>
          )}
        </div>

        {/* Add Voucher Link & Collapsible Input */}
        <div className="py-2">
          {!isVoucherOpen ? (
            <button
              type="button"
              onClick={() => setIsVoucherOpen(true)}
              className="text-sm font-medium text-[#ca9b6d] hover:underline cursor-pointer"
            >
              Add Voucher
            </button>
          ) : (
            <div className="mt-2 bg-[#fbf7f1] p-3 rounded-lg border border-[#ca9b6d]/30">
              {price.couponCode ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#065f46] uppercase">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>{price.couponCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onCancelVoucher}
                    className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Voucher code"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-xs uppercase font-semibold text-gray-900 focus:outline-none focus:border-[#ca9b6d]"
                  />
                  <button
                    type="button"
                    disabled={isApplyingVoucher || !voucherInput.trim()}
                    onClick={handleApply}
                    className="bg-[#ca9b6d] hover:bg-[#b8895b] text-white px-3.5 py-1.5 rounded text-xs font-bold uppercase transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {isApplyingVoucher ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>
          )}

          {price.couponDiscountAmount > 0 && (
            <div className="flex justify-between items-center py-1.5 text-xs font-bold text-green-700 mt-2">
              <span>Coupon Discount:</span>
              <span>- {currencyCode} {money(price.couponDiscountAmount)}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Grand Total */}
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-base font-bold text-gray-900">Total:</span>
          <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {currencyCode} {money(price.total)}
          </span>
        </div>

        {/* Advance vs Remaining Balance for Made-to-Order / Pre-Order (Matching Screenshot) */}
        {price.remainingBalance > 0 && (
          <div className="space-y-2 mb-5 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-900">
              <span>Payable Now:</span>
              <span className="font-bold">{currencyCode} {money(price.advancePay)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
              <span>Payable Before Dispatch:</span>
              <span className="font-bold text-gray-900">{currencyCode} {money(price.remainingBalance)}</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-2">
              Includes items made to order. Pay the first amount now to confirm it, and we will email you for the balance before your order ships.
            </p>
          </div>
        )}

        {/* Continue / Action Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={onContinue}
          className="w-full bg-[#A67C52] hover:bg-[#956f48] text-white py-3.5 rounded-lg text-sm sm:text-base font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{buttonLabel}</span>
          <span className="material-symbols-outlined text-lg">
            {isProcessing ? "hourglass_top" : "arrow_forward"}
          </span>
        </button>

        {/* Security Compliance Badges */}
        <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mt-4">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-gray-600">lock</span>
            <span>SSL Secure</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-gray-600">verified_user</span>
            <span>PCI Compliant</span>
          </span>
        </div>
      </div>

      {/* Add Note Light Slate Card */}
      {isNoteVisible ? (
        <div className="bg-[#f0f2f8] rounded-xl border border-[#e2e5ee] p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Add Note</h4>
            <button
              type="button"
              onClick={() => setIsNoteVisible(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Anything we should know about this order?"
            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs sm:text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ca9b6d] focus:border-[#ca9b6d] mt-2.5 resize-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsNoteVisible(true)}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline text-center"
        >
          + Add Note
        </button>
      )}

      {/* Disclaimer Text */}
      <p className="text-[11px] text-[#8e7a62] leading-relaxed text-center px-2">
        {currentStep === "payment"
          ? "* Factors like placing an order on a holiday, emergencies, custom issues may end up pushing the arrival of your item beyond the estimated delivery date."
          : "*We try our best to accurately represent all our items online. But at times, the digital photos may not fully represent the exact colour or nature of an item. Therefore, we recommend you to request a fabric swatch before purchasing the final product."}
      </p>

      {/* Policy mini links */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[#8e7a62] text-center">
        <Link href="/content/policy/privacy-policy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link href="/content/policy/return-exchange-policy" className="hover:underline">
          Return Policy
        </Link>
        <Link href="/content/policy/terms-and-conditions" className="hover:underline">
          Terms & Conditions
        </Link>
        <Link href="/content/policy/international-orders" className="hover:underline">
          International Orders
        </Link>
      </div>
    </div>
  );
}
