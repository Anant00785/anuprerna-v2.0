"use client";

import { useState } from "react";
import { AddressItem } from "@/types/domain/profile";
import { EditAddressModal } from "./EditAddressModal";

interface CheckoutAddressSectionProps {
  addresses: AddressItem[];
  selectedBillingAddress: Partial<AddressItem> | null;
  selectedShippingAddress: Partial<AddressItem> | null;
  onSelectBillingAddress: (address: AddressItem) => void;
  onSelectShippingAddress: (address: AddressItem) => void;
  onSaveNewAddress: (address: Partial<AddressItem>) => Promise<void>;
  countryName: string;
  hasValidationErrors?: boolean;
  sameAsShipping?: boolean;
  onToggleSameAsShipping?: (value: boolean) => void;
}

export function isPhoneValid(phone?: string): boolean {
  if (!phone) return false;
  const digits = phone.trim().replace(/\D/g, "");
  return digits.length >= 10;
}

export function isPhoneMissingCountryCode(phone?: string): boolean {
  if (!phone) return false;
  const cleaned = phone.trim().replace(/[\s-]/g, "");
  return cleaned.startsWith("0") || (!cleaned.startsWith("+") && cleaned.length === 10);
}

export function CheckoutAddressSection({
  addresses,
  selectedBillingAddress,
  selectedShippingAddress,
  onSelectBillingAddress,
  onSelectShippingAddress,
  onSaveNewAddress,
  countryName,
  hasValidationErrors = false,
  sameAsShipping = true,
  onToggleSameAsShipping,
}: CheckoutAddressSectionProps) {
  const [internalSameAsShipping, setInternalSameAsShipping] = useState<boolean>(sameAsShipping);
  const isSameAsShipping = onToggleSameAsShipping ? sameAsShipping : internalSameAsShipping;

  const [isAddressListModalOpen, setIsAddressListModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [modalTarget, setModalTarget] = useState<"SHIPPING" | "BILLING">("SHIPPING");
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  const shipping = selectedShippingAddress || selectedBillingAddress;
  const billing = isSameAsShipping ? shipping : (selectedBillingAddress || selectedShippingAddress);

  const isShippingPhoneInvalid = shipping ? !isPhoneValid(shipping.primaryPhone) || isPhoneMissingCountryCode(shipping.primaryPhone) : false;
  const isBillingPhoneInvalid = billing ? !isPhoneValid(billing.primaryPhone) || isPhoneMissingCountryCode(billing.primaryPhone) : false;

  const handleOpenEdit = (addr: Partial<AddressItem> | null, target: "SHIPPING" | "BILLING") => {
    setModalTarget(target);
    setEditingAddress(addr as AddressItem);
    setIsEditModalOpen(true);
  };

  const handleOpenAdd = (target: "SHIPPING" | "BILLING") => {
    setModalTarget(target);
    setEditingAddress(null);
    setIsEditModalOpen(true);
  };

  const handleOpenList = (target: "SHIPPING" | "BILLING") => {
    setModalTarget(target);
    setIsAddressListModalOpen(true);
  };

  const handleSelectFromList = (addr: AddressItem) => {
    if (modalTarget === "SHIPPING") {
      onSelectShippingAddress(addr);
      if (sameAsShipping) {
        onSelectBillingAddress(addr);
      }
    } else {
      onSelectBillingAddress(addr);
    }
    setIsAddressListModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* 1. Shipping Address Section */}
      <div className="w-full">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Shipping Address
        </h3>

        {shipping && (shipping.name || shipping.addressLineOne || (shipping as any).addressLine1) ? (
          <div>
            <div className="border border-gray-200/90 rounded-xl p-5 bg-white relative shadow-2xs">
              {/* Stacked Edit Button (Matching Screenshot 1:1) */}
              <button
                type="button"
                onClick={() => handleOpenEdit(shipping, "SHIPPING")}
                className="absolute top-4 right-5 text-[#8E7862] hover:text-[#6c5b48] flex flex-col items-center text-xs font-medium cursor-pointer transition-colors"
                title="Edit Address"
              >
                <span className="material-symbols-outlined text-[18px] leading-none mb-0.5">edit</span>
                <span className="text-[11px] leading-none">Edit</span>
              </button>

              {/* Name */}
              <p className="font-semibold text-sm text-gray-900 pr-14">
                {shipping.name || "Default Address"}
              </p>

              {/* Address lines */}
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {[
                  shipping.addressLineOne || (shipping as any).addressLine1,
                  shipping.addressLineTwo || (shipping as any).addressLine2,
                  shipping.city,
                  shipping.state,
                  shipping.postalCode,
                  shipping.country || countryName || "India",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              {/* Contact Details */}
              {shipping.primaryPhone && (
                <p className="text-xs text-gray-700 mt-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px] text-gray-500 leading-none">call</span>
                  <span>{shipping.primaryPhone}</span>
                </p>
              )}

              {shipping.contactEmail && (
                <p className="text-xs text-gray-700 mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px] text-gray-500 leading-none">mail</span>
                  <span>{shipping.contactEmail}</span>
                </p>
              )}
            </div>

            {/* Use Another Address Link */}
            <button
              type="button"
              onClick={() => handleOpenList("SHIPPING")}
              className="text-xs font-semibold text-[#8E7862] hover:text-[#6c5b48] underline mt-3 inline-block cursor-pointer transition-colors"
            >
              Use Another Address
            </button>

            {/* Red Phone Validation Warning Box */}
            {(isShippingPhoneInvalid || (hasValidationErrors && !shipping.primaryPhone)) && (
              <div className="bg-[#ffebee] border border-[#f8d7da] text-[#c62828] text-xs font-medium p-3 rounded-lg mt-3.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#c62828]">error</span>
                <span>Select your country code, then enter your phone number without it.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white">
            <p className="text-sm text-gray-500 mb-3">No shipping address selected.</p>
            <button
              type="button"
              onClick={() => handleOpenAdd("SHIPPING")}
              className="bg-[#ca9b6d] hover:bg-[#b8895b] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              + Add Shipping Address
            </button>
          </div>
        )}
      </div>

      {/* 2. Billing Address Section */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">
            Billing Address
          </h3>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSameAsShipping}
              onChange={(e) => {
                const checked = e.target.checked;
                if (onToggleSameAsShipping) {
                  onToggleSameAsShipping(checked);
                } else {
                  setInternalSameAsShipping(checked);
                }
                if (checked && shipping) {
                  onSelectBillingAddress(shipping as AddressItem);
                }
              }}
              className="accent-[#ca9b6d] w-4 h-4 rounded cursor-pointer"
            />
            <span>Same As Shipping</span>
          </label>
        </div>

        {!isSameAsShipping ? (
          billing && (billing.name || billing.addressLineOne || (billing as any).addressLine1) ? (
            <div>
              <div className="border border-gray-200/90 rounded-xl p-5 bg-white relative shadow-2xs">
                {/* Stacked Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(billing, "BILLING")}
                  className="absolute top-4 right-5 text-[#8E7862] hover:text-[#6c5b48] flex flex-col items-center text-xs font-medium cursor-pointer transition-colors"
                  title="Edit Address"
                >
                  <span className="material-symbols-outlined text-[18px] leading-none mb-0.5">edit</span>
                  <span className="text-[11px] leading-none">Edit</span>
                </button>

                {/* Name */}
                <p className="font-semibold text-sm text-gray-900 pr-14">
                  {billing.name || "Default Address"}
                </p>

                {/* Address lines */}
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {[
                    billing.addressLineOne || (billing as any).addressLine1,
                    billing.addressLineTwo || (billing as any).addressLine2,
                    billing.city,
                    billing.state,
                    billing.postalCode,
                    billing.country || countryName || "India",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>

                {/* Contact Details */}
                {billing.primaryPhone && (
                  <p className="text-xs text-gray-700 mt-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-gray-500 leading-none">call</span>
                    <span>{billing.primaryPhone}</span>
                  </p>
                )}

                {billing.contactEmail && (
                  <p className="text-xs text-gray-700 mt-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-gray-500 leading-none">mail</span>
                    <span>{billing.contactEmail}</span>
                  </p>
                )}
              </div>

              {/* Use Another Address Link */}
              <button
                type="button"
                onClick={() => handleOpenList("BILLING")}
                className="text-xs font-semibold text-[#8E7862] hover:text-[#6c5b48] underline mt-3 inline-block cursor-pointer transition-colors"
              >
                Use Another Address
              </button>

              {/* Red Phone Validation Warning Box */}
              {(isBillingPhoneInvalid || (hasValidationErrors && !billing.primaryPhone)) && (
                <div className="bg-[#ffebee] border border-[#f8d7da] text-[#c62828] text-xs font-medium p-3 rounded-lg mt-3.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#c62828]">error</span>
                  <span>Select your country code, then enter your phone number without it.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white">
              <p className="text-sm text-gray-500 mb-3">No billing address selected.</p>
              <button
                type="button"
                onClick={() => handleOpenAdd("BILLING")}
                className="bg-[#ca9b6d] hover:bg-[#b8895b] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                + Add Billing Address
              </button>
            </div>
          )
        ) : (
          <div>
            {billing && (billing.name || billing.addressLineOne || (billing as any).addressLine1) && (
              <div className="border border-gray-200/90 rounded-xl p-5 bg-white relative shadow-2xs">
                <p className="font-semibold text-sm text-gray-900 pr-14">
                  {billing.name || "Default Address"}
                </p>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {[
                    billing.addressLineOne || (billing as any).addressLine1,
                    billing.addressLineTwo || (billing as any).addressLine2,
                    billing.city,
                    billing.state,
                    billing.postalCode,
                    billing.country || countryName || "India",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {billing.primaryPhone && (
                  <p className="text-xs text-gray-700 mt-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-gray-500 leading-none">call</span>
                    <span>{billing.primaryPhone}</span>
                  </p>
                )}
                {billing.contactEmail && (
                  <p className="text-xs text-gray-700 mt-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-gray-500 leading-none">mail</span>
                    <span>{billing.contactEmail}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Red Phone Validation Warning Box if phone invalid */}
        {(isBillingPhoneInvalid || (hasValidationErrors && (!billing || !billing.primaryPhone))) && (
          <div className="bg-[#ffebee] border border-[#f8d7da] text-[#c62828] text-xs font-medium p-3 rounded-lg mt-3.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#c62828]">error</span>
            <span>Select your country code, then enter your phone number without it.</span>
          </div>
        )}
      </div>

      {/* Address Selection Modal from Profile Book */}
      {isAddressListModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Select {modalTarget === "SHIPPING" ? "Shipping" : "Billing"} Address
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressListModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => handleSelectFromList(addr)}
                  className="p-4 rounded-xl border border-gray-200 hover:border-[#ca9b6d] cursor-pointer transition-all bg-white hover:bg-[#fbf7f1]/40"
                >
                  <p className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                    {addr.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {[
                      addr.addressLineOne,
                      addr.addressLineTwo,
                      addr.city,
                      addr.state,
                      addr.postalCode,
                      addr.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Phone: {addr.primaryPhone}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAddressListModalOpen(false);
                  handleOpenAdd(modalTarget);
                }}
                className="bg-[#ca9b6d] hover:bg-[#b8895b] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                + Add New Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal (1:1 with Reference Design) */}
      {isEditModalOpen && (
        <EditAddressModal
          isOpen={isEditModalOpen}
          addressType={modalTarget}
          address={editingAddress}
          title={editingAddress ? "Edit Address" : "Add Address"}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (saved) => {
            await onSaveNewAddress(saved);
            setIsEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
