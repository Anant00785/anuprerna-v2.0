'use client';

import React, { useEffect, useState } from 'react';
import { ProfileDashboardView } from '@/components/profile/ProfileDashboardView';
import { mockUserProfile, mockOrderList } from '@/lib/profile/dummy-data';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { useAuthStore } from '@/stores/auth.store';
import { UserProfile, OrderListItem } from '@/types/domain/profile';

export default function DashboardPage() {
  const { jwt, user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [orders, setOrders] = useState<OrderListItem[]>(mockOrderList);

  useEffect(() => {
    async function loadDashboardData() {
      if (user) {
        setProfile({
          tenant: {
            id: Number(user.id) || 1001,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Valued Customer',
            email: user.email || 'customer@anuprerna.com',
          },
        });
      }

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
        // Fall back to mock order list
      }
    }

    loadDashboardData();
  }, [jwt, user]);

  return <ProfileDashboardView profile={profile} orders={orders} />;
}
