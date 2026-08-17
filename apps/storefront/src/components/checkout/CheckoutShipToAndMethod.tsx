"use client";

import { useId } from "react";
import { CartItem } from "@/types/domain/cart";
import { ShipmentOption } from "@/types/domain/checkout";
import { calculateShippingCost } from "@/lib/checkout/checkout-calculations";

interface CheckoutShipToAndMethodProps {
  countryName: string;
  onCountryChange: (country: string) => void;
  shipments: ShipmentOption[];
  selectedShipmentId?: number;
  onSelectShipment: (shipment: ShipmentOption) => void;
  currencyCode: string;
  money: (val: number) => string;
  isShippingFree: boolean;
  items?: CartItem[];
  subtotal?: number;
  disabled?: boolean;
}

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Canada",
  "Netherlands",
  "Italy",
  "Spain",
  "Japan",
  "Singapore",
  "United Arab Emirates",
  "Switzerland",
  "Sweden",
  "New Zealand",
];

export function CheckoutShipToAndMethod({
  countryName,
  onCountryChange,
  shipments,
  selectedShipmentId,
  onSelectShipment,
  currencyCode,
  money,
  isShippingFree,
  items = [],
  subtotal = 0,
  disabled = false,
}: CheckoutShipToAndMethodProps) {
  const selectId = useId();

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 sm:p-7 mb-6">
      {/* Ship to Selector Row */}
      <div className="flex items-center gap-4">
        <label
          htmlFor={selectId}
          className="text-sm font-semibold text-gray-900 shrink-0"
        >
          Ship to
        </label>
        <div className="relative">
          <select
            id={selectId}
            value={countryName}
            disabled={disabled}
            onChange={(e) => onCountryChange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-9 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#ca9b6d] focus:border-[#ca9b6d] cursor-pointer shadow-xs disabled:opacity-50"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-lg">
            expand_more
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2 mb-5">
        Estimated — your delivery address determines the final rate.
      </p>

      {/* Delivery Method Radio Options */}
      <div className="border-t border-gray-100 pt-5">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3.5">
          Delivery method
        </h4>

        <div className="flex flex-col gap-3">
          {shipments.map((shipment) => {
            const isSelected = selectedShipmentId === shipment.id;
            const tierCost = items && items.length > 0
              ? calculateShippingCost(shipment, items, subtotal, countryName, isShippingFree).shippingCost
              : shipment.baseAmount;

            return (
              <label
                key={shipment.id}
                onClick={() => onSelectShipment(shipment)}
                className={`flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#fbf7f1] border-[#ca9b6d] ring-1 ring-[#ca9b6d]"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="checkoutShipment"
                    checked={isSelected}
                    onChange={() => onSelectShipment(shipment)}
                    className="accent-[#ca9b6d] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900">
                      {shipment.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {shipment.estimatedFromDay} to {shipment.estimatedToDay} days
                    </span>
                  </div>
                </div>

                <div className="text-right font-bold text-sm text-gray-900">
                  {isShippingFree ? (
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      FREE
                    </span>
                  ) : (
                    <span>
                      {currencyCode} {money(tierCost)}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
