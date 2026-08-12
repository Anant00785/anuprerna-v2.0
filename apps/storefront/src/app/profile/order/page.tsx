'use client';

import React, { useEffect, useState } from 'react';
import { mockOrderList } from '@/lib/profile/dummy-data';
import { OrderListItem } from '@/types/domain/profile';
import { OrderListCard } from '@/components/profile/OrderListCard';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { useAuthStore } from '@/stores/auth.store';

export default function OrderListingPage() {
  const { jwt } = useAuthStore();
  const [orders, setOrders] = useState<OrderListItem[]>(mockOrderList);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'PROCESSING' | 'DISPATCHED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    async function loadLiveOrders() {
      setLoading(true);
      try {
        const liveOrders = await profileRepository.getOrderList(jwt || undefined);
        if (Array.isArray(liveOrders) && liveOrders.length > 0) {
          const mapped: OrderListItem[] = liveOrders.map((o, idx) => ({
            orderId: o.id || idx + 101,
            orderType: 'ORDER',
            status: (o.status?.toUpperCase() || 'PROCESSING') as any,
            createdAt: o.orderDate || new Date().toISOString(),
            estimatedDeliveryDate: new Date(Date.now() + 7 * 864e5).toISOString(),
            totalItemCount: o.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1,
            currency: o.currency || 'INR',
            totalAmount: o.totalAmount || 0,
          }));
          setOrders(mapped);
        }
      } catch (err) {
        // Retain initial fallback state if backend endpoint fails
      } finally {
        setLoading(false);
      }
    }

    loadLiveOrders();
  }, [jwt]);

  const activeOrders = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'INITIATED' || o.status === 'READY');
  const dispatchedOrders = orders.filter((o) => o.status === 'DISPATCHED' || o.status === 'DELIVERED' || o.status === 'IN_TRANSIT' || o.status === 'PARTIALLY_DISPATCHED');
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');

  const getFilteredOrders = () => {
    if (selectedTab === 'PROCESSING') return activeOrders;
    if (selectedTab === 'DISPATCHED') return dispatchedOrders;
    if (selectedTab === 'CANCELLED') return cancelledOrders;
    return orders;
  };

  const handleCancelOrder = (orderId: number | string) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: 'CANCELLED' as const } : o))
    );
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="w-full space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Your Orders</h3>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
          <div className="h-48 bg-gray-100 rounded-xl"></div>
          <div className="h-48 bg-gray-100 rounded-xl"></div>
        </div>
      ) : (
        <>
          {/* Filter Summary Tabs */}
          {orders.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-2 mb-6">
              {/* ALL */}
              <div
                onClick={() => setSelectedTab('ALL')}
                className={`cursor-pointer rounded-xl border p-4 flex items-center gap-3 transition-all ${
                  selectedTab === 'ALL'
                    ? 'border-[#5950B7] bg-white shadow-md ring-2 ring-[#5950B7]/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="rounded-full bg-[#EDF2FE] p-3 text-[#5950B7] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">package_2</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-none">{orders.length}</p>
                  <p className="text-gray-500 text-xs mt-1">Total Orders</p>
                </div>
              </div>

              {/* PROCESSING */}
              <div
                onClick={() => setSelectedTab('PROCESSING')}
                className={`cursor-pointer rounded-xl border p-4 flex items-center gap-3 transition-all ${
                  selectedTab === 'PROCESSING'
                    ? 'border-[#BB955E] bg-white shadow-md ring-2 ring-[#BB955E]/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="rounded-full bg-[#FFFBE8] p-3 text-[#BB955E] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">package_2</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-none">{activeOrders.length}</p>
                  <p className="text-gray-500 text-xs mt-1">Active Orders</p>
                </div>
              </div>

              {/* DISPATCHED */}
              <div
                onClick={() => setSelectedTab('DISPATCHED')}
                className={`cursor-pointer rounded-xl border p-4 flex items-center gap-3 transition-all ${
                  selectedTab === 'DISPATCHED'
                    ? 'border-[#52a183] bg-white shadow-md ring-2 ring-[#52a183]/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="rounded-full bg-[#ECFDF5] p-3 text-[#52a183] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">package_2</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-none">{dispatchedOrders.length}</p>
                  <p className="text-gray-500 text-xs mt-1">Dispatched Orders</p>
                </div>
              </div>

              {/* CANCELLED */}
              <div
                onClick={() => setSelectedTab('CANCELLED')}
                className={`cursor-pointer rounded-xl border p-4 flex items-center gap-3 transition-all ${
                  selectedTab === 'CANCELLED'
                    ? 'border-[#AE3E39] bg-white shadow-md ring-2 ring-[#AE3E39]/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="rounded-full bg-[#FEF6F6] p-3 text-[#AE3E39] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">package_2</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-none">{cancelledOrders.length}</p>
                  <p className="text-gray-500 text-xs mt-1">Cancelled Orders</p>
                </div>
              </div>
            </div>
          )}

          {/* Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-8 lg:gap-y-5">
            {filteredOrders.map((item) => (
              <OrderListCard key={item.orderId} item={item} onCancelOrder={handleCancelOrder} />
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="bg-[#efeee9] p-8 text-center rounded-xl text-gray-600 font-semibold text-sm">
              No order item has been found.
            </div>
          )}
        </>
      )}
    </div>
  );
}
