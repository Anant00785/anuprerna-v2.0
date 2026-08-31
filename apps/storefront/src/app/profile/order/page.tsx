import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import OrderListingClient, { OrderListItem } from '@/components/profile/OrderListingClient';
// The order dashboard is where a business-shaped buyer is most likely to be
// looking at the evidence of it, so it is where the offer belongs. It renders
// nothing at all unless the server says this account is over the threshold,
// is still retail, and has not dismissed it.
import BuyerTypePrompt from '@/components/profile/BuyerTypePrompt';

export const metadata = {
  title: 'Orders | Anuprerna',
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let orders: OrderListItem[] = [];
  try {
    const res = await loomGet<{ orderList?: OrderListItem[] }>('/get/customer/order-list/all', { token });
    orders = res?.orderList ?? [];
  } catch {
    orders = [];
  }

  return (
    <>
      <meta name="robots" content="noindex" />
      <BuyerTypePrompt />
      <OrderListingClient orders={orders} />
    </>
  );
}
