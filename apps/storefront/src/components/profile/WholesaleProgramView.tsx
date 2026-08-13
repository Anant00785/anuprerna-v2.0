'use client';

import React from 'react';
import { WholesaleMembershipInfo, WholesaleOrderInfo, OrderListItem } from '@/types/domain/profile';
import { OrderListCard } from './OrderListCard';

interface WholesaleProgramViewProps {
  membershipInfo: WholesaleMembershipInfo;
  orderInfo: WholesaleOrderInfo;
  orders: OrderListItem[];
  tenantName?: string;
}

export const WholesaleProgramView: React.FC<WholesaleProgramViewProps> = ({
  membershipInfo,
  orderInfo,
  orders,
  tenantName = '',
}) => {
  const formatDate = (epochMS: number) => {
    return new Date(epochMS).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateMonths = () => {
    const start = new Date(membershipInfo.programEnrollmentDateEpochMS);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(months, 1);
  };

  const wholesaleOrders = orders.filter((o) => o.loyaltyOrder);

  return (
    <div className="w-full space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Wholesale Program</h3>

      {/* Welcome Banner Card */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl lg:p-8 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
              Welcome back, {tenantName.split(' ')[0]}
            </h1>
            <div className="flex items-center gap-2 pt-1">
              <span
                className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                  membershipInfo.active ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm mr-1.5 text-amber-700">crown</span>
                {membershipInfo.active ? 'Active' : 'Expired'} Wholesale Program Member
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details & Savings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trade Program Details */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center justify-center w-9 h-9 text-white rounded-lg bg-[#8E7862]">
              <span className="material-symbols-outlined text-xl">workspace_premium</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Trade Program Details</h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Program Enrollment Date</span>
              <span className="font-medium text-gray-900">{formatDate(membershipInfo.programEnrollmentDateEpochMS)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Current Cycle Start Date</span>
              <span className="font-medium text-gray-900">{formatDate(membershipInfo.currentCycleStartDateEpochMS)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Current Cycle End Date</span>
              <span className="font-medium text-gray-900">{formatDate(membershipInfo.currentCycleEndDateEpochMS)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Discount Percentage</span>
              <span className="text-xl font-bold text-[#8E7862]">{membershipInfo.percentileDiscount}%</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Minimum Order Value</span>
              <span className="font-bold text-gray-900 text-base">
                {membershipInfo.minimumOrderValueCurrency} {membershipInfo.minimumOrderValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Congratulations & Total Savings Card */}
        <div className="p-6 border border-amber-900/10 shadow-sm bg-gradient-to-br from-[#FFFCF7] to-[#F5EFE6] rounded-2xl space-y-5">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center w-14 h-14 mx-auto bg-white rounded-full shadow-xs text-amber-700">
              <span className="material-symbols-outlined text-3xl">emoji_events</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Congratulations!</h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
              You are now part of our exclusive wholesale trade program and receive all amazing benefits including priority loom allocations, bulk discounts, and dedicated partner support.
            </p>
          </div>

          <div className="p-4 text-center bg-white rounded-xl shadow-2xs space-y-1">
            <div className="text-xs font-medium text-gray-500">Total Savings to Date</div>
            <div className="text-2xl font-bold text-emerald-700">
              {membershipInfo.minimumOrderValueCurrency} {orderInfo.totalAbsoluteDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-gray-400">Since program start</div>
          </div>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="p-4 text-center bg-white border border-gray-100 shadow-sm rounded-xl space-y-1">
          <div className="text-2xl font-bold text-[#8E7862]">{calculateMonths()}</div>
          <div className="text-xs text-gray-600 font-medium">Months as Member</div>
        </div>

        <div className="p-4 text-center bg-white border border-gray-100 shadow-sm rounded-xl space-y-1">
          <div className="text-2xl font-bold text-gray-900">{orderInfo.totalOrderCount}</div>
          <div className="text-xs text-gray-600 font-medium">Total Orders</div>
        </div>

        <div className="p-4 text-center bg-white border border-gray-100 shadow-sm rounded-xl space-y-1">
          <div className="text-lg font-bold text-[#8E7862]">
            {membershipInfo.minimumOrderValueCurrency} {orderInfo.averageOrderValue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-600 font-medium">Avg Order Value</div>
        </div>

        <div className="p-4 text-center bg-white border border-gray-100 shadow-sm rounded-xl space-y-1">
          <div className="text-2xl font-bold text-emerald-700">{orderInfo.percentileUtilization}%</div>
          <div className="text-xs text-gray-600 font-medium">Program Utilization</div>
        </div>
      </div>

      {/* Wholesale Orders History */}
      <div className="space-y-4 pt-4">
        <h4 className="text-lg font-bold text-gray-900">Wholesale Program Orders</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {wholesaleOrders.map((item) => (
            <OrderListCard key={item.orderId} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};
