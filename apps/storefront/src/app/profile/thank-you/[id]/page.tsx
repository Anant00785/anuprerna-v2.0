import { cookies } from 'next/headers';
import Link from 'next/link';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export const metadata = {
  title: 'Order Confirmed | Anuprerna',
  robots: { index: false, follow: false },
};

function formatDate(epochMs: number): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function ThankYouPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let order: Record<string, unknown> | null = null;
  try {
    const res = await loomGet<{ order?: Record<string, unknown> }>('/get/customer/order/' + id, { token });
    order = res?.order ?? null;
  } catch {
    // non-fatal
  }

  const currency = (order?.currency as string | undefined)?.toUpperCase() ?? '';
  const total    = order?.total as number | undefined;
  const items    = (order?.orderItems as unknown[]) ?? [];
  const createdAt = order?.createdAt as number | undefined;

  return (
    <>
      <meta name="robots" content="noindex" />
      {/* Confirmation banner */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-green-600 text-[32px]">check_circle</span>
        </div>
        <h1 className="text-2xl font-medium text-clay">Thank you for your order!</h1>
        <p className="text-gray-500 mt-2 text-sm">Order #{id} has been placed successfully.</p>
        {createdAt && <p className="text-gray-400 text-xs mt-1">Placed on {formatDate(createdAt)}</p>}
      </div>

      {/* Order summary */}
      {order && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-800">Order Summary</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((item, idx) => {
              const it = item as Record<string, unknown>;
              const cust = it?.customization as Record<string, unknown> | undefined;
              const prod = (cust?.fabricProductPreview as Record<string, unknown> | undefined)?.product as Record<string, unknown> | undefined;
              return (
                <div key={idx} className="px-5 py-4 flex gap-4 items-center">
                  {(prod?.heroImage as string | undefined) && (
                    <img src={prod!.heroImage as string} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{prod?.name as string ?? 'Product'}</p>
                    <p className="text-xs text-gray-400">{it.quantity as number} {it.unit as string}</p>
                  </div>
                  <p className="text-sm text-gray-700">
                    {(it.currency as string | undefined)?.toUpperCase() ?? currency} {((it.price as number) * (it.quantity as number)).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
          {total != null && (
            <div className="px-5 py-4 border-t border-gray-100 flex justify-between font-semibold text-gray-800">
              <span>Total</span>
              <span>{currency} {total.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/profile/order/${id}`}
          className="inline-flex items-center gap-2 bg-clay text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-clayd transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          View Order Details
        </Link>
        <Link
          href="/profile/order"
          className="inline-flex items-center gap-2 border border-clay text-clay px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-clay/5 transition-colors"
        >
          All Orders
        </Link>
        <Link
          href="/products/fabric"
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sand transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </>
  );
}
