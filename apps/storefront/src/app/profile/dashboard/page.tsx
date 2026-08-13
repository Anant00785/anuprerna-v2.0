'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ProfileDashboardView } from '@/components/profile/ProfileDashboardView';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { toOrderListItem } from '@/lib/profile/adapters';
import { useAuthStore } from '@/stores/auth.store';
import { UserProfile, OrderListItem } from '@/types/domain/profile';
import { ProfileDataState } from '@/components/profile/ProfileDataState';

export default function DashboardPage() {
  const { jwt } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = jwt || undefined;
      const [customer, rawOrders] = await Promise.all([
        profileRepository.getCustomerProfile(token),
        profileRepository.getOrderList(token),
      ]);
      setProfile({
        tenant: {
          id: Number(customer.id) || 0,
          name: [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim(),
          email: customer.email ?? '',
        },
      });
      setOrders(rawOrders.map(toOrderListItem));
    } catch (err: any) {
      // Previously this swallowed the failure and left fabricated orders on screen.
      setError(err?.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProfileDataState loading={loading} error={error} onRetry={load}>
      {profile && <ProfileDashboardView profile={profile} orders={orders} />}
    </ProfileDataState>
  );
}
