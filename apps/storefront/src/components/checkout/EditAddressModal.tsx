"use client";

import React, { useState, useEffect } from "react";
import { AddressItem } from "@/types/domain/profile";

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Partial<AddressItem>) => Promise<void> | void;
  address?: Partial<AddressItem> | null;
  addressType?: "SHIPPING" | "BILLING";
  title?: string;
}

const COUNTRY_DIAL_CODES: { code: string; name: string; dial: string; flag: string }[] = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
];

export function EditAddressModal({
  isOpen,
  onClose,
  onSave,
  address,
  addressType = "SHIPPING",
  title = "Edit Address",
}: EditAddressModalProps) {
  const [formData, setFormData] = useState({
    id: address?.id,
    name: "",
    companyName: "",
    addressLineOne: "",
    addressLineTwo: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phoneDialCode: "+91",
    phoneNumber: "",
    secondaryPhone: "",
    contactEmail: "",
    vatgstNumber: "",
    eoriNumber: "",
    primaryBillingAddress: address?.primaryBillingAddress ?? false,
    primaryShippingAddress: address?.primaryShippingAddress ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fullPhone = address?.primaryPhone || "";
      let dial = "+91";
      let number = fullPhone;

      // Extract dial code if phone starts with +
      if (fullPhone.startsWith("+")) {
        const matchingCode = COUNTRY_DIAL_CODES.find((c) => fullPhone.startsWith(c.dial));
        if (matchingCode) {
          dial = matchingCode.dial;
          number = fullPhone.slice(matchingCode.dial.length).trim();
        }
      }

      const country = address?.country || "India";
      const countryMatch = COUNTRY_DIAL_CODES.find(
        (c) => c.name.toLowerCase() === country.toLowerCase()
      );
      if (countryMatch && !fullPhone.startsWith("+")) {
        dial = countryMatch.dial;
      }

      setFormData({
        id: address?.id,
        name: address?.name || "",
        companyName: address?.companyName || "",
        addressLineOne: address?.addressLineOne || "",
        addressLineTwo: address?.addressLineTwo || "",
        city: address?.city || "",
        state: address?.state || "",
        postalCode: address?.postalCode || "",
        country,
        phoneDialCode: dial,
        phoneNumber: number,
        secondaryPhone: address?.secondaryPhone || "",
        contactEmail: address?.contactEmail || "",
        vatgstNumber: address?.vatgstNumber || "",
        eoriNumber: address?.eoriNumber || "",
        primaryBillingAddress: address?.primaryBillingAddress ?? false,
        primaryShippingAddress: address?.primaryShippingAddress ?? false,
      });
      setErrors({});
    }
  }, [isOpen, address]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.addressLineOne.trim()) {
      newErrors.addressLineOne = "Address line 1 is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postcode is required";
    } else if (formData.country === "India" && !/^\d{6}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = "Enter a valid 6-digit PIN code";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    const cleanPhone = formData.phoneNumber.replace(/\D/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
      newErrors.contactEmail = "Enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const fullPhone = formData.phoneNumber.startsWith("+")
        ? formData.phoneNumber
        : `${formData.phoneDialCode}${formData.phoneNumber.replace(/^0+/, "")}`;

      const savedAddress: Partial<AddressItem> = {
        id: formData.id,
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || undefined,
        addressLineOne: formData.addressLineOne.trim(),
        addressLineTwo: formData.addressLineTwo.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        primaryPhone: fullPhone,
        secondaryPhone: formData.secondaryPhone.trim() || undefined,
        contactEmail: formData.contactEmail.trim(),
        vatgstNumber: formData.vatgstNumber.trim() || undefined,
        eoriNumber: formData.eoriNumber.trim() || undefined,
        addressType: addressType,
        primaryBillingAddress: formData.primaryBillingAddress,
        primaryShippingAddress: formData.primaryShippingAddress,
      };

      await onSave(savedAddress);
      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        form: err.message || "Failed to save address. Please check all fields.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCountryChange = (countryName: string) => {
    const match = COUNTRY_DIAL_CODES.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    setFormData((prev) => ({
      ...prev,
      country: countryName,
      phoneDialCode: match ? match.dial : prev.phoneDialCode,
    }));
    if (errors.country) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.country;
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500 mt-1">
              Fields marked <span className="text-red-500 font-bold">*</span> are required.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {errors.form && (
          <div className="mx-6 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {errors.form}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder=""
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                errors.name
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300 focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D]"
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder=""
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D] transition-colors"
            />
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Address line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.addressLineOne}
              onChange={(e) => {
                setFormData({ ...formData, addressLineOne: e.target.value });
                if (errors.addressLineOne) setErrors({ ...errors, addressLineOne: "" });
              }}
              placeholder=""
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                errors.addressLineOne
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300 focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D]"
              }`}
            />
            {errors.addressLineOne && (
              <p className="text-xs text-red-600 mt-1">{errors.addressLineOne}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Address line 2
            </label>
            <input
              type="text"
              value={formData.addressLineTwo}
              onChange={(e) => setFormData({ ...formData, addressLineTwo: e.target.value })}
              placeholder=""
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D] transition-colors"
            />
          </div>

          {/* City & State (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                  if (errors.city) setErrors({ ...errors, city: "" });
                }}
                placeholder=""
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                  errors.city
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300 focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D]"
                }`}
              />
              {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => {
                  setFormData({ ...formData, state: e.target.value });
                  if (errors.state) setErrors({ ...errors, state: "" });
                }}
                placeholder=""
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                  errors.state
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300 focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D]"
                }`}
              />
              {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state}</p>}
            </div>
          </div>

          {/* Postcode & Country (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => {
                  setFormData({ ...formData, postalCode: e.target.value });
                  if (errors.postalCode) setErrors({ ...errors, postalCode: "" });
                }}
                placeholder=""
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                  errors.postalCode
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300 focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D]"
                }`}
              />
              {errors.postalCode && (
                <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white appearance-none focus:outline-none transition-colors cursor-pointer ${
                    errors.country
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300 focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D]"
                  }`}
                >
                  {COUNTRY_DIAL_CODES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
              </div>
              {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
            </div>
          </div>

          {/* Phone & Alternate phone (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <div
                className={`flex items-center border rounded-lg bg-white overflow-hidden transition-colors ${
                  errors.phone
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-gray-300 focus-within:border-[#C79D6D] focus-within:ring-1 focus-within:ring-[#C79D6D]"
                }`}
              >
                <div className="relative flex items-center bg-gray-50 border-r border-gray-200 px-2.5 py-2.5">
                  <select
                    value={formData.phoneDialCode}
                    onChange={(e) => setFormData({ ...formData, phoneDialCode: e.target.value })}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                  >
                    {COUNTRY_DIAL_CODES.map((c) => (
                      <option key={c.code} value={c.dial}>
                        {c.flag} {c.dial} ({c.name})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-medium text-gray-700 flex items-center gap-1 pointer-events-none">
                    <span>
                      {COUNTRY_DIAL_CODES.find((c) => c.dial === formData.phoneDialCode)?.flag || "🇮🇳"}
                    </span>
                    <span>{formData.phoneDialCode}</span>
                    <span className="material-symbols-outlined text-sm text-gray-400">expand_more</span>
                  </span>
                </div>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, phoneNumber: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: "" });
                  }}
                  placeholder=""
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alternate phone
              </label>
              <input
                type="tel"
                value={formData.secondaryPhone}
                onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                placeholder=""
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D] transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => {
                setFormData({ ...formData, contactEmail: e.target.value });
                if (errors.contactEmail) setErrors({ ...errors, contactEmail: "" });
              }}
              placeholder=""
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                errors.contactEmail
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-gray-300 focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D]"
              }`}
            />
            {errors.contactEmail && (
              <p className="text-xs text-red-600 mt-1">{errors.contactEmail}</p>
            )}
          </div>

          {/* VAT/GST & EORI (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                VAT / GST number
              </label>
              <input
                type="text"
                value={formData.vatgstNumber}
                onChange={(e) => setFormData({ ...formData, vatgstNumber: e.target.value })}
                placeholder=""
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                EORI number
              </label>
              <input
                type="text"
                value={formData.eoriNumber}
                onChange={(e) => setFormData({ ...formData, eoriNumber: e.target.value })}
                placeholder=""
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#C79D6D] focus:ring-1 focus:ring-[#C79D6D] transition-colors"
              />
            </div>
          </div>

          <p className="text-[11px] text-gray-500 -mt-1">
            An EORI number is needed for customs clearance on some international orders.
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#C79D6D] hover:bg-[#b88c5d] disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                "Save Address"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
