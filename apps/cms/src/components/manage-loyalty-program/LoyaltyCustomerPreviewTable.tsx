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

const CircularProgress: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 999) : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const displayPercent = Math.min(percent, 100);
  const strokeDashoffset = circumference - (displayPercent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-14 h-14 mx-auto">
      <svg className="w-14 h-14 transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="text-slate-200"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="text-indigo-600 transition-all duration-300"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-slate-700">{percent}%</span>
    </div>
  );
};

export const LoyaltyCustomerPreviewTable: React.FC<LoyaltyCustomerPreviewTableProps> = ({
  filteredUserList,
  onOpenModal,
  emptyMessage = 'No enrolled loyalty customers found.',
}) => {
  const formatCurrency = (val: number, currency: string = 'INR') => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
    return `${symbol}${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Activity (All Time)</th>
              <th className="px-4 py-3 text-left">Activity (Cycle)</th>
              <th className="px-4 py-3 text-center">Progress (Cycle)</th>
              <th className="px-4 py-3 text-left">Utilization</th>
              <th className="px-4 py-3 text-left">Membership</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredUserList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredUserList.map((userPreview, i) => {
                const config = userPreview.membershipConfig || {};
                const currency = config.minimumOrderValueCurrency || 'INR';
                const minVal = config.minimumOrderValue || 0;
                const cycleVal = userPreview.cycleLoyaltyOrderValue || 0;

                const allTimeUtil =
                  userPreview.totalOrderCount === 0
                    ? 0
                    : Math.round((userPreview.totalLoyaltyOrderCount / userPreview.totalOrderCount) * 100);

                const cycleUtil =
                  userPreview.cycleTotalOrderCount === 0
                    ? 0
                    : Math.round((userPreview.cycleLoyaltyOrderCount / userPreview.cycleTotalOrderCount) * 100);

                return (
                  <tr key={userPreview.customerId || i} className="hover:bg-slate-50/80 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-800">{userPreview.userName}</div>
                      <div className="text-xs text-indigo-600 font-medium truncate mt-0.5">
                        {userPreview.email}
                      </div>
                    </td>

                    {/* Inception Orders */}
                    <td className="px-4 py-3 align-top text-xs space-y-1">
                      <div className="text-slate-700 font-medium">
                        Total: <span className="font-semibold">{userPreview.totalOrderCount || 0}</span>
                      </div>
                      <div className="text-slate-500">{formatCurrency(userPreview.totalOrderValue, currency)}</div>
                      <div className="text-slate-700 font-medium pt-1">
                        Loyalty: <span className="font-semibold">{userPreview.totalLoyaltyOrderCount || 0}</span>
                      </div>
                      <div className="text-slate-500">{formatCurrency(userPreview.totalLoyaltyOrderValue, currency)}</div>
                    </td>

                    {/* Cycle Orders */}
                    <td className="px-4 py-3 align-top text-xs space-y-1">
                      <div className="text-slate-700 font-medium">
                        Total: <span className="font-semibold">{userPreview.cycleTotalOrderCount || 0}</span>
                      </div>
                      <div className="text-slate-500">{formatCurrency(userPreview.cycleTotalOrderValue, currency)}</div>
                      <div className="text-slate-700 font-medium pt-1">
                        Loyalty: <span className="font-semibold">{userPreview.cycleLoyaltyOrderCount || 0}</span>
                      </div>
                      <div className="text-slate-500">{formatCurrency(userPreview.cycleLoyaltyOrderValue, currency)}</div>
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3 align-top">
                      <CircularProgress value={cycleVal} max={minVal} />
                      <div className="mt-1 text-[11px] text-slate-600 text-center font-medium">
                        {formatCurrency(cycleVal, currency)} / {formatCurrency(minVal, currency)}
                      </div>
                    </td>

                    {/* Utilization */}
                    <td className="px-4 py-3 align-top text-xs space-y-1">
                      <div>
                        All Time:{' '}
                        <span className="font-bold text-slate-800">{allTimeUtil}%</span>
                      </div>
                      <div className="text-slate-500">
                        Discount: {formatCurrency(userPreview.totalLoyaltyDiscountValue, currency)}
                      </div>
                      <div className="pt-1">
                        Cycle:{' '}
                        <span className="font-bold text-slate-800">{cycleUtil}%</span>
                      </div>
                      <div className="text-slate-500">
                        Discount: {formatCurrency(userPreview.cycleLoyaltyDiscountValue, currency)}
                      </div>
                    </td>

                    {/* Membership */}
                    <td className="px-4 py-3 align-top text-xs space-y-1">
                      <div className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit border border-emerald-200">
                        {config.discountPercentage || 0}% OFF
                      </div>
                      <div className="text-slate-600 font-medium">
                        Min {formatCurrency(minVal, currency)} • {config.tenure || 0} mo
                      </div>
                      {config.createdAt && (
                        <div className="text-slate-400">
                          Enrolled: {dayjs(config.createdAt).format('DD MMM YYYY, hh:mm A')}
                        </div>
                      )}
                      {config.startDate && (
                        <div className="text-slate-400">
                          Start: {dayjs(config.startDate).format('DD MMM YYYY, hh:mm A')}
                        </div>
                      )}
                      {config.endDate && (
                        <div className="text-slate-400">
                          End: {dayjs(config.endDate).format('DD MMM YYYY, hh:mm A')}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 align-middle text-center">
                      <button
                        onClick={() => handleEditClick(userPreview)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Update Wholesale Program Config"
                      >
                        <ChevronRight className="w-5 h-5" />
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
