'use client';

import React from 'react';
import Link from 'next/link';
import { OrderListItem } from '@/types/domain/profile';

interface OrderListCardProps {
  item: OrderListItem;
  onCancelOrder?: (orderId: number | string) => void;
}

export const OrderListCard: React.FC<OrderListCardProps> = ({ item, onCancelOrder }) => {
  const msIn24Hours = 24 * 60 * 60 * 1000;
  const createdTime = typeof item.createdAt === 'number' ? item.createdAt : new Date(item.createdAt).getTime();
  const isCancelDisabled = Date.now() - createdTime > msIn24Hours;

  const formatDate = (dateVal: number | string) => {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPercentage = (count?: number, total?: number) => {
    if (!count || !total) return '0';
    return Math.round((count / total) * 100);
  };

  const urlPrefix = item.orderType === 'CUSTOM_ORDER' ? '/profile/custom-order' : '/profile/order';

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden text-xs sm:text-sm transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="flex justify-between items-center w-full bg-[#fffcf7]/80 shadow-xs px-4 py-2.5 border-b border-gray-100">
        <div className="font-semibold flex flex-wrap items-center gap-1.5 text-gray-900">
          {item.orderType === 'CUSTOM_ORDER' && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              <span className="material-symbols-outlined text-sm">autorenew</span>
              Custom Order
            </span>
          )}

          {item.orderType === 'ORDER' && item.loyaltyOrder && (
            <span className="inline-flex items-center gap-1 text-xs bg-[#E8F0ED] text-[#3a9173] px-2 py-0.5 rounded font-medium">
              <span className="material-symbols-outlined text-xs">crown</span>
              Wholesale Program Order
            </span>
          )}

          {item.orderType === 'ORDER' && (
            <span className="text-gray-700">
              <span className="text-xs text-gray-500 font-normal">Order</span> #{item.orderId}
            </span>
          )}
        </div>

        <div className="font-medium text-xs">
          {item.status === 'CANCELLED' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Cancelled</span>}
          {item.status === 'INITIATED' && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">Initiated</span>}
          {item.status === 'PROCESSING' && <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">Processing</span>}
          {item.status === 'DISPATCHED' && (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              Dispatched {item.dispatchedOn ? `On ${formatDate(item.dispatchedOn)}` : ''}
            </span>
          )}
          {item.status === 'DELIVERED' && <span className="text-emerald-800 bg-emerald-100 px-2 py-1 rounded">Delivered</span>}
          {item.status === 'PARTIALLY_DISPATCHED' && (
            <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded">Partially Dispatched</span>
          )}
        </div>
      </div>

      {/* Main Info Body */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 gap-3 border-b border-gray-50">
        <Link href={`${urlPrefix}/${item.orderId}`} className="flex items-center gap-3 group">
          <div className="w-16 h-16 bg-amber-50/50 rounded-lg flex items-center justify-center border border-amber-100/60 p-2 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-amber-800 text-3xl">package_2</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-[#6c5b48] transition-colors">
              {item.totalItemCount} Item{item.totalItemCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed On: <span className="font-medium text-gray-700">{formatDate(item.createdAt)}</span>
            </p>
            <p className="text-xs text-[#8d7961] font-medium mt-0.5">
              Est. Delivery: {formatDate(item.estimatedDeliveryDate)}
            </p>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
          {item.trackingUrl && (
            <a
              href={item.trackingUrl}
              target="_blank"
              rel="nofollow noreferrer"
              className="rounded-md bg-[#B7A990]/90 hover:bg-[#B7A990] text-white px-3 py-1.5 text-xs transition-colors shadow-xs"
            >
              Track Order
            </a>
          )}

          <Link
            href={`${urlPrefix}/${item.orderId}`}
            className="rounded-md bg-[#fffcf7] border border-[#B7A990] text-gray-800 hover:bg-[#B7A990]/10 px-3 py-1.5 text-xs transition-colors font-medium"
          >
            View Order
          </Link>

          {item.orderType === 'ORDER' && !item.dispatchedOn && item.status !== 'CANCELLED' && (
            <button
              disabled={isCancelDisabled}
              onClick={() => onCancelOrder && onCancelOrder(item.orderId)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                isCancelDisabled
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-red-600 border-red-200 hover:bg-red-50 shadow-xs'
              }`}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancellation note if past 24 hours */}
      {item.orderType === 'ORDER' && !item.dispatchedOn && isCancelDisabled && item.status !== 'CANCELLED' && (
        <div className="text-[11px] text-red-500 px-4 py-1 bg-red-50/50 border-b border-red-100">
          Cancellation is disabled after 24 hours of order placement
        </div>
      )}

      {/* Progress Bar steps */}
      {item.status !== 'CANCELLED' ? (
        <Link href={`${urlPrefix}/${item.orderId}`} className="block p-3">
          <div className="bg-gray-50/80 rounded-lg p-2.5 grid grid-cols-4 gap-2 border border-gray-100 text-center">
            {/* Step 1: Confirmed */}
            <div className="bg-white rounded-md p-2 flex flex-col justify-center items-center shadow-xs">
              <span className="material-symbols-outlined text-[#52a183] text-lg">check_circle</span>
              <p className="text-[#52a183] text-[11px] sm:text-xs font-medium mt-1">Confirmed</p>
            </div>

            {/* Step 2: Processing */}
            <div className="bg-white rounded-md p-2 flex flex-col justify-center items-center shadow-xs">
              {item.processingItemCount && item.processingItemCount === item.totalItemCount ? (
                <span className="material-symbols-outlined text-[#52a183] text-lg">check_circle</span>
              ) : item.processingItemCount ? (
                <span className="text-[#BB955E] font-semibold text-xs">
                  {getPercentage(item.processingItemCount, item.totalItemCount)}%
                </span>
              ) : (
                <span className="material-symbols-outlined text-gray-300 text-lg">hourglass_empty</span>
              )}
              <p
                className={`text-[11px] sm:text-xs font-medium mt-1 ${
                  item.processingItemCount === item.totalItemCount
                    ? 'text-[#52a183]'
                    : item.processingItemCount
                    ? 'text-[#BB955E]'
                    : 'text-gray-400'
                }`}
              >
                Processing
              </p>
            </div>

            {/* Step 3: Ready */}
            <div className="bg-white rounded-md p-2 flex flex-col justify-center items-center shadow-xs">
              {item.readyItemCount && item.readyItemCount === item.totalItemCount ? (
                <span className="material-symbols-outlined text-[#52a183] text-lg">check_circle</span>
              ) : item.readyItemCount ? (
                <span className="text-[#5950B7] font-semibold text-xs">
                  {getPercentage(item.readyItemCount, item.totalItemCount)}%
                </span>
              ) : (
                <span className="material-symbols-outlined text-gray-300 text-lg">hourglass_empty</span>
              )}
              <p
                className={`text-[11px] sm:text-xs font-medium mt-1 ${
                  item.readyItemCount === item.totalItemCount
                    ? 'text-[#52a183]'
                    : item.readyItemCount
                    ? 'text-[#5950B7]'
                    : 'text-gray-400'
                }`}
              >
                Ready
              </p>
            </div>

            {/* Step 4: Dispatched */}
            <div className="bg-white rounded-md p-2 flex flex-col justify-center items-center shadow-xs">
              {item.dispatchedItemCount && item.dispatchedItemCount === item.totalItemCount ? (
                <span className="material-symbols-outlined text-[#52a183] text-lg">check_circle</span>
              ) : item.dispatchedItemCount ? (
                <span className="text-amber-700 font-semibold text-xs">
                  {getPercentage(item.dispatchedItemCount, item.totalItemCount)}%
                </span>
              ) : (
                <span className="material-symbols-outlined text-gray-300 text-lg">local_shipping</span>
              )}
              <p
                className={`text-[11px] sm:text-xs font-medium mt-1 ${
                  item.dispatchedItemCount === item.totalItemCount
                    ? 'text-[#52a183]'
                    : item.dispatchedItemCount
                    ? 'text-amber-700'
                    : 'text-gray-400'
                }`}
              >
                Dispatched
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <div className="p-3 text-center text-xs text-gray-400">No active updates available for cancelled order</div>
      )}
    </div>
  );
};
