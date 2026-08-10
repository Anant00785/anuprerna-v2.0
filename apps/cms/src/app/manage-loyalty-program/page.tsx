'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  ILoyaltyProgramCustomerMetrics,
  ILoyaltyProgramConfigPayload,
  LoyaltyService,
} from '@/services/loyalty-service';
import { LoyaltyCustomerFilterPage } from '@/components/manage-loyalty-program/LoyaltyCustomerFilterPage';
import { LoyaltyCustomerPreviewTable } from '@/components/manage-loyalty-program/LoyaltyCustomerPreviewTable';
import { UpdateUserLoyaltyModal } from '@/components/manage-loyalty-program/UpdateUserLoyaltyModal';
import { Users, UserCheck, UserX, Loader2 } from 'lucide-react';

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
      // Handle error silently or set fallback empty array
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
      // Handle error silently or set fallback empty array
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

  const handleModalSuccess = () => {
    fetchActiveUsers();
    fetchInactiveUsers();
  };

  const tabs = [
    { id: 0, label: 'Customers', icon: Users },
    { id: 1, label: 'Active Customers', icon: UserCheck, count: activeUsers.length },
    { id: 2, label: 'Inactive Customers', icon: UserX, count: inactiveUsers.length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeading heading="Manage Loyalty Program" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8 justify-center" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* Tab 0: Customers */}
        {activeTab === 0 && <LoyaltyCustomerFilterPage onOpenModal={handleOpenModal} />}

        {/* Tab 1: Active Customers */}
        {activeTab === 1 &&
          (loadingActive ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="text-sm font-medium text-slate-500">Loading active customers...</span>
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
            <div className="p-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="text-sm font-medium text-slate-500">Loading inactive customers...</span>
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
