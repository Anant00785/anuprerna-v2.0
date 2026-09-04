import { cookies } from 'next/headers';
import Link from 'next/link';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import ProductionUpdates, { OrderwiseWorkflow } from '@/components/profile/ProductionUpdates';
import ShipmentCard, { FulfilledItemSummary } from '@/components/profile/ShipmentCard';

export const metadata = {
  title: 'Order Detail | Anuprerna',
  robots: { index: false, follow: false },
};

const MS_24H = 24 * 60 * 60 * 1000;

function formatDate(epochMs?: number): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function money(currency: string, value?: number): string {
  return (currency ? currency.toUpperCase() + ' ' : '') + (value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SECTION_LABEL: Record<string, string> = {
  IN_STOCK: 'In-Stock Order',
  MADE_TO_ORDER: 'Made To Order',
  PRE_ORDER: 'Pre Order',
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  IN_TRANSIT: 'Dispatched',
  CANCELLED: 'Cancelled',
  INITIATED: 'Confirmed',
  PROCESSING: 'Processing',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  DISPATCHED: 'Dispatched',
  PARTIALLY_DISPATCHED: 'Partially Dispatched',
};

function statusColor(s: string): string {
  const map: Record<string, string> = {
    PROCESSING: 'text-[#BB955E]',
    DISPATCHED: 'text-[#52a183]',
    IN_TRANSIT: 'text-[#52a183]',
    DELIVERED: 'text-[#52a183]',
    CANCELLED: 'text-[#AE3E39]',
    FAILED: 'text-[#AE3E39]',
    INITIATED: 'text-gray-700',
    PARTIALLY_DISPATCHED: 'text-[#5950B7]',
  };
  return map[s] ?? 'text-gray-700';
}

interface OrderAddress {
  name?: string;
  companyName?: string;
  addressLineOne?: string;
  addressLineTwo?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  contactEmail?: string;
}

interface OrderItem {
  id: number;
  orderType: string;
  orderStatus: string;
  paymentStatus?: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  shippingCode?: string;
  trackingUrl?: string;
  dispatchedOn?: number;
  estimatedDeliveryFrom?: number;
  estimatedDeliveryTo?: number;
  hasWorkflow?: boolean;
  customization?: {
    fabricProductPreview?: { product?: { name?: string; heroImage?: string; sku?: string } };
    finishedProductPreview?: { product?: { name?: string; heroImage?: string; sku?: string } };
  };
}

interface OrderItemFulfillmentLine {
  orderItemId: number;
  quantity: number;
  unit: string;
}

interface Fulfillment {
  id?: number;
  shippingCode?: string;
  trackingUrl?: string;
  dispatchedOn?: number;
  estimatedDeliveryFrom?: number;
  estimatedDeliveryTo?: number;
  note?: string;
  orderItemFulfillmentList?: OrderItemFulfillmentLine[];
}

interface OrderDetail {
  id: number;
  createdAt: number;
  cancelledAt?: number;
  failedErrorCode?: number;
  orderType?: string;
  total?: number;
  subTotal?: number;
  shippingCost?: number;
  currency?: string;
  loyaltyOrder?: boolean;
  loyaltyDiscountAmount?: number;
  orderItems?: OrderItem[];
  address?: { shippingAddress?: OrderAddress; billingAddress?: OrderAddress };
  shippingMode?: { name?: string };
  note?: string;
}

function itemMeta(it: OrderItem) {
  const c = it.customization ?? {};
  const p = c.fabricProductPreview?.product ?? c.finishedProductPreview?.product ?? {};

  // Try multiple fallback paths for product name
  let name =
    p.name ||
    (c as any)?.fabricProductPreview?.name ||
    (c as any)?.finishedProductPreview?.name ||
    (c as any)?.productName ||
    (c as any)?.name;

  // If still no name, show placeholder with order type info
  if (!name) {
    const orderTypeLabel = it.orderType === 'MADE_TO_ORDER' ? 'Custom' : it.orderType === 'PRE_ORDER' ? 'Pre-Order' : 'In-Stock';
    name = `${orderTypeLabel} Product (ID: ${it.id})`;
  }

  const sku =
    p.sku ||
    (c as any)?.sku ||
    (c as any)?.productSku ||
    undefined;

  const heroImage =
    p.heroImage ||
    (c as any)?.image ||
    (c as any)?.heroImage ||
    undefined;

  return { name, sku, heroImage };
}

function AddressBlock({ a }: { a: OrderAddress }) {
  const phones = [a.primaryPhone, a.secondaryPhone].filter(Boolean).join(', ');
  return (
    <div className="text-sm text-gray-600 space-y-0.5">
      {a.name && <p className="font-medium text-gray-800">{a.name}</p>}
      {a.companyName && <p>{a.companyName}</p>}
      <p>{[a.addressLineOne, a.addressLineTwo, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}</p>
      {phones && <p className="mt-1 text-gray-500">{phones}</p>}
      {a.contactEmail && <p className="text-gray-500">{a.contactEmail}</p>}
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let order: OrderDetail | null = null;
  let fulfillments: Fulfillment[] = [];
  let error = '';

  try {
    const [orderRes, fulfillRes] = await Promise.allSettled([
      loomGet<{ order?: OrderDetail }>('/get/customer/order/' + id, { token }),
      loomGet<{ orderFulfillmentList?: Fulfillment[] } | Fulfillment[]>('/get/customer/order/' + id + '/fulfillment-list', { token }),
    ]);
    if (orderRes.status === 'fulfilled') order = orderRes.value?.order ?? null;
    if (fulfillRes.status === 'fulfilled') {
      const v = fulfillRes.value as { orderFulfillmentList?: Fulfillment[] } | Fulfillment[];
      fulfillments = Array.isArray(v) ? v : v?.orderFulfillmentList ?? [];
    }
  } catch {
    error = 'Failed to load order details.';
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-16 text-center">
        <p className="text-gray-500">{error || 'Order not found.'}</p>
        <Link href="/profile/order" className="mt-4 inline-block text-sm text-clay hover:underline">Back to orders</Link>
      </div>
    );
  }

  const currency = order.currency ?? '';
  const items = order.orderItems ?? [];
  const shipping = order.address?.shippingAddress;
  const billing = order.address?.billingAddress;

  // Group items by type, preserving live's section order.
  const sectionOrder = ['IN_STOCK', 'MADE_TO_ORDER', 'PRE_ORDER'];
  const grouped = sectionOrder
    .map((type) => ({ type, items: items.filter((i) => i.orderType === type) }))
    .filter((g) => g.items.length > 0);

  // Derive a display status (the detail payload has no top-level status field).
  const isCancelled = !!order.cancelledAt || items.some((i) => i.orderStatus === 'CANCELLED');
  const isFailed = (order.failedErrorCode ?? -1) >= 0 && order.failedErrorCode !== -1;
  const anyDispatched = items.some((i) => ['DISPATCHED', 'IN_TRANSIT', 'PARTIALLY_DISPATCHED', 'DELIVERED'].includes(i.orderStatus));

  // Cancel guard: only standard, not dispatched, not cancelled/failed, within 24h.
  const within24h = Date.now() - order.createdAt <= MS_24H;
  const cancellable = order.orderType !== 'CUSTOM_ORDER' && !isCancelled && !isFailed && !anyDispatched;

  // Rate-order CTA is offered when the order is in a settled (delivered/dispatched) state.
  const showRate = anyDispatched && !isCancelled;

  // Fetch the production workflow for each made-to-order item that has one.
  // Mirrors the live per-item GET /get/order/{orderId}/workflow/{itemId}.
  const madeToOrderItems = items.filter((i) => i.orderType === 'MADE_TO_ORDER' && i.hasWorkflow && i.id != null);
  const workflowEntries = await Promise.all(
    madeToOrderItems.map(async (it) => {
      try {
        const res = await loomGet<{ orderwiseWorkflow?: OrderwiseWorkflow }>(
          '/get/order/' + order!.id + '/workflow/' + it.id,
          { token },
        );
        const wf = res?.orderwiseWorkflow ?? null;
        if (wf?.steps?.length) {
          wf.steps = [...wf.steps].sort((a, b) =>
            (a.previousStepElementId ?? '') > (b.previousStepElementId ?? '') ? 1 : -1,
          );
          wf.steps.forEach((step) => {
            const subs = step.subProcesses ?? [];
            let done = 0;
            subs.forEach((sp) => {
              if (sp.subProcessStatus === 'COMPLETED') done += 1;
              else if (sp.subProcessStatus === 'IN_PROGRESS') done += 0.4;
            });
            step.stepProgress = subs.length ? (done / subs.length) * 100 : 0;
          });
        }
        return [it.id as number, wf] as const;
      } catch {
        return [it.id as number, null] as const;
      }
    }),
  );
  const workflowByItem = new Map<number, OrderwiseWorkflow | null>(workflowEntries);

  // Map a fulfillment's item list to display summaries (name — qty unit).
  function itemsForFulfillment(f: Fulfillment): FulfilledItemSummary[] {
    return (f.orderItemFulfillmentList ?? [])
      .map((line) => {
        const it = items.find((o) => o.id === line.orderItemId);
        if (!it) return null;
        const name = itemMeta(it).name;
        return name ? { name, quantity: line.quantity, unit: line.unit } : null;
      })
      .filter((x): x is FulfilledItemSummary => x !== null);
  }

  // Determine overall order status for display
  const overallStatus = isCancelled ? 'CANCELLED' : isFailed ? 'FAILED' : anyDispatched ? 'DISPATCHED' : 'PROCESSING';

  // Order status timeline
  const statusSteps = [
    { label: 'Confirmed', status: 'INITIATED', completed: true },
    { label: 'Processing', status: 'PROCESSING', completed: anyDispatched || isCancelled },
    { label: 'Dispatched', status: 'DISPATCHED', completed: items.some(i => ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(i.orderStatus)) },
    { label: 'Delivered', status: 'DELIVERED', completed: items.some(i => i.orderStatus === 'DELIVERED') },
  ];

  return (
    <>
      <meta name="robots" content="noindex" />
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <Link href="/profile/order" className="hover:text-clay">Orders</Link>
        <span>/</span>
        <span className="text-gray-600">#{order.id}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-clay">Order #{order.id}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed {formatDate(order.createdAt)}</p>
          <p className="text-sm font-medium mt-2 text-clay">Status: {ITEM_STATUS_LABEL[overallStatus] ?? overallStatus}</p>
        </div>
        <div className="flex items-center gap-3">
          {showRate && (
            <button
              disabled
              title="Order feedback disabled in demo mode"
              className="text-xs border border-clay/40 text-clay px-3 py-1.5 rounded cursor-not-allowed opacity-80"
            >
              Rate Order Experience
            </button>
          )}
          {cancellable && (
            <button
              disabled
              title={within24h ? 'Order cancellation disabled in demo mode' : 'Cancellation is disabled after 24 hours'}
              className={'text-xs border border-red-200 text-red-400 px-3 py-1.5 rounded cursor-not-allowed ' + (within24h ? 'opacity-70' : 'opacity-40')}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Wholesale banner */}
          {order.loyaltyOrder && (
            <div className="w-full text-sm p-4 rounded-lg border-l-4 border-l-[#3a9173] bg-[#E8F0ED]">
              <p className="font-semibold text-[#3a9173] text-lg">Wholesale Program Order</p>
              {order.loyaltyDiscountAmount ? (
                <p className="text-[#3a9173] text-sm">You saved <span className="font-bold">{money(currency, order.loyaltyDiscountAmount)}</span> with wholesale partner discount.</p>
              ) : null}
            </div>
          )}

          {/* Item-type sections */}
          {grouped.map((group) => {
            const headStatus = group.items[0]?.orderStatus ?? '';
            return (
              <div key={group.type} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-medium text-gray-800">{SECTION_LABEL[group.type] ?? group.type}</h2>
                  {headStatus && (
                    <span className={'text-sm font-medium ' + statusColor(headStatus)}>{ITEM_STATUS_LABEL[headStatus] ?? headStatus}</span>
                  )}
                </div>
                {group.items[0]?.paymentStatus && (
                  <div className="px-5 pt-3 text-xs text-gray-500">
                    Payment Status: <span className="font-medium text-gray-700">{group.items[0].paymentStatus.charAt(0) + group.items[0].paymentStatus.slice(1).toLowerCase()}</span>
                  </div>
                )}
                <div className="divide-y divide-gray-50">
                  {group.items.map((item) => {
                    const meta = itemMeta(item);
                    const wf = item.id != null ? workflowByItem.get(item.id) ?? null : null;
                    return (
                      <div key={item.id} className="px-5 py-5 hover:bg-gray-50 transition">
                        <div className="flex gap-4 items-start mb-3">
                          {meta.heroImage ? (
                            <img src={meta.heroImage} alt={meta.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-200 shadow-sm" />
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-200">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base mb-1">{meta.name}</h3>
                            {meta.sku && <p className="text-xs text-gray-500 mb-2">SKU: <span className="font-mono text-gray-700">{meta.sku}</span></p>}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                                {item.quantity} {item.unit}
                              </span>
                              <span className={'inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-medium ' + (item.orderStatus === 'DELIVERED' ? 'bg-green-600' : item.orderStatus === 'CANCELLED' ? 'bg-red-600' : item.orderStatus === 'PROCESSING' ? 'bg-blue-600' : 'bg-gray-600')}>
                                {ITEM_STATUS_LABEL[item.orderStatus] ?? item.orderStatus}
                              </span>
                              {item.paymentStatus && (
                                <span className={'inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-medium ' + (item.paymentStatus === 'PAID' ? 'bg-green-600' : 'bg-amber-500')}>
                                  {item.paymentStatus === 'PAID' ? '✓ Paid' : '⏳ Pending Payment'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-clay mb-1">{money(item.currency ?? currency, Number(item.price) * Number(item.quantity))}</p>
                            <p className="text-xs text-gray-500">@ {money(item.currency ?? currency, Number(item.price))}/unit</p>
                          </div>
                        </div>
                        {item.hasWorkflow && wf?.workflowId && (
                          <ProductionUpdates workflow={wf} orderStatus={item.orderStatus} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Shipments */}
          {fulfillments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-medium text-gray-800">Shipments</h2></div>
              <div className="divide-y divide-gray-50">
                {fulfillments.map((f, i) => (
                  <div key={f.id ?? i} className="px-2 py-2">
                    <ShipmentCard
                      index={i}
                      shippingCode={f.shippingCode}
                      trackingUrl={f.trackingUrl}
                      dispatchedOn={f.dispatchedOn}
                      estimatedDeliveryFrom={f.estimatedDeliveryFrom}
                      estimatedDeliveryTo={f.estimatedDeliveryTo}
                      note={f.note}
                      fulfilledItems={itemsForFulfillment(f)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Order Essentials */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-medium text-gray-800 mb-4">Order Essentials</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Shipping Mode</span>
                <span className="text-gray-800">{order.shippingMode?.name ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sub Total</span>
                <span>{money(currency, order.subTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{money(currency, order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{money(currency, order.total)}</span>
              </div>
              <p className="text-xs text-gray-400 pt-1">(Total includes shipping charges)</p>
            </div>
          </div>

          {/* Shipping address */}
          {shipping && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-medium text-gray-800 mb-3">Shipping Address</h2>
              <AddressBlock a={shipping} />
            </div>
          )}

          {/* Billing address */}
          {billing && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-medium text-gray-800 mb-3">Billing Address</h2>
              <AddressBlock a={billing} />
            </div>
          )}

          {/* Note */}
          {order.note && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-medium text-gray-800 mb-2">Note</h2>
              <p className="text-sm text-gray-600">{order.note}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
