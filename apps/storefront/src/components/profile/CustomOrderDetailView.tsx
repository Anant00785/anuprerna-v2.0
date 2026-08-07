'use client';

import React from 'react';
import { OrderDetails } from '@/types/domain/profile';

interface CustomOrderDetailViewProps {
  order: OrderDetails;
}

export const CustomOrderDetailView: React.FC<CustomOrderDetailViewProps> = ({ order }) => {
  const formatDate = (dateStr?: string | number) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const displayTotal = order.adjustedTotal || order.total;

  return (
    <div className="w-full space-y-6">
      {/* Custom Order Header */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-700">autorenew</span>
          Custom Order Details
        </h3>
      </div>

      {/* Summary Card */}
      <div className="bg-[#FFFCF7] border border-amber-900/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
          <span>
            Ordered on <strong className="text-gray-900">{formatDate(order.createdAt)}</strong>
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>
            Order <strong className="text-gray-900">#{order.orderId}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">TOTAL:</span>
          <span className="text-lg font-bold text-gray-900">
            {order.currency} {displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Wholesale Program Banner */}
      {order.loyaltyOrder && (
        <div className="p-4 rounded-xl border-l-4 border-l-[#3a9173] bg-[#E8F0ED] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#3a9173] text-2xl font-bold">crown</span>
          <div>
            <p className="font-bold text-[#3a9173] text-base">Wholesale Program Custom Order</p>
            {order.loyaltyDiscountAmount && (
              <p className="text-[#3a9173] text-xs sm:text-sm mt-0.5">
                You saved{' '}
                <strong className="font-bold">
                  {order.currency} {order.loyaltyDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>{' '}
                with wholesale partner discount.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Grid: Left Essentials & Adjustments / Right Custom Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h5 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Order Essentials</h5>

            <div className="flex justify-between items-center text-xs text-gray-700">
              <span>Shipping Mode:</span>
              <span className="font-semibold text-gray-900">{order.shippingMode.name}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-700">
              <span>Sub Total:</span>
              <span className="font-medium">
                {order.currency} {order.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Particular Adjustments */}
            {order.adjustments && order.adjustments.length > 0 && (
              <div className="pt-2 border-t border-dashed border-gray-200 space-y-1.5 text-xs">
                <p className="font-semibold text-gray-800 mb-1">Adjustments & Custom Fees:</p>
                {order.adjustments.map((adj, idx) => (
                  <div key={idx} className="flex justify-between items-center text-gray-600">
                    <span className="truncate pr-2">{adj.particular}</span>
                    <span className={`font-semibold whitespace-nowrap ${adj.adjustmentType === 1 ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {adj.adjustmentType === 1 ? '+' : '-'} {adj.currency} {adj.adjustmentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center text-gray-900 font-bold text-sm pt-3 border-t border-gray-200">
              <span>Adjusted Total:</span>
              <span>
                {order.currency} {displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Order Items List */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-[#FFFAF6] rounded-xl p-4 border border-amber-900/10 space-y-4">
            <h5 className="font-bold text-gray-900 text-base border-b border-amber-900/10 pb-2">Custom Manufactured Items</h5>

            <div className="space-y-3">
              {order.items.map((product) => (
                <div key={product.id} className="bg-white rounded-xl p-4 shadow-xs border border-gray-100 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img src={product.heroImage} alt={product.productName} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <h6 className="font-bold text-gray-900 text-sm">{product.productName}</h6>
                      <p className="text-xs text-gray-500">
                        Custom Quantity: <span className="font-semibold text-gray-800">{product.quantity} {product.unit}</span>
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        {order.currency} {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / {product.unit}
                      </p>
                    </div>
                  </div>

                  {/* Process Status Step Bar */}
                  <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-100 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-700 text-base">precision_manufacturing</span>
                      <span className="font-medium text-amber-900">Production Status: In Loom Weaving & Dyeing</span>
                    </div>
                    <span className="font-bold text-amber-800">Phase 2 / 4</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
