import { cookies } from 'next/headers';
import Link from 'next/link';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import ProductionUpdates, { OrderwiseWorkflow } from '@/components/profile/ProductionUpdates';
import ShipmentCard, { FulfilledItemSummary } from '@/components/profile/ShipmentCard';

export const metadata = {
  title: 'Custom Order | Anuprerna',
  robots: { index: false, follow: false },
};

function formatDate(epochMs?: number): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function money(currency: string, value?: number): string {
  return (currency ? currency + ' ' : '') + (value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

interface Adjustment {
  adjustmentType: number; // 1 = +, else -
  particular: string;
  adjustmentAmount: number;
  currency: string;
  sortOrder: number;
}

interface CustomOrderItem {
  id?: number;
  orderType: string;
  orderStatus?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  currency?: string;
  shippingCode?: string;
  trackingUrl?: string;
  dispatchedOn?: number;
  estimatedDeliveryFrom?: number;
  estimatedDeliveryTo?: number;
  updatedAt?: number;
  hasWorkflow?: boolean;
  customization?: {
    customProduct?: { name?: string; sku?: string; heroImage?: string };
    fabricProductPreview?: { product?: { name?: string; sku?: string; heroImage?: string } };
    finishedProductPreview?: { product?: { name?: string; sku?: string; heroImage?: string } };
  };
}

interface CustomOrderItemFulfillment {
  customOrderItemId: number;
  quantity: number;
  unit: string;
}

interface CustomOrderFulfillment {
  id?: number;
  shippingCode?: string;
  trackingUrl?: string;
  dispatchedOn?: number;
  estimatedDeliveryFrom?: number;
  estimatedDeliveryTo?: number;
  note?: string;
  customOrderItemFulfillmentList?: CustomOrderItemFulfillment[];
}

interface CustomOrder {
  id?: number;
  currency?: string;
  subTotal?: number;
  adjustedTotal?: number;
  createdAt?: number;
  loyaltyOrder?: boolean;
  loyaltyDiscountAmount?: number;
  note?: string;
  adjustments?: Adjustment[];
  orderItems?: CustomOrderItem[];
}

function itemMeta(it: CustomOrderItem) {
  const c = it.customization ?? {};
  const p = c.customProduct ?? c.fabricProductPreview?.product ?? c.finishedProductPreview?.product ?? {};
  return { name: p.name ?? 'Custom Item', sku: p.sku, heroImage: p.heroImage };
}

export default async function CustomOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let order: CustomOrder | null = null;
  let fulfillments: CustomOrderFulfillment[] = [];
  let error = '';
  try {
    const [orderRes, fulfillRes] = await Promise.allSettled([
      loomGet<{ order?: CustomOrder }>('/get/customer/custom-order/' + id, { token }),
      loomGet<{ customOrderFulfillmentList?: CustomOrderFulfillment[] } | CustomOrderFulfillment[]>(
        '/get/customer/custom-order/' + id + '/fulfillment-list',
        { token },
      ),
    ]);
    if (orderRes.status === 'fulfilled') order = orderRes.value?.order ?? null;
    if (fulfillRes.status === 'fulfilled') {
      const v = fulfillRes.value as { customOrderFulfillmentList?: CustomOrderFulfillment[] } | CustomOrderFulfillment[];
      fulfillments = Array.isArray(v) ? v : v?.customOrderFulfillmentList ?? [];
    }
    if (!order) error = 'Custom order not found.';
  } catch {
    error = 'Failed to load custom order details.';
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-16 text-center">
        <p className="text-gray-500">{error || 'Custom order not found.'}</p>
        <Link href="/profile/order" className="mt-4 inline-block text-sm text-clay hover:underline">Back to orders</Link>
      </div>
    );
  }

  const currency = order.currency ?? '';
  const adjustments = (order.adjustments ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const items = (order.orderItems ?? []).slice().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  const madeToOrder = items.filter((i) => i.orderType === 'MADE_TO_ORDER');
  const headItem = madeToOrder[0];

  // Fetch the production workflow for each made-to-order item that has one.
  // Mirrors the live per-item GET /get/custom-order/{orderId}/workflow/{itemId}.
  const workflowEntries = await Promise.all(
    madeToOrder.map(async (it) => {
      if (!it.id || !it.hasWorkflow) return [it.id ?? -1, null] as const;
      try {
        const res = await loomGet<{ orderwiseWorkflow?: OrderwiseWorkflow }>(
          '/get/custom-order/' + id + '/workflow/' + it.id,
          { token },
        );
        const wf = res?.orderwiseWorkflow ?? null;
        if (wf?.steps?.length) {
          // Order steps by the linked-list (previousStepElementId), like live does.
          wf.steps = [...wf.steps].sort((a, b) =>
            (a.previousStepElementId ?? '') > (b.previousStepElementId ?? '') ? 1 : -1,
          );
          // Derive per-step progress: COMPLETED sub = 1, IN_PROGRESS = 0.4.
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
        return [it.id, wf] as const;
      } catch {
        return [it.id, null] as const;
      }
    }),
  );
  const workflowByItem = new Map<number, OrderwiseWorkflow | null>(workflowEntries);

  // Map a fulfillment's item list to display summaries (name — qty unit).
  function itemsForFulfillment(f: CustomOrderFulfillment): FulfilledItemSummary[] {
    return (f.customOrderItemFulfillmentList ?? [])
      .map((line) => {
        const it = items.find((o) => o.id === line.customOrderItemId);
        if (!it) return null;
        const name = itemMeta(it).name;
        return name ? { name, quantity: line.quantity, unit: line.unit } : null;
      })
      .filter((x): x is FulfilledItemSummary => x !== null);
  }

  const OrderEssentials = () => (
    <div className="px-3 py-5 rounded-md bg-[#E0DEE4] flex flex-col justify-start items-start gap-2 w-full">
      <h5 className="font-semibold">Order Essentials</h5>
      <div className="w-full text-sm">
        <div className="flex justify-between items-center w-full">
          <span>Shipping Mode: </span>
          <span>N/A</span>
        </div>
        <div className="flex justify-between items-center w-full">
          <span>Sub Total:</span>
          <span>{money(currency, order!.subTotal)}</span>
        </div>
        {adjustments.map((adj, i) => (
          <div key={i} className="flex justify-between items-center w-full">
            <span>{adj.particular}: </span>
            <span>{adj.adjustmentType === 1 ? '+' : '-'} {money(adj.currency, adj.adjustmentAmount)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center w-full">
          <span className="font-bold">Total:</span>
          <span>{money(currency, order!.adjustedTotal)}</span>
        </div>
        <div className="text-xs mt-0.5">(Total includes shipping charges)</div>
      </div>
    </div>
  );

  return (
    <>
      <meta name="robots" content="noindex" />

      <div className="w-full flex flex-col justify-start items-start">
        <h3 className="w-full text-2xl mb-4 flex items-center gap-2 text-clay">
          <span className="material-symbols-outlined">quick_reorder</span>
          Custom Order Details
        </h3>
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex flex-col md:flex-row gap-2 justify-center items-start">
            <h4>Ordered on <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span></h4>
            <span className="hidden md:block">|</span>
            <h4>Order <span className="font-medium text-gray-900">#{order.id ?? id}</span></h4>
          </div>
          <div className="flex justify-center items-center gap-2">
            <h4>TOTAL</h4>
            <div className="font-medium text-gray-900">{money(currency, order.adjustedTotal)}</div>
          </div>
        </div>
      </div>

      <section className="flex flex-col lg:flex-row justify-between items-stretch w-full mt-5 gap-4">
        <div className="gap-3 flex flex-col justify-start items-start lg:flex-[70%] w-full">
          {/* Wholesale banner */}
          {order.loyaltyOrder && (
            <div className="w-full text-sm p-4 rounded-lg border-l-4 border-l-[#3a9173] bg-[#E8F0ED]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#3a9173]">workspace_premium</span>
                <div>
                  <p className="font-semibold text-[#3a9173] text-lg">Wholesale Program Order</p>
                  {order.loyaltyDiscountAmount ? (
                    <p className="text-[#3a9173] text-sm">
                      You saved <span className="font-bold">{money(currency, order.loyaltyDiscountAmount)}</span> with wholesale partner discount.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Made To Order section */}
          {madeToOrder.length > 0 && (
            <div className="w-full flex flex-col justify-start items-start gap-2 rounded-md bg-cream px-4 pb-4">
              <div className="w-full flex flex-row justify-between items-start mt-3">
                <h5 className="text-lg">Made To Order</h5>
                {headItem?.orderStatus && (
                  <p className={'text-sm md:text-base font-medium ' + statusColor(headItem.orderStatus)}>
                    {ITEM_STATUS_LABEL[headItem.orderStatus] ?? headItem.orderStatus}
                  </p>
                )}
              </div>

              {/* Shipments (grouped) — or flat tracking row when none exist */}
              {fulfillments.length > 0 ? (
                <div className="w-full flex flex-col items-start pb-4 gap-3">
                  {fulfillments.map((f, i) => (
                    <ShipmentCard
                      key={f.id ?? i}
                      index={i}
                      shippingCode={f.shippingCode}
                      trackingUrl={f.trackingUrl}
                      dispatchedOn={f.dispatchedOn}
                      estimatedDeliveryFrom={f.estimatedDeliveryFrom}
                      estimatedDeliveryTo={f.estimatedDeliveryTo}
                      note={f.note}
                      fulfilledItems={itemsForFulfillment(f)}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full flex flex-col md:flex-row justify-between items-start pb-2">
                  <div className="flex flex-col items-start justify-start text-sm gap-0.5">
                    {headItem?.shippingCode && <p>Tracking Code: <span className="font-medium text-gray-900">{headItem.shippingCode}</span></p>}
                    {headItem?.dispatchedOn ? <p>Dispatched On: <span className="font-medium text-gray-900">{formatDate(headItem.dispatchedOn)}</span></p> : null}
                    {headItem?.estimatedDeliveryTo ? <p>Estimated Delivery: <span className="font-medium text-gray-900">{formatDate(headItem.estimatedDeliveryTo)}</span></p> : null}
                  </div>
                  {headItem?.trackingUrl && (
                    <a href={headItem.trackingUrl} target="_blank" rel="nofollow" className="rounded-md bg-[#93805e] text-white px-3 py-1.5 mt-3 text-sm">
                      Track Order
                    </a>
                  )}
                </div>
              )}

              <div className="w-full flex flex-col gap-6 mb-3">
                {madeToOrder.map((item, idx) => {
                  const meta = itemMeta(item);
                  const wf = item.id != null ? workflowByItem.get(item.id) ?? null : null;
                  return (
                    <div key={item.id ?? idx} className="flex flex-col gap-3">
                      <div className="flex gap-4 items-start bg-white rounded-md p-3 border border-gray-100">
                        {meta.heroImage && (
                          <img src={meta.heroImage} alt={meta.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm">{meta.name}</p>
                          {meta.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {meta.sku}</p>}
                          <p className="text-xs text-gray-500 mt-1">{item.quantity} {item.unit}</p>
                        </div>
                        <div className="text-right flex-shrink-0 text-sm font-medium text-gray-800">
                          {money(item.currency ?? currency, (item.price ?? 0) * (item.quantity ?? 0))}
                        </div>
                      </div>
                      {/* Production Updates timeline */}
                      {item.hasWorkflow && wf?.workflowId && (
                        <ProductionUpdates workflow={wf} orderStatus={item.orderStatus} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Note */}
          {order.note && (
            <>
              <h5 className="font-semibold">Order Note</h5>
              <div className="w-full text-sm rounded-md bg-cream p-3">{order.note}</div>
            </>
          )}
        </div>

        {/* Order Essentials (sidebar) */}
        <div className="lg:flex-[30%] w-full">
          <div className="max-w-[320px] w-full my-1">
            <OrderEssentials />
          </div>
        </div>
      </section>
    </>
  );
}
