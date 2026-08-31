import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loomGet } from '@/lib/loom/client';

// =====================================================================================
// /order-status/<token> — the GUEST ORDER-STATUS view.
//
// A buyer who checked out as a guest has no account to sign in to, so this page IS
// their order record. The token in the URL is the authorisation: 32 random bytes,
// handed out once at checkout, stored server-side only as a SHA-256 hash. A wrong
// or guessed token 404s.
//
// Server-rendered directly off the backend read (GET /checkout/order-status/{token}),
// which returns an EXPLICITLY PROJECTED order — never a raw entity dump.
// =====================================================================================

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order status — Anuprerna' };

interface StatusItem {
  id: number;
  orderType: string;
  productGroup: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
}

interface StatusOrder {
  id: number;
  orderNumber: string;
  createdAt: number;
  subTotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  address?: { shippingAddress?: Record<string, string> };
  orderItems: StatusItem[];
  buyerEmail: string;
  guestOrder: boolean;
  paymentState: string;
  paymentProvider: string | null;
  accountInvite: { available: boolean; email?: string };
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return currency + ' ' + amount.toFixed(2);
  }
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let order: StatusOrder | null = null;
  try {
    const data = await loomGet<{ order?: StatusOrder }>('/checkout/order-status/' + encodeURIComponent(token));
    order = data?.order ?? null;
  } catch {
    order = null;
  }
  if (!order) notFound();

  const ship = order.address?.shippingAddress ?? {};
  const paid = order.paymentState === 'PAID';

  return (
    <main className='min-h-[70vh] bg-white'>
      <div className='mx-auto max-w-2xl px-5 py-10'>
        <h1 className='text-xl font-semibold uppercase tracking-[.08em] text-clay'>Order {order.orderNumber}</h1>
        <p className='mt-1 text-sm text-clayd/70'>
          Placed {new Date(order.createdAt).toLocaleDateString()} · {order.buyerEmail}
        </p>

        <div
          className={
            'mt-6 rounded-xl border p-5 ' +
            (paid ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50')
          }
        >
          <p className={'text-sm font-semibold ' + (paid ? 'text-green-900' : 'text-amber-900')}>
            {paid ? 'Payment received' : 'Awaiting payment'}
          </p>
          <p className={'mt-1 text-sm ' + (paid ? 'text-green-800' : 'text-amber-800')}>
            {money(order.total, order.currency)}
            {order.paymentProvider ? ' · via ' + order.paymentProvider : ''}
          </p>
        </div>

        <section className='mt-6 rounded-xl border border-clay/15 bg-[#f6f2ea] p-5'>
          <h2 className='mb-3 text-sm font-semibold uppercase tracking-[.08em] text-clay'>Items</h2>
          <ul className='space-y-2'>
            {order.orderItems.map((it) => (
              <li key={it.id} className='flex items-center justify-between text-sm text-clayd'>
                <span className='min-w-0 flex-1 truncate'>
                  {it.productGroup || 'Item'} <span className='text-clayd/60'>× {it.quantity} {it.unit}</span>
                  <span className='ml-2 rounded-full border border-clay/20 px-2 py-0.5 text-[11px] uppercase text-clayd/70'>
                    {it.orderStatus}
                  </span>
                </span>
                <span className='ml-3 font-medium text-clay'>{money(it.price * it.quantity, it.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className='mt-4 space-y-1 border-t border-clay/15 pt-3 text-sm'>
            <div className='flex justify-between'><dt className='text-clayd/80'>Subtotal</dt><dd className='text-clay'>{money(order.subTotal, order.currency)}</dd></div>
            <div className='flex justify-between'><dt className='text-clayd/80'>Shipping</dt><dd className='text-clay'>{money(order.shippingCost, order.currency)}</dd></div>
            <div className='flex justify-between font-semibold'><dt className='text-clay'>Total</dt><dd className='text-clay'>{money(order.total, order.currency)}</dd></div>
          </dl>
        </section>

        {(ship.addressLineOne || ship.city) && (
          <section className='mt-6 rounded-xl border border-clay/15 bg-[#f6f2ea] p-5'>
            <h2 className='mb-2 text-sm font-semibold uppercase tracking-[.08em] text-clay'>Shipping to</h2>
            <p className='text-sm leading-relaxed text-clayd/90'>
              {ship.name}
              <br />
              {[ship.addressLineOne, ship.addressLineTwo].filter(Boolean).join(', ')}
              <br />
              {[ship.city, ship.state, ship.postalCode, ship.country].filter(Boolean).join(', ')}
            </p>
          </section>
        )}

        {/* POST-PURCHASE ACCOUNT INVITE — optional, never forced. */}
        {order.accountInvite?.available && (
          <section className='mt-6 rounded-xl border border-clay/15 p-5'>
            <p className='text-sm text-clayd/90'>
              You checked out as a guest — there is no account attached to this order, and no
              password was ever created for you.
            </p>
            <Link
              href={'/auth?email=' + encodeURIComponent(order.accountInvite.email ?? '')}
              className='mt-3 inline-block rounded-md border border-clay/30 px-4 py-2 text-sm font-medium text-clay hover:bg-clay/5'
            >
              Create an account for next time
            </Link>
          </section>
        )}

        <p className='mt-8 text-center text-xs text-clayd/60'>
          Keep this link private — anyone with it can view this order.
        </p>
        <div className='mt-4 text-center'>
          <Link href='/products/fabric' className='text-sm font-medium text-clay underline underline-offset-4'>
            Back to shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
