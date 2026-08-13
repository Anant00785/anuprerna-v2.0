'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { WholesaleProgramView } from '@/components/profile/WholesaleProgramView';
import { ProfileDataState, ProfileEmptyState } from '@/components/profile/ProfileDataState';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import {
  toOrderListItem,
  toWholesaleMembershipInfo,
  toWholesaleOrderInfo,
} from '@/lib/profile/adapters';
import { useAuthStore } from '@/stores/auth.store';
import {
  OrderListItem,
  WholesaleMembershipInfo,
  WholesaleOrderInfo,
} from '@/types/domain/profile';

/**
 * Previously seeded from `mockWholesaleMembershipInfo` / `mockWholesaleOrderInfo` /
 * `mockOrderList`, patching only `percentileDiscount` from the live call — so
 * enrollment dates, cycle dates, minimum order value, discount totals and the whole
 * order list were invented for every customer, enrolled or not.
 *
 * Real sources: `/get/customer/loyalty/info` (membership), `/get/order/loyalty/info`
 * (aggregates) and `/get/customer/order-list/loyalty` (orders).
 */
export default function WholesaleProgramPage() {
  const { jwt, user } = useAuthStore();
  const [membershipInfo, setMembershipInfo] = useState<WholesaleMembershipInfo | null>(null);
  const [orderInfo, setOrderInfo] = useState<WholesaleOrderInfo | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = jwt || undefined;
      const [membership, aggregates, loyaltyOrders] = await Promise.all([
        profileRepository.getWholesaleInfo(token),
        profileRepository.getLoyaltyOrderInfo(token),
        profileRepository.getLoyaltyOrderList(token),
      ]);
      setMembershipInfo(toWholesaleMembershipInfo(membership));
      setOrderInfo(toWholesaleOrderInfo(aggregates));
      setOrders(loyaltyOrders.map(toOrderListItem));
    } catch (err: any) {
      setError(err?.message || 'Could not load your wholesale programme details.');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    load();
  }, [load]);

  const tenantName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || '';

  return (
    <ProfileDataState loading={loading} error={error} onRetry={load}>
      {membershipInfo && orderInfo ? (
        <WholesaleProgramView
          membershipInfo={membershipInfo}
          orderInfo={orderInfo}
          orders={orders}
          tenantName={tenantName}
        />
      ) : (
        <ProfileEmptyState message="You are not enrolled in the wholesale partner programme." />
      )}
    </ProfileDataState>
  );
}
