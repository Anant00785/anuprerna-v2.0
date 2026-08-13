'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import { CustomOrderDetailView } from '@/components/profile/CustomOrderDetailView';
import { ProfileDataState, ProfileEmptyState } from '@/components/profile/ProfileDataState';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { toOrderDetails } from '@/lib/profile/adapters';
import { useAuthStore } from '@/stores/auth.store';
import { OrderDetails } from '@/types/domain/profile';

// Was `mockCustomOrderDetails` with the route id pasted over it. Now fetches
// `/get/customer/custom-order/{id}` (fabric `GET_BY_ID_CUSTOM_ORDER`).
export default function CustomOrderDetailPage({
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
      const raw = await profileRepository.getCustomOrder(id, jwt || undefined);
      setOrder(raw ? toOrderDetails(raw) : null);
    } catch (err: any) {
      setError(err?.message || 'Could not load this custom order.');
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
        <CustomOrderDetailView order={order} />
      ) : (
        <ProfileEmptyState message={`We couldn't find custom order ${id} on your account.`} />
      )}
    </ProfileDataState>
  );
}
