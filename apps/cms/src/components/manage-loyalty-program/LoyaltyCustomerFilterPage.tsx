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
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Tenure & Minimum Order Value Filter */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm pb-2 border-b border-slate-100">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter by Metrics</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase">
                  Tenure (Months)
                </label>
                <input
                  type="number"
                  value={filterData.tenureMonths || ''}
                  onChange={(e) =>
                    setFilterData((prev) => ({ ...prev, tenureMonths: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase">
                  Minimum Order Value (INR)
                </label>
                <input
                  type="number"
                  value={filterData.minimumRequiredValueRs || ''}
                  onChange={(e) =>
                    setFilterData((prev) => ({ ...prev, minimumRequiredValueRs: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
            <button
              onClick={handleApplyTenureFilter}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
            >
              Apply Filter
            </button>
          </div>

          {/* OR Divider */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
              OR
            </div>
          </div>

          {/* Email Filter */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm pb-2 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-500" />
              <span>Search by Email</span>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase">
                Customer Email
              </label>
              <input
                type="email"
                value={filterData.email}
                onChange={(e) => setFilterData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <button
              onClick={handleApplyEmailFilter}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
            >
              Search Email
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Fetching eligible customers...</span>
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
