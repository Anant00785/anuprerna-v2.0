"use client";

import { CartItem } from "@/types/domain/cart";
import { ShipmentOption } from "@/types/domain/checkout";
import { calculateShippingCost } from "@/lib/checkout/checkout-calculations";

interface CheckoutShipmentTierProps {
  shipments: ShipmentOption[];
  selectedShipmentId?: number;
  onSelectShipment: (shipment: ShipmentOption) => void;
  currencyCode: string;
  money: (amount: number) => string;
  isShippingFree: boolean;
  items?: CartItem[];
  subtotal?: number;
  countryName?: string;
  title?: string;
}

export function CheckoutShipmentTier({
  shipments,
  selectedShipmentId,
  onSelectShipment,
  currencyCode,
  money,
  isShippingFree,
  items = [],
  subtotal = 0,
  countryName = "India",
  title = "How would you like it delivered?",
}: CheckoutShipmentTierProps) {
  if (!shipments || shipments.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 sm:p-7 mb-6">
      <h3 className="text-base font-bold text-gray-900 mb-4">
        {title}
      </h3>
      <div className="flex flex-col gap-3">
        {shipments.map((shipment) => {
          const isSelected = selectedShipmentId === shipment.id;
          const tierCost = calculateShippingCost(
            shipment,
            items,
            subtotal,
            countryName
          ).shippingCost;

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
                  name="deliveryModeTier"
                  checked={isSelected}
                  onChange={() => onSelectShipment(shipment)}
                  className="accent-[#ca9b6d] w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
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
  );
}
