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
    <div className="w-full mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-xs bg-white">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase bg-slate-50/50">
              <th className="px-5 py-3.5 whitespace-nowrap">USER</th>
              <th className="px-5 py-3.5 text-center whitespace-nowrap">ORDER COUNT</th>
              <th className="px-5 py-3.5 text-right whitespace-nowrap">TOTAL VALUE</th>
              <th className="px-5 py-3.5 text-right whitespace-nowrap">LAST VALUE</th>
              <th className="px-5 py-3.5 whitespace-nowrap">LAST ORDER DATE</th>
              <th className="px-5 py-3.5 text-center whitespace-nowrap">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {filteredUserList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  No eligible customers found matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredUserList.map((userPreview, i) => (
                <tr key={userPreview.customerId || i} className="hover:bg-slate-50/80 transition-colors">
                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>{userPreview.userName}</span>
                      {userPreview.membershipStatus === 'ACTIVE' && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                          Active
                        </span>
                      )}
                      {userPreview.membershipStatus === 'EXPIRED' && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-50 text-rose-600 border border-rose-200/60">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#2563eb] hover:underline truncate mt-0.5">
                      {userPreview.email}
                    </div>
                  </td>

                  {/* Order Count */}
                  <td className="px-5 py-4 text-center">
                    <span className="font-medium text-slate-800">{userPreview.orderCount || 0}</span>
                  </td>

                  {/* Total Value */}
                  <td className="px-5 py-4 text-right">
                    <span className="text-slate-700 font-medium">
                      ₹{(userPreview.totalOrderValueRs || 0).toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Last Value */}
                  <td className="px-5 py-4 text-right">
                    <span className="text-slate-700 font-medium">
                      ₹{(userPreview.lastOrderValueRs || 0).toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Last Order Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                    {userPreview.lastOrderDate
                      ? dayjs(userPreview.lastOrderDate).format('DD MMM YYYY, h:mm A')
                      : 'NA'}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4 text-center">
                    {userPreview.membershipStatus === 'NA' && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(userPreview)}
                        className="p-1 text-slate-400 hover:text-[#585c82] hover:bg-slate-100 rounded transition"
                        title="Configure Wholesale Program"
                      >
                        <ChevronRight className="w-4 h-4" />
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
