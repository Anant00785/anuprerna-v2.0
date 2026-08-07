import React from 'react';
import { OrderThankYouView } from '@/components/profile/OrderThankYouView';
import { mockSingleOrderDetails } from '@/lib/profile/dummy-data';

export default async function OrderThankYouPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const orderData = {
    ...mockSingleOrderDetails,
    id: id || mockSingleOrderDetails.id,
    orderId: id || mockSingleOrderDetails.orderId,
  };

  return <OrderThankYouView order={orderData} />;
}
