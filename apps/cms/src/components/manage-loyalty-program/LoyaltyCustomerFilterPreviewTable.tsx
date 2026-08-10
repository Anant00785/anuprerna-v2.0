'use client';

import React from 'react';
import {
  ILoyaltyProgramEligibleCustomer,
  ILoyaltyProgramEligibleCustomerFilter,
  ILoyaltyProgramConfigPayload,
  LoyaltyConfigAuditLogTypeEnum,
} from '@/services/loyalty-service';
import { ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

interface LoyaltyCustomerFilterPreviewTableProps {
  filteredUserList: ILoyaltyProgramEligibleCustomer[];
  filterConfig: ILoyaltyProgramEligibleCustomerFilter;
  onOpenModal: (payload: ILoyaltyProgramConfigPayload) => void;
}

export const LoyaltyCustomerFilterPreviewTable: React.FC<LoyaltyCustomerFilterPreviewTableProps> = ({
  filteredUserList,
  filterConfig,
  onOpenModal,
}) => {
  const handleActionClick = (customer: ILoyaltyProgramEligibleCustomer) => {
    const payload: ILoyaltyProgramConfigPayload = {
      id: 0,
      customerId: customer.customerId,
      tenure: filterConfig.tenureMonths || 1,
      discountPercentage: 0,
      minimumOrderValue: filterConfig.minimumRequiredValueRs || 10000,
      minimumOrderValueCurrency: 'INR',
      minimumOrderValueINR: filterConfig.minimumRequiredValueRs || 10000,
      exchangeRate: 1,
      type: LoyaltyConfigAuditLogTypeEnum.ONBOARDING,
    };
    onOpenModal(payload);
  };

  return (
    <div className="w-full mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-right">Order Count</th>
              <th className="px-4 py-3 text-right">Total Value</th>
              <th className="px-4 py-3 text-right">Last Value</th>
              <th className="px-4 py-3 text-left">Last Order Date</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredUserList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No eligible customers found matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredUserList.map((userPreview, i) => (
                <tr key={userPreview.customerId || i} className="hover:bg-slate-50/80 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>{userPreview.userName}</span>
                      {userPreview.membershipStatus === 'ACTIVE' && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                      {userPreview.membershipStatus === 'EXPIRED' && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-indigo-600 font-medium truncate mt-0.5">
                      {userPreview.email}
                    </div>
                  </td>

                  {/* Order Count */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-slate-800">{userPreview.orderCount || 0}</span>
                  </td>

                  {/* Total Value */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-700 font-medium">
                      ₹{(userPreview.totalOrderValueRs || 0).toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Last Value */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-700 font-medium">
                      ₹{(userPreview.lastOrderValueRs || 0).toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Last Order Date */}
                  <td className="px-4 py-3">
                    <span className="text-slate-600 text-xs">
                      {userPreview.lastOrderDate
                        ? dayjs(userPreview.lastOrderDate).format('DD MMM YYYY, h:mm A')
                        : 'NA'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-center">
                    {userPreview.membershipStatus === 'NA' && (
                      <button
                        onClick={() => handleActionClick(userPreview)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Configure Wholesale Program"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
