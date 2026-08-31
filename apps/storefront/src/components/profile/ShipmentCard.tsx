'use client';
import { useState } from 'react';

// Shipment card — ports the live Angular order-shipment-card component.
// Groups a fulfillment into "Shipment N" with Carrier, Estimated Delivery range,
// a "N item(s) included" expander, and a Track Shipment button.

export interface FulfilledItemSummary {
  name: string;
  quantity: number;
  unit: string;
}

function formatDate(epochMs?: number): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ShipmentCard({
  index,
  shippingCode,
  trackingUrl,
  dispatchedOn,
  estimatedDeliveryFrom,
  estimatedDeliveryTo,
  note,
  fulfilledItems,
}: {
  index: number;
  shippingCode?: string;
  trackingUrl?: string;
  dispatchedOn?: number;
  estimatedDeliveryFrom?: number;
  estimatedDeliveryTo?: number;
  note?: string;
  fulfilledItems: FulfilledItemSummary[];
}) {
  const [itemsExpanded, setItemsExpanded] = useState(false);

  return (
    <div className="w-full bg-white rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-black mb-4">Shipment {index + 1}</h2>
            <div className="space-y-3">
              {dispatchedOn ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Dispatched On:</span>
                  <span className="text-sm text-gray-900">{formatDate(dispatchedOn)}</span>
                </div>
              ) : null}

              {shippingCode ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Carrier:</span>
                  <span className="text-sm text-gray-900 font-mono bg-[#F0EEE9] px-2 py-1 rounded-md">{shippingCode}</span>
                </div>
              ) : null}

              {estimatedDeliveryFrom && estimatedDeliveryTo ? (
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <span className="text-sm font-medium text-gray-600">Estimated Delivery:</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(estimatedDeliveryFrom)} – {formatDate(estimatedDeliveryTo)}
                  </span>
                </div>
              ) : null}

              {!estimatedDeliveryFrom && estimatedDeliveryTo ? (
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <span className="text-sm font-medium text-gray-600">Estimated Delivery:</span>
                  <span className="text-sm text-gray-900">{formatDate(estimatedDeliveryTo)}</span>
                </div>
              ) : null}

              {note ? <p className="text-xs text-gray-500 italic">Note: {note}</p> : null}
            </div>
          </div>

          {fulfilledItems.length > 0 && (
            <div className="pt-4 border-t border-[#F0EEE9]">
              <button
                type="button"
                onClick={() => setItemsExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-[#8d7961] hover:text-[#6b5e4a] transition-colors duration-200"
              >
                <span>
                  {fulfilledItems.length} item{fulfilledItems.length > 1 ? 's' : ''} included
                </span>
                <span
                  className={
                    'material-symbols-outlined text-base leading-none transition-transform duration-200 ' +
                    (itemsExpanded ? 'rotate-180' : '')
                  }
                >
                  expand_more
                </span>
              </button>
              {itemsExpanded && (
                <ul className="mt-2.5 space-y-1.5">
                  {fulfilledItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8d7961] flex-shrink-0" />
                      {item.name} — {item.quantity} {item.unit}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Matches live: shows whenever trackingUrl is a non-empty string, no URL-format
            gate — live's real fulfillment data (e.g. test/dev orders) can carry a non-URL
            placeholder value and still renders + links out to it as-is. */}
        {trackingUrl && (
          <a
            className="lg:ml-6 block w-full lg:w-auto bg-[#8D7961] hover:bg-[#6b5e4a] text-white text-sm font-medium px-6 py-2 rounded-md transition-colors duration-200 whitespace-nowrap text-center flex-shrink-0"
            href={trackingUrl}
            target="_blank"
            rel="nofollow"
          >
            Track Shipment
          </a>
        )}
      </div>
    </div>
  );
}
