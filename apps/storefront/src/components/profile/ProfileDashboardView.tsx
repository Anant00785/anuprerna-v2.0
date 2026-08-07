'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserProfile, OrderListItem } from '@/types/domain/profile';
import { OrderListCard } from './OrderListCard';

interface CartPreviewItem {
  id: number;
  name: string;
  heroImage: string;
  quantity: number;
  unit: string;
}

interface ProfileDashboardViewProps {
  profile: UserProfile;
  orders: OrderListItem[];
}

const mockCartItems: CartPreviewItem[] = [
  {
    id: 1,
    name: 'Organic Handspun Khadi Cotton Fabric - Undyed Natural White',
    heroImage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=300&auto=format&fit=crop',
    quantity: 10,
    unit: 'Meters',
  },
  {
    id: 2,
    name: 'Eri Silk Handwoven Fabric - Crimson Madder Dye',
    heroImage: 'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?q=80&w=300&auto=format&fit=crop',
    quantity: 5,
    unit: 'Meters',
  },
];

export const ProfileDashboardView: React.FC<ProfileDashboardViewProps> = ({ profile, orders: initialOrders }) => {
  const [orders, setOrders] = useState<OrderListItem[]>(initialOrders);
  const [cartItems] = useState<CartPreviewItem[]>(mockCartItems);

  const firstName = profile.tenant.name.split(' ')[0] || 'User';

  const handleCancelOrder = (orderId: number | string) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: 'CANCELLED' as const } : o))
    );
  };

  const recentOrders = orders.slice(0, 2);

  return (
    <div className="w-full space-y-8">
      {/* Welcome Title matching Angular font-size 37px centered */}
      <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-900 my-4">
        Welcome {firstName}
      </h3>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <h4 className="text-xl font-bold uppercase text-[#b7a990] border-b-2 border-[#f3e9d9] pb-2 tracking-wide">
          Recent Orders
        </h4>

        {recentOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-8 lg:gap-y-5">
            {recentOrders.map((item) => (
              <OrderListCard key={item.orderId} item={item} onCancelOrder={handleCancelOrder} />
            ))}
          </div>
        ) : (
          <div className="bg-[#efeee9] p-8 text-center rounded-xl text-gray-600 text-sm">
            No recent orders found.
          </div>
        )}
      </div>

      {/* Cart Preview Section matching Angular cart_cont */}
      <div className="space-y-4">
        <h4 className="text-xl font-bold uppercase text-[#b7a990] border-b-2 border-[#f3e9d9] pb-2 tracking-wide">
          Cart
        </h4>

        <div className="bg-[#efeee9] p-6 rounded-2xl border border-amber-950/5">
          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
              {cartItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs space-y-2 hover:shadow-md transition-shadow"
                >
                  <img src={item.heroImage} alt={item.name} className="w-full h-32 object-cover rounded-lg" />
                  <p className="text-xs font-bold uppercase text-gray-900 line-clamp-2 mt-2">{item.name}</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {item.quantity} {item.unit}
                  </p>
                </div>
              ))}

              <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-center items-center text-center cursor-pointer hover:bg-amber-50/50 transition-colors h-full min-h-[160px]">
                <p className="text-sm font-bold uppercase text-gray-900 flex items-center gap-1.5">
                  View Cart
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-lg uppercase text-gray-600 font-semibold tracking-wider">
              Your cart is empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
