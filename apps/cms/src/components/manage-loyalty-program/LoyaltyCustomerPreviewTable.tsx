'use client';

import React from 'react';
import {
  ILoyaltyProgramCustomerMetrics,
  ILoyaltyProgramConfigPayload,
  LoyaltyConfigAuditLogTypeEnum,
} from '@/services/loyalty-service';
import { ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

interface LoyaltyCustomerPreviewTableProps {
  filteredUserList: ILoyaltyProgramCustomerMetrics[];
  onOpenModal: (payload: ILoyaltyProgramConfigPayload) => void;
  emptyMessage?: string;
}

export const LoyaltyCustomerPreviewTable: React.FC<LoyaltyCustomerPreviewTableProps> = ({
  filteredUserList,
  onOpenModal,
  emptyMessage = 'No enrolled loyalty customers found.',
}) => {
  const formatCurrency = (val: number, currency: string = 'INR') => {
    const curr = (currency || 'INR').toUpperCase();
    const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '₹';
    return `${symbol}${(val || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const handleEditClick = (metric: ILoyaltyProgramCustomerMetrics) => {
    const config = metric.membershipConfig || {};
    const payload: ILoyaltyProgramConfigPayload = {
      id: config.id || 0,
      customerId: metric.customerId,
      tenure: config.tenure || 1,
      discountPercentage: config.discountPercentage || 0,
      minimumOrderValue: config.minimumOrderValue || 0,
      minimumOrderValueCurrency: config.minimumOrderValueCurrency || 'INR',
      minimumOrderValueINR: config.minimumOrderValueINR || config.minimumOrderValue || 0,
      exchangeRate: config.exchangeRate || 1,
      type: config.id ? LoyaltyConfigAuditLogTypeEnum.RENEWAL_MANUAL : LoyaltyConfigAuditLogTypeEnum.ONBOARDING,
    };
    onOpenModal(payload);
  };

  return (
    <div className="w-full mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-xs bg-white">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase bg-slate-50/50">
              <th className="px-5 py-3.5 whitespace-nowrap">USER</th>
              <th className="px-5 py-3.5 whitespace-nowrap">ACTIVITY (ALL TIME)</th>
              <th className="px-5 py-3.5 whitespace-nowrap">ACTIVITY (CYCLE)</th>
              <th className="px-5 py-3.5 text-center whitespace-nowrap">PROGRESS (CYCLE)</th>
              <th className="px-5 py-3.5 whitespace-nowrap">UTILIZATION</th>
              <th className="px-5 py-3.5 whitespace-nowrap">MEMBERSHIP</th>
              <th className="px-5 py-3.5 text-center whitespace-nowrap">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {filteredUserList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredUserList.map((userPreview, i) => {
                const config = userPreview.membershipConfig || ({} as any);
                const currency = config.minimumOrderValueCurrency || (userPreview as any).defaultCurrency || 'USD';
                const minVal = Number(config.minimumOrderValue) || 0;
                const cycleVal = Number(userPreview.cycleLoyaltyOrderValue) || 0;

                const totalOrders = Number(userPreview.totalOrderCount) || 0;
                const totalLoyaltyOrders = Number(userPreview.totalLoyaltyOrderCount) || 0;
                const cycleOrders = Number(userPreview.cycleTotalOrderCount) || 0;
                const cycleLoyaltyOrders = Number(userPreview.cycleLoyaltyOrderCount) || 0;

                const percent = minVal > 0 ? Math.min(Math.round((cycleVal / minVal) * 100), 100) : 0;

                const allTimeUtil =
                  totalOrders > 0
                    ? Math.min(Math.round((totalLoyaltyOrders / totalOrders) * 100), 100)
                    : 0;

                const cycleUtil =
                  cycleOrders > 0
                    ? Math.min(Math.round((cycleLoyaltyOrders / cycleOrders) * 100), 100)
                    : 0;

                const displayName =
                  userPreview.userName ||
                  (userPreview as any).name ||
                  (userPreview as any).customerName ||
                  'Customer';

                const displayEmail =
                  userPreview.email ||
                  (userPreview as any).customerEmail ||
                  '—';

                return (
                  <tr key={userPreview.customerId || i} className="hover:bg-slate-50/80 transition-colors">
                    {/* User */}
                    <td className="px-5 py-4 align-top">
                      <div className="font-semibold text-slate-800">{displayName}</div>
                      <div className="text-[11px] text-[#2563eb] hover:underline truncate mt-0.5">
                        {displayEmail}
                      </div>
                    </td>

                    {/* Activity (All Time) */}
                    <td className="px-5 py-4 align-top text-xs space-y-0.5">
                      <div className="text-slate-800 font-medium">
                        Total: {totalOrders}
                      </div>
                      <div className="text-slate-600 font-normal">
                        {formatCurrency(userPreview.totalOrderValue, currency)}
                      </div>
                      <div className="text-slate-800 font-medium pt-1">
                        Loyalty: {totalLoyaltyOrders}
                      </div>
                      <div className="text-slate-600 font-normal">
                        {formatCurrency(userPreview.totalLoyaltyOrderValue, currency)}
                      </div>
                    </td>

                    {/* Activity (Cycle) */}
                    <td className="px-5 py-4 align-top text-xs space-y-0.5">
                      <div className="text-slate-800 font-medium">
                        Total: {cycleOrders}
                      </div>
                      <div className="text-slate-600 font-normal">
                        {formatCurrency(userPreview.cycleTotalOrderValue, currency)}
                      </div>
                      <div className="text-slate-800 font-medium pt-1">
                        Loyalty: {cycleLoyaltyOrders}
                      </div>
                      <div className="text-slate-600 font-normal">
                        {formatCurrency(userPreview.cycleLoyaltyOrderValue, currency)}
                      </div>
                    </td>

                    {/* Progress (Cycle) */}
                    <td className="px-5 py-4 align-top text-center">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        {percent > 0 ? (
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-xs mb-0.5" />
                        ) : (
                          <span className="text-slate-400 font-semibold text-xs leading-none">-</span>
                        )}
                        <span className="text-xs font-semibold text-slate-800 leading-none">
                          {percent}%
                        </span>
                        <span className="text-[11px] text-slate-600 whitespace-nowrap pt-1">
                          {formatCurrency(cycleVal, currency)} / {formatCurrency(minVal, currency)}
                        </span>
                      </div>
                    </td>

                    {/* Utilization */}
                    <td className="px-5 py-4 align-top text-xs space-y-0.5">
                      <div className="text-slate-800 font-medium">
                        All Time: {allTimeUtil}%
                      </div>
                      <div className="text-slate-600 font-normal">
                        Discount: {formatCurrency(userPreview.totalLoyaltyDiscountValue, currency)}
                      </div>
                      <div className="text-slate-800 font-medium pt-1">
                        Cycle: {cycleUtil}%
                      </div>
                      <div className="text-slate-600 font-normal">
                        Discount: {formatCurrency(userPreview.cycleLoyaltyDiscountValue, currency)}
                      </div>
                    </td>

                    {/* Membership */}
                    <td className="px-5 py-4 align-top text-xs space-y-0.5">
                      <div className="font-semibold text-slate-900">
                        {config.discountPercentage || 0}% off
                      </div>
                      <div className="text-slate-600 font-normal">
                        Min {formatCurrency(minVal, currency)} • {config.tenure || 0} mo
                      </div>
                      {config.createdAt && (
                        <div className="text-slate-500 text-[11px] pt-0.5">
                          Enrolled: {dayjs(config.createdAt).format('DD MMM YYYY, hh:mm A')}
                        </div>
                      )}
                      {config.startDate && (
                        <div className="text-slate-500 text-[11px]">
                          Start: {dayjs(config.startDate).format('DD MMM YYYY, hh:mm A')}
                        </div>
                      )}
                      {config.endDate && (
                        <div className="text-slate-500 text-[11px]">
                          End: {dayjs(config.endDate).format('DD MMM YYYY, hh:mm A')}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => handleEditClick(userPreview)}
                        className="p-1 text-slate-400 hover:text-[#585c82] hover:bg-slate-100 rounded transition"
                        title="Update Wholesale Program Config"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
