'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ILoyaltyProgramCustomerMetrics,
  ILoyaltyProgramConfigPayload,
  LoyaltyService,
} from '@/services/loyalty-service';
import { LoyaltyCustomerFilterPage } from '@/components/manage-loyalty-program/LoyaltyCustomerFilterPage';
import { LoyaltyCustomerPreviewTable } from '@/components/manage-loyalty-program/LoyaltyCustomerPreviewTable';
import { UpdateUserLoyaltyModal } from '@/components/manage-loyalty-program/UpdateUserLoyaltyModal';
import { Loader2 } from 'lucide-react';

export default function WholesaleLoyaltyProgramPage() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const [activeUsers, setActiveUsers] = useState<ILoyaltyProgramCustomerMetrics[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<ILoyaltyProgramCustomerMetrics[]>([]);

  const [loadingActive, setLoadingActive] = useState<boolean>(false);
  const [loadingInactive, setLoadingInactive] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalPayload, setModalPayload] = useState<ILoyaltyProgramConfigPayload | null>(null);

  const fetchActiveUsers = useCallback(async () => {
    setLoadingActive(true);
    try {
      const data = await LoyaltyService.getLoyaltyProgramCustomerMetrics(true);
      setActiveUsers(data || []);
    } catch {
      // Handle error silently
    } finally {
      setLoadingActive(false);
    }
  }, []);

  const fetchInactiveUsers = useCallback(async () => {
    setLoadingInactive(true);
    try {
      const data = await LoyaltyService.getLoyaltyProgramCustomerMetrics(false);
      setInactiveUsers(data || []);
    } catch {
      // Handle error silently
    } finally {
      setLoadingInactive(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveUsers();
    fetchInactiveUsers();
  }, [fetchActiveUsers, fetchInactiveUsers]);

  const handleOpenModal = (payload: ILoyaltyProgramConfigPayload) => {
    setModalPayload(payload);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalPayload(null);
  };

  const [customerRefreshKey, setCustomerRefreshKey] = useState<number>(0);

  const handleModalSuccess = () => {
    fetchActiveUsers();
    fetchInactiveUsers();
    setCustomerRefreshKey((prev) => prev + 1);
  };

  const tabs = [
    { id: 0, label: 'Customers' },
    { id: 1, label: 'Active Customers' },
    { id: 2, label: 'Inactive Customers' },
  ];

  return (
    <div className="space-y-6 pt-2 pb-20 max-w-7xl mx-auto">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="bg-[#1f2438] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
          Manage Loyalty Program
        </span>
      </div>

      {/* TABS (Customers / Active Customers / Inactive Customers) - EXACT POSITIONING */}
      <div className="flex items-center justify-center gap-8 border-b border-slate-200 text-xs font-semibold pt-2 pb-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 transition-colors relative ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* Tab 0: Customers */}
        {activeTab === 0 && (
          <LoyaltyCustomerFilterPage
            key={customerRefreshKey}
            onOpenModal={handleOpenModal}
          />
        )}

        {/* Tab 1: Active Customers */}
        {activeTab === 1 &&
          (loadingActive ? (
            <div className="p-16 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
              <span className="text-xs font-medium text-slate-500">Loading active customers...</span>
            </div>
          ) : (
            <LoyaltyCustomerPreviewTable
              filteredUserList={activeUsers}
              onOpenModal={handleOpenModal}
              emptyMessage="No active loyalty customers found."
            />
          ))}

        {/* Tab 2: Inactive Customers */}
        {activeTab === 2 &&
          (loadingInactive ? (
            <div className="p-16 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
              <span className="text-xs font-medium text-slate-500">Loading inactive customers...</span>
            </div>
          ) : (
            <LoyaltyCustomerPreviewTable
              filteredUserList={inactiveUsers}
              onOpenModal={handleOpenModal}
              emptyMessage="No inactive loyalty customers found."
            />
          ))}
      </div>

      {/* Update User Loyalty Modal */}
      <UpdateUserLoyaltyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        initialData={modalPayload}
      />
    </div>
  );
}
