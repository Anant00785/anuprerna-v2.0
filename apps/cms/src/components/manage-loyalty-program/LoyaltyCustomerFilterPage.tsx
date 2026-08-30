'use client';

import React, { useState, useEffect } from 'react';
import {
  ILoyaltyProgramEligibleCustomer,
  ILoyaltyProgramEligibleCustomerFilter,
  ILoyaltyProgramConfigPayload,
  LoyaltyService,
} from '@/services/loyalty-service';
import { LoyaltyCustomerFilterPreviewTable } from './LoyaltyCustomerFilterPreviewTable';
import { Search, Filter, AlertCircle, Loader2 } from 'lucide-react';

interface LoyaltyCustomerFilterPageProps {
  onOpenModal: (payload: ILoyaltyProgramConfigPayload) => void;
}

export const LoyaltyCustomerFilterPage: React.FC<LoyaltyCustomerFilterPageProps> = ({ onOpenModal }) => {
  const [eligibleCustomers, setEligibleCustomers] = useState<ILoyaltyProgramEligibleCustomer[]>([]);
  const [filterData, setFilterData] = useState<ILoyaltyProgramEligibleCustomerFilter>({
    tenureMonths: 1,
    minimumRequiredValueRs: 10000,
    email: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEligibleCustomers = async (filter: ILoyaltyProgramEligibleCustomerFilter) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await LoyaltyService.getLoyaltyProgramEligibleCustomers(filter);
      setEligibleCustomers(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch eligible customer list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleCustomers(filterData);
  }, []);

  const handleApplyTenureFilter = () => {
    if (!filterData.tenureMonths || !filterData.minimumRequiredValueRs) {
      setErrorMsg('Please enter a valid tenure and minimum order value!');
      return;
    }
    const updated = { ...filterData, email: '' };
    setFilterData(updated);
    fetchEligibleCustomers(updated);
  };

  const handleApplyEmailFilter = () => {
    if (!filterData.email || !filterData.email.trim()) {
      setErrorMsg('Please enter a valid email address!');
      return;
    }
    const updated = { ...filterData, tenureMonths: 0, minimumRequiredValueRs: 0 };
    setFilterData(updated);
    fetchEligibleCustomers(updated);
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Card - EXACT MATCH WITH SCREENSHOT */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Block: Tenure & Minimum Order Value */}
          <div className="w-full lg:w-[45%] space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Tenure (Months)
              </label>
              <input
                type="number"
                value={filterData.tenureMonths || ''}
                onChange={(e) =>
                  setFilterData((prev) => ({ ...prev, tenureMonths: parseInt(e.target.value) || 0 }))
                }
                placeholder="1"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-md outline-none focus:border-[#585c82] text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Minimum Order Value (INR)
              </label>
              <input
                type="number"
                value={filterData.minimumRequiredValueRs || ''}
                onChange={(e) =>
                  setFilterData((prev) => ({ ...prev, minimumRequiredValueRs: parseFloat(e.target.value) || 0 }))
                }
                placeholder="10000"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-md outline-none focus:border-[#585c82] text-slate-800"
              />
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleApplyTenureFilter}
                disabled={loading}
                className="w-full max-w-xs py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#585c82] hover:bg-[#484c68] rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>

          {/* OR Divider */}
          <div className="flex items-center justify-center font-bold text-xs text-slate-900 uppercase">
            OR
          </div>

          {/* Right Block: Email */}
          <div className="w-full lg:w-[45%] space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={filterData.email}
                onChange={(e) => setFilterData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-md outline-none focus:border-[#585c82] text-slate-800"
              />
            </div>

            {/* Spacer to match height */}
            <div className="hidden lg:block h-[58px]" />

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleApplyEmailFilter}
                disabled={loading}
                className="w-full max-w-xs py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#585c82] hover:bg-[#484c68] rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-16 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
          <span className="text-xs font-medium text-slate-500">Fetching eligible customers...</span>
        </div>
      ) : (
        <LoyaltyCustomerFilterPreviewTable
          filteredUserList={eligibleCustomers}
          filterConfig={filterData}
          onOpenModal={onOpenModal}
        />
      )}
    </div>
  );
};
