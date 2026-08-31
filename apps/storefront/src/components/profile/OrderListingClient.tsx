'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export interface OrderListItem {
  orderId: number;
  createdAt: number;
  dispatchedOn?: number;
  trackingUrl?: string;
  estimatedDeliveryDate?: number;
  totalItemCount: number;
  processingItemCount?: number;
  readyItemCount?: number;
  dispatchedItemCount?: number;
  cancelledItemCount?: number;
  status: string;
  orderType: string; // 'ORDER' | 'CUSTOM_ORDER'
  loyaltyOrder?: boolean;
}

const MS_24H = 24 * 60 * 60 * 1000;

function formatDate(epochMs?: number): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    IN_TRANSIT: 'Partially Dispatched',
    CANCELLED: 'Cancelled',
    INITIATED: 'Initiated',
    PROCESSING: 'Processing',
    DELIVERED: 'Delivered',
    FAILED: 'Failed',
    PARTIALLY_DISPATCHED: 'Partially Dispatched',
    DISPATCHED: 'Dispatched',
  };
  return map[s] ?? s;
}

function statusColor(s: string): string {
  const map: Record<string, string> = {
    PROCESSING: 'text-[#BB955E]',
    DISPATCHED: 'text-[#52a183]',
    DELIVERED: 'text-[#52a183]',
    CANCELLED: 'text-[#AE3E39]',
    FAILED: 'text-[#AE3E39]',
    IN_TRANSIT: 'text-[#5950B7]',
    PARTIALLY_DISPATCHED: 'text-[#5950B7]',
    INITIATED: 'text-gray-600',
  };
  return map[s] ?? 'text-gray-600';
}

function pct(n: number | undefined, total: number): string {
  if (!n || !total) return '0';
  return ((n / total) * 100).toFixed(0);
}

// 4-step progress strip per order (Confirmed / Processing / Ready / Dispatched),
// mirrors live order-list-card.
function ProgressStrip({ item }: { item: OrderListItem }) {
  const total = item.totalItemCount || 1;
  const Step = ({
    label,
    count,
    accent,
  }: {
    label: string;
    count?: number;
    accent: string;
  }) => {
    const complete = count != null && count === item.totalItemCount && count > 0;
    const partial = count != null && count > 0 && count !== item.totalItemCount;
    return (
      <div className="bg-white rounded-md flex flex-col justify-center items-center py-1">
        <div className="p-1 flex justify-center items-center">
          {complete ? (
            <span className="text-[#52a183] material-symbols-outlined text-[18px]">check_circle</span>
          ) : partial ? (
            <span className="text-xs font-medium" style={{ color: accent }}>{pct(count, total)}%</span>
          ) : (
            <span className="material-symbols-outlined text-[18px] text-gray-300">radio_button_unchecked</span>
          )}
        </div>
        <p className={'text-xs ' + (complete ? 'text-[#52a183]' : partial ? '' : 'text-gray-400')} style={partial ? { color: accent } : undefined}>
          {label}
        </p>
      </div>
    );
  };

  return (
    <div className="shadow rounded-md m-2 p-2 grid grid-cols-4 gap-2">
      {/* Confirmed is always done for a non-cancelled order */}
      <div className="bg-white rounded-md flex flex-col justify-center items-center py-1">
        <div className="p-1 flex justify-center items-center">
          <span className="text-[#52a183] material-symbols-outlined text-[18px]">check_circle</span>
        </div>
        <p className="text-[#52a183] text-xs">Confirmed</p>
      </div>
      <Step label="Processing" count={item.processingItemCount} accent="#BB955E" />
      <Step label="Ready" count={item.readyItemCount} accent="#5950B7" />
      <Step label="Dispatched" count={item.dispatchedItemCount} accent="#52a183" />
    </div>
  );
}

function OrderCard({ item }: { item: OrderListItem }) {
  const isCustom = item.orderType === 'CUSTOM_ORDER';
  const url = isCustom ? 'custom-order' : 'order';
  const detailHref = '/profile/' + url + '/' + item.orderId;
  const cancellable =
    item.orderType === 'ORDER' && !item.dispatchedOn && item.status !== 'CANCELLED';
  const cancelDisabled = Date.now() - item.createdAt > MS_24H;

  return (
    <div className="text-xs sm:text-sm border border-gray-100 rounded-lg bg-white shadow-sm">
      {/* Header: type/badge + status */}
      <div className="flex justify-between items-center w-full bg-cream/80 shadow px-4 py-2 rounded-t-lg">
        <p className="font-semibold flex flex-wrap items-center gap-1">
          {isCustom && (
            <span className="flex items-center gap-0.5 text-xs text-[#7D5B20]">
              <span className="material-symbols-outlined text-[16px]">quick_reorder</span>
              Custom Order
            </span>
          )}
          {item.orderType === 'ORDER' && item.loyaltyOrder && (
            <span className="flex items-center gap-0.5 text-xs text-[#3a9173]">
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              Wholesale Program Order
            </span>
          )}
          {item.orderType === 'ORDER' && !item.loyaltyOrder && <span className="text-xs">Order</span>} #{item.orderId}
        </p>
        <p className={'font-medium ' + statusColor(item.status)}>
          {item.status === 'DISPATCHED' && item.dispatchedOn
            ? 'Dispatched On ' + formatDate(item.dispatchedOn)
            : statusLabel(item.status)}
        </p>
      </div>

      {/* Body */}
      <div className="flex justify-between items-start px-4 py-2 gap-2 mb-2">
        <Link href={detailHref} target="_blank" className="flex flex-col justify-center items-center gap-1.5">
          <span className="material-symbols-outlined text-[64px] text-[#B7A990] pt-2">package_2</span>
          <p>{item.totalItemCount} Item{item.totalItemCount > 1 ? 's' : ''}</p>
        </Link>
        <div className="flex flex-col gap-2">
          <p>Order Placed On: {formatDate(item.createdAt)}</p>
          <div className="flex flex-wrap justify-start items-center gap-2 mb-1 mt-1.5">
            {item.trackingUrl && /^https?:\/\//i.test(item.trackingUrl) && (
              <a href={item.trackingUrl} target="_blank" rel="nofollow" className="rounded-md bg-[#B7A990]/80 px-3 py-1.5">
                Track Order
              </a>
            )}
            <Link href={detailHref} target="_blank" className="rounded-md bg-cream border border-[#B7A990] px-3 py-1.5">
              View Order
            </Link>
            {cancellable && (
              <button
                disabled
                title={cancelDisabled ? 'Cancellation is disabled after 24 hours' : 'Order cancellation disabled in demo mode'}
                className={
                  'rounded-md bg-white shadow px-3 py-1.5 cursor-not-allowed ' + (cancelDisabled ? 'opacity-40' : 'opacity-70')
                }
              >
                Cancel Order
              </button>
            )}
          </div>
          <div className="text-xs">
            Estimated Delivery On: <span className="font-semibold">{formatDate(item.estimatedDeliveryDate)}</span>
          </div>
          {cancellable && cancelDisabled && (
            <div className="text-xs text-red-500 text-left w-full">Cancellation is disabled after 24 hours</div>
          )}
        </div>
      </div>

      {/* Progress strip / cancelled note */}
      {item.status !== 'CANCELLED' ? (
        <ProgressStrip item={item} />
      ) : (
        <div className="shadow rounded-md m-2 p-2 text-center text-gray-500">No updates available</div>
      )}
    </div>
  );
}

interface Props {
  orders: OrderListItem[];
}

export default function OrderListingClient({ orders }: Props) {
  // Live excludes FAILED + INITIATED, sorts newest first.
  const visible = useMemo(
    () =>
      orders
        .filter((o) => !['FAILED', 'INITIATED'].includes(o.status))
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders],
  );

  const activeOrders = visible.filter((o) => ['PROCESSING', 'IN_TRANSIT', 'PARTIALLY_DISPATCHED'].includes(o.status));
  const dispatchedOrders = visible.filter((o) => o.status === 'DISPATCHED');
  const cancelledOrders = visible.filter((o) => o.status === 'CANCELLED');

  const [tab, setTab] = useState<'ALL' | 'PROCESSING' | 'DISPATCHED' | 'CANCELLED'>('ALL');

  const filtered = useMemo(() => {
    if (tab === 'ALL') return [...activeOrders, ...dispatchedOrders, ...cancelledOrders];
    if (tab === 'PROCESSING')
      return visible.filter((o) => ['PROCESSING', 'IN_TRANSIT', 'INITIATED'].includes(o.status));
    return visible.filter((o) => o.status === tab);
  }, [tab, visible, activeOrders, dispatchedOrders, cancelledOrders]);

  const cards: Array<{
    key: typeof tab;
    count: number;
    label: string;
    iconBg: string;
    iconColor: string;
  }> = [
    { key: 'ALL', count: visible.length, label: 'Total Order', iconBg: '#EDF2FE', iconColor: '#5950B7' },
    { key: 'PROCESSING', count: activeOrders.length, label: 'Active Order', iconBg: '#FFFBE8', iconColor: '#BB955E' },
    { key: 'DISPATCHED', count: dispatchedOrders.length, label: 'Dispatched Order', iconBg: '#ECFDF5', iconColor: '#52a183' },
    { key: 'CANCELLED', count: cancelledOrders.length, label: 'Cancelled Order', iconBg: '#FEF6F6', iconColor: '#AE3E39' },
  ];

  return (
    <>
      <h3 className="text-2xl text-left mb-5 mt-1 font-semibold">Your Orders</h3>

      {visible.length >= 1 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 my-2 mb-7">
          {cards.map((c) => (
            <button
              key={c.key}
              onClick={() => setTab(c.key)}
              className={
                'bg-white cursor-pointer rounded-md border flex justify-start gap-2 md:gap-3 px-4 py-2 text-left ' +
                (tab === c.key ? 'border-[#D2BACA] border-2' : 'border-gray-100')
              }
            >
              <div className="rounded-full p-3 flex justify-center items-center" style={{ backgroundColor: c.iconBg }}>
                <span className="material-symbols-outlined" style={{ color: c.iconColor }}>package_2</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold">{c.count}</p>
                <p className="text-gray-500 text-xs">{c.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {filtered.length >= 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-8 lg:gap-y-5">
          {filtered.map((item) => (
            <OrderCard key={item.orderId} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-gray-100 px-5 py-16 text-center">
          <p className="text-gray-500">No order item has been found.</p>
          <Link href="/products/fabric" className="mt-4 inline-block rounded-md border border-[#B7A990] bg-cream px-5 py-2 text-sm font-medium text-gray-700 hover:bg-[#d6cab7] transition-colors">
            Browse Fabrics
          </Link>
        </div>
      )}
    </>
  );
}
