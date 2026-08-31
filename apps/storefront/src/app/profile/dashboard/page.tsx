import { cookies } from 'next/headers';
import Link from 'next/link';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export const metadata = {
  title: 'Dashboard | Anuprerna',
  robots: { index: false, follow: false },
};

function formatDate(epochMs: number): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface OrderSummary {
  orderId: number;
  createdAt: number;
  totalItemCount: number;
  status: string;
  currency?: string;
  orderType?: string;
  estimatedDeliveryDate?: number;
}

interface CartItem {
  productPreview?: {
    heroImage?: string;
    name?: string;
    slug?: string;
    productGroup?: string;
  };
  quantity?: number;
}

export default async function DashboardPage() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  const [profileRes, ordersRes, cartRes] = await Promise.allSettled([
    loomGet<{ customer?: { tenant?: { name?: string; email?: string } } }>('/get/customer/profile', { token }),
    loomGet<{ orderList?: OrderSummary[] }>('/get/customer/order-list/all', { token }),
    loomGet<{ cartItemList?: CartItem[] }>('/get/cart-item/list', { token }),
  ]);

  const profile  = profileRes.status  === 'fulfilled' ? profileRes.value  : null;
  const orders   = ordersRes.status   === 'fulfilled' ? ordersRes.value   : null;
  const cart     = cartRes.status     === 'fulfilled' ? cartRes.value     : null;

  const customer      = profile?.customer?.tenant;
  const allOrders     = orders?.orderList ?? [];
  // Recent order: skip FAILED/INITIATED (matches the Orders listing filter) so the dashboard
  // never surfaces an order the listing hides.
  const recentOrder   = allOrders.find((o) => !(['FAILED', 'INITIATED'].includes(o.status))) ?? null;
  const cartItems     = cart?.cartItemList ?? [];
  const firstCartItem = cartItems[0] ?? null;

  function statusBadge(status: string): { cls: string; label: string } {
    const map: Record<string, { cls: string; label: string }> = {
      PROCESSING: { cls: 'bg-blue-50 text-blue-700 border-blue-200',         label: 'Processing' },
      READY:      { cls: 'bg-green-50 text-green-700 border-green-200',       label: 'Ready' },
      DISPATCHED: { cls: 'bg-teal-50 text-teal-700 border-teal-200',         label: 'Dispatched' },
      DELIVERED:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Delivered' },
      CANCELLED:  { cls: 'bg-orange-50 text-orange-600 border-orange-200',    label: 'Cancelled' },
      FAILED:     { cls: 'bg-orange-50 text-orange-600 border-orange-200',    label: 'Failed' },
    };
    return map[status] ?? { cls: 'bg-gray-50 text-gray-600 border-gray-200', label: status };
  }

  return (
    <>
      <meta name="robots" content="noindex" />

      {/* Welcome header */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
        Welcome {customer?.name?.split(' ')[0] ?? ''}
      </h1>

      {/* Recent Orders section */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold tracking-widest text-bark uppercase mb-3">Recent Orders</h2>

        {!recentOrder ? (
          <div className="bg-sand/40 rounded border border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
            No updates available
          </div>
        ) : (() => {
          const badge = statusBadge(recentOrder.status);
          const isCustom = recentOrder.orderType === 'CUSTOM_ORDER';
          return (
            <div className="border border-gray-200 rounded bg-white">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-wrap">
                {isCustom && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium border border-clay/40 text-clay px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[11px]">local_shipping</span>
                    Custom Order
                  </span>
                )}
                <span className="text-sm font-medium text-gray-800">#{recentOrder.orderId}</span>
                <span className={`ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              <div className="flex gap-4 p-4">
                <div className="w-20 h-20 flex-shrink-0 bg-sand/50 rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[40px] text-gray-300">inventory_2</span>
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <p className="text-gray-600">
                    Order Placed On: {formatDate(recentOrder.createdAt)}
                  </p>
                  <Link
                    href={`/profile/order/${recentOrder.orderId}`}
                    className="mt-2 inline-block border border-gray-300 text-gray-700 text-xs px-3 py-1 rounded hover:bg-gray-50 transition-colors"
                  >
                    View Order
                  </Link>
                  {recentOrder.estimatedDeliveryDate ? (
                    <p className="mt-1 text-gray-600">
                      Estimated Delivery On: <strong>{formatDate(recentOrder.estimatedDeliveryDate)}</strong>
                    </p>
                  ) : null}
                  <p className="mt-1 text-gray-500 text-xs">{recentOrder.totalItemCount} Item{recentOrder.totalItemCount !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-400">
                No updates available
              </div>
            </div>
          );
        })()}
      </section>

      {/* Cart section */}
      <section>
        <h2 className="text-xs font-semibold tracking-widest text-bark uppercase mb-3">Cart</h2>

        <div className="border border-gray-200 rounded bg-white">
          {cartItems.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Your cart is empty.</div>
          ) : (
            <div className="flex gap-4 p-4 items-center">
              {firstCartItem?.productPreview?.heroImage ? (
                <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-sand/30">
                  <img
                    src={firstCartItem.productPreview.heroImage}
                    alt={firstCartItem.productPreview.name ?? ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 flex-shrink-0 rounded bg-sand/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[36px] text-gray-300">shopping_bag</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                {firstCartItem?.productPreview?.name && (
                  <p className="text-xs text-gray-600 uppercase tracking-wide line-clamp-2 mb-2">
                    {firstCartItem.productPreview.name}
                  </p>
                )}
                {cartItems.length > 1 && (
                  <p className="text-xs text-gray-400 mb-2">+{cartItems.length - 1} more item{cartItems.length > 2 ? 's' : ''}</p>
                )}
                <Link
                  href="/checkout"
                  className="inline-block text-xs font-semibold tracking-widest text-gray-700 border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 transition-colors"
                >
                  VIEW CART
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
