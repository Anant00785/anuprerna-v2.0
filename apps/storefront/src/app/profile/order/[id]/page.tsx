import React from 'react';
import { OrderDetailView } from '@/components/profile/OrderDetailView';
import { mockSingleOrderDetails } from '@/lib/profile/dummy-data';

export default async function SingleOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use mockSingleOrderDetails or adapt orderId from route parameter
  const orderData = {
    ...mockSingleOrderDetails,
    id: id || mockSingleOrderDetails.id,
    orderId: id || mockSingleOrderDetails.orderId,
  };

  return <OrderDetailView order={orderData} showHeader={true} />;
}
