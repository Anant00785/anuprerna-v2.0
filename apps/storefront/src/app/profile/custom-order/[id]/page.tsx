import React from 'react';
import { CustomOrderDetailView } from '@/components/profile/CustomOrderDetailView';
import { mockCustomOrderDetails } from '@/lib/profile/dummy-data';

export default async function CustomOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const orderData = {
    ...mockCustomOrderDetails,
    id: id || mockCustomOrderDetails.id,
    orderId: id || mockCustomOrderDetails.orderId,
  };

  return <CustomOrderDetailView order={orderData} />;
}
