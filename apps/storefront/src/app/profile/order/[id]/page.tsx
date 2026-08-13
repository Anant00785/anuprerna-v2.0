'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { use } from 'react';
import { OrderDetailView } from '@/components/profile/OrderDetailView';
import { ProfileDataState, ProfileEmptyState } from '@/components/profile/ProfileDataState';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { toOrderDetails } from '@/lib/profile/adapters';
import { useAuthStore } from '@/stores/auth.store';
import { OrderDetails } from '@/types/domain/profile';

// Was a server component that rendered `mockSingleOrderDetails` with the route id
// pasted over it — every order id showed the same invented order. Now fetches
// `/get/customer/order/{id}`, which is what the legacy storefront calls.
export default function SingleOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { jwt } = useAuthStore();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await profileRepository.getOrder(id, jwt || undefined);
      setOrder(raw ? toOrderDetails(raw) : null);
    } catch (err: any) {
      setError(err?.message || 'Could not load this order.');
    } finally {
      setLoading(false);
    }
  }, [id, jwt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProfileDataState loading={loading} error={error} onRetry={load}>
      {order ? (
        <OrderDetailView order={order} showHeader={true} />
      ) : (
        <ProfileEmptyState message={`We couldn't find order ${id} on your account.`} />
      )}
    </ProfileDataState>
  );
}
