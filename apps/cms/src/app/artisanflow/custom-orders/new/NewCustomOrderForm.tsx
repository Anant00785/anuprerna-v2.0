"use client";

/**
 * NewCustomOrderForm — create a custom order (customer + order items + submit).
 *
 * POST add/custom-order with {tenantId, currency, orderType, loyaltyOrder,
 * createdAt, total, subTotal, adjustedTotal, orderItems:[...]}. This SETS the
 * pricing baseline: per item amount = price*quantity; total = subTotal =
 * Σ(amount); adjustedTotal = total (no adjustments, no currency conversion at
 * create). All figures are computed client-side with exact fixed-decimal math.
 * The write goes through /api/crud -> sandbox pg only (never live).
 */

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button, FormField, TextInput, Select } from '@/components/ui';
import { formatMoney } from '@/lib/utils';
import { crudWrite, exactSum } from '../manage/crud';
import type { ProductLite } from '../manage/AddItemButton';

export interface CustomerLite {
  tenantId: number;
  userName: string;
  email: string;
  isActiveLoyaltyUser: boolean;
}

interface ItemRow {
  key: string;
  productId: string;
  price: string;
  quantity: string;
}

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD'];

let _uid = 0;
const nextKey = () => 'i' + (++_uid);

function toEpoch(dateStr: string): number {
  if (!dateStr) return 0;
  const t = new Date(dateStr + 'T00:00:00Z').getTime();
  return isNaN(t) ? 0 : t;
}

export function NewCustomOrderForm({
  customers,
  products,
}: {
  customers: CustomerLite[];
  products: ProductLite[];
}) {
  const router = useRouter();

  const [customerFilter, setCustomerFilter] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [orderType, setOrderType] = useState('FABRIC');
  const [loyaltyOrder, setLoyaltyOrder] = useState(false);
  const [deliveryFrom, setDeliveryFrom] = useState('');
  const [deliveryTo, setDeliveryTo] = useState('');
  const [rows, setRows] = useState<ItemRow[]>([{ key: nextKey(), productId: '', price: '', quantity: '1' }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    const q = customerFilter.trim().toLowerCase();
    const list = q
      ? customers.filter((c) => (c.userName || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q))
      : customers;
    return list.slice(0, 300);
  }, [customers, customerFilter]);

  const productById = useMemo(() => {
    const m = new Map<string, ProductLite>();
    for (const p of products) m.set(String(p.id), p);
    return m;
  }, [products]);

  const addRow = () => setRows((r) => [...r, { key: nextKey(), productId: '', price: '', quantity: '1' }]);
  const removeRow = (key: string) => setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  const patchRow = (key: string, patch: Partial<ItemRow>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const onSelectProduct = (key: string, id: string) => {
    const p = productById.get(id);
    patchRow(key, { productId: id, price: p ? String(p.price ?? 0) : '' });
  };

  const lineAmount = (r: ItemRow) => {
    const p = Number(r.price) || 0;
    const q = Number(r.quantity) || 0;
    return Math.round(p * q * 1e6) / 1e6;
  };
  const subTotal = useMemo(() => exactSum(rows.map(lineAmount)), [rows]);

  const canSubmit =
    !!tenantId &&
    rows.length > 0 &&
    rows.every((r) => r.productId && r.price !== '' && r.quantity !== '' && Number(r.quantity) > 0);

  const onSelectCustomer = (id: string) => {
    setTenantId(id);
    const c = customers.find((x) => String(x.tenantId) === id);
    if (c) setLoyaltyOrder(!!c.isActiveLoyaltyUser);
  };

  const doSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const from = toEpoch(deliveryFrom);
      const to = toEpoch(deliveryTo);
      const orderItems = rows.map((r) => {
        const p = productById.get(r.productId)!;
        const price = Number(r.price);
        const quantity = Number(r.quantity);
        return {
          price,
          quantity,
          amount: lineAmount(r),
          unit: p.unit,
          currency,
          orderType,
          productGroup: p.productGroup,
          estimatedDeliveryFrom: from,
          estimatedDeliveryTo: to,
          customization: { customProduct: { id: p.id, name: p.name, sku: p.sku, heroImage: p.heroImage } },
        };
      });
      const total = subTotal;
      await crudWrite('add/custom-order', 'POST', {
        tenantId: Number(tenantId),
        currency,
        orderType,
        loyaltyOrder,
        createdAt: Date.now(),
        estimatedDeliveryFrom: from,
        estimatedDeliveryTo: to,
        total,
        subTotal,
        adjustedTotal: total,
        orderItems,
      });
      router.push('/artisanflow/custom-orders');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold" style={{ color: '#1A1714' }}>New custom order</h1>
        <p className="mt-1 text-sm" style={{ color: '#847D77' }}>
          Capture the customer and order items. Saves to the sandbox test DB only (never live).
        </p>
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: '#E8E4DE' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#847D77' }}>Customer &amp; order</p>
        <div className="flex flex-col gap-4">
          <FormField label="Find customer" hint="Filter by name or email, then select below.">
            <TextInput value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} placeholder="Search name or email…" />
          </FormField>
          <FormField label="Customer" required>
            <Select
              value={tenantId}
              placeholder="Select a customer…"
              options={filteredCustomers.map((c) => ({ value: c.tenantId, label: (c.userName || 'Customer') + (c.email ? ' · ' + c.email : '') + (c.isActiveLoyaltyUser ? ' · wholesale' : '') }))}
              onChange={(e) => onSelectCustomer(e.target.value)}
            />
          </FormField>
          <div className="flex flex-wrap gap-4">
            <FormField label="Currency" className="w-32">
              <Select value={currency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} onChange={(e) => setCurrency(e.target.value)} />
            </FormField>
            <FormField label="Order type" className="w-40">
              <Select value={orderType} options={[{ value: 'FABRIC', label: 'Fabric' }, { value: 'FINISHED', label: 'Finished' }]} onChange={(e) => setOrderType(e.target.value)} />
            </FormField>
            <FormField label="Est. delivery from" className="w-44">
              <TextInput type="date" value={deliveryFrom} onChange={(e) => setDeliveryFrom(e.target.value)} />
            </FormField>
            <FormField label="Est. delivery to" className="w-44">
              <TextInput type="date" value={deliveryTo} onChange={(e) => setDeliveryTo(e.target.value)} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: '#4A4540' }}>
            <input type="checkbox" checked={loyaltyOrder} onChange={(e) => setLoyaltyOrder(e.target.checked)} />
            Wholesale / loyalty order
          </label>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: '#E8E4DE' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#847D77' }}>Order items</p>
          <Button variant="ghost" size="sm" onClick={addRow}><Plus className="h-3.5 w-3.5" /> Add item</Button>
        </div>
        <div className="flex flex-col gap-3">
          {rows.map((r) => {
            const p = productById.get(r.productId);
            return (
              <div key={r.key} className="flex items-end gap-2">
                <FormField label="Product" className="flex-1" required>
                  <Select
                    value={r.productId}
                    placeholder="Choose a product…"
                    options={products.map((pp) => ({ value: pp.id, label: pp.name + (pp.sku ? ' · ' + pp.sku : '') + ' (' + pp.productGroup + ')' }))}
                    onChange={(e) => onSelectProduct(r.key, e.target.value)}
                  />
                </FormField>
                <FormField label={'Price (' + currency + ')'} className="w-28">
                  <TextInput type="number" step="any" value={r.price} onChange={(e) => patchRow(r.key, { price: e.target.value })} />
                </FormField>
                <FormField label={'Qty' + (p ? ' (' + p.unit + ')' : '')} className="w-24">
                  <TextInput type="number" step="any" value={r.quantity} onChange={(e) => patchRow(r.key, { quantity: e.target.value })} />
                </FormField>
                <button type="button" onClick={() => removeRow(r.key)} className="mb-1.5 rounded-md p-1.5 hover:bg-red-50" style={{ color: '#AAA39E' }} title="Remove item">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: '#E8E4DE' }}>
          <span className="text-sm font-semibold" style={{ color: '#1A1714' }}>Subtotal / Total</span>
          <span className="text-base font-semibold tabular-nums" style={{ color: '#A86120' }}>{formatMoney(subTotal, currency)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {error && <span className="mr-auto text-xs" style={{ color: '#B91C1C' }}>{error}</span>}
        <Button variant="secondary" size="sm" onClick={() => router.push('/artisanflow/custom-orders')} disabled={saving}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={doSubmit} loading={saving} disabled={!canSubmit || saving}>
          {saving ? 'Creating…' : 'Create order'}
        </Button>
      </div>
    </div>
  );
}
