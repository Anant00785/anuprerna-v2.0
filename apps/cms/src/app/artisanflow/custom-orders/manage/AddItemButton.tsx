"use client";

/**
 * AddItemButton — add one or more items to an existing custom order.
 *
 * PATCH add/custom-order-items {orderId, customOrderItemList:[{price, quantity,
 * unit, currency, productGroup, orderType, amount, customization}]}. The BACKEND
 * appends the items and adds price*quantity to total/subTotal/adjustedTotal — the
 * client sends only the line fields and does NOT recompute the order totals
 * itself. Product is chosen from the sandbox custom-product catalogue.
 * All writes go through /api/crud -> sandbox pg only (never live).
 */

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button, FormField, TextInput, Select } from '@/components/ui';
import { crudWrite, orderWriteCapability } from './crud';

export interface ProductLite {
  id: number;
  name: string;
  sku: string;
  price: number;
  productGroup: string;
  unit: string;
  heroImage: string;
}

export function AddItemButton({
  orderId,
  currency,
  orderType,
  products,
}: {
  orderId: number;
  currency: string;
  orderType: string;
  products: ProductLite[];
}) {
  const router = useRouter();
  const write = orderWriteCapability(orderId);
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = useMemo(() => products.find((p) => String(p.id) === productId) || null, [products, productId]);

  const onSelectProduct = (id: string) => {
    setProductId(id);
    const p = products.find((x) => String(x.id) === id);
    if (p && price === '') setPrice(String(p.price ?? 0));
  };

  const reset = () => { setProductId(''); setPrice(''); setQty('1'); setError(null); };

  const doSave = async () => {
    if (!product) { setError('Choose a product.'); return; }
    setSaving(true);
    setError(null);
    try {
      const p = Number(price);
      const q = Number(qty);
      // amount is cosmetic on the item row; the backend recomputes order totals
      // from mulDec(price, quantity) itself, so this value never drives the math.
      const amount = Math.round(p * q * 1e6) / 1e6;
      await crudWrite('add/custom-order-items', 'PATCH', {
        orderId,
        customOrderItemList: [
          {
            price: p,
            quantity: q,
            amount,
            unit: product.unit,
            currency,
            orderType,
            productGroup: product.productGroup,
            customization: {
              customProduct: { id: product.id, name: product.name, sku: product.sku, heroImage: product.heroImage },
            },
          },
        ],
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Add failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => { reset(); setOpen(true); }}
        disabled={!write.ok}
        title={write.ok ? undefined : write.reason}
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => !saving && setOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border bg-white shadow-2xl" style={{ borderColor: '#E8E4DE' }}>
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: '#E8E4DE' }}>
              <h3 className="font-serif text-base font-semibold" style={{ color: '#1A1714' }}>Add item · Order #{orderId}</h3>
              <button onClick={() => !saving && setOpen(false)} className="text-xl leading-none" style={{ color: '#847D77' }}>×</button>
            </div>
            <div className="flex flex-col gap-3 px-5 py-4">
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: '#FFF8F0', borderColor: '#FDE9C5', color: '#8A4C19' }}
              >
                Saves to the sandbox test DB only (never live). Totals recompute automatically.
              </div>
              <FormField label="Product" required>
                <Select
                  value={productId}
                  placeholder="Choose a custom product…"
                  options={products.map((p) => ({ value: p.id, label: p.name + (p.sku ? ' · ' + p.sku : '') + ' (' + p.productGroup + ')' }))}
                  onChange={(e) => onSelectProduct(e.target.value)}
                />
              </FormField>
              <div className="flex gap-3">
                <FormField label={'Price (' + currency + ')'} className="flex-1">
                  <TextInput type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
                </FormField>
                <FormField label={'Quantity' + (product ? ' (' + product.unit + ')' : '')} className="flex-1">
                  <TextInput type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
                </FormField>
              </div>
              <p className="text-xs" style={{ color: '#847D77' }}>
                Line amount: {(Number(price) || 0) * (Number(qty) || 0)} {currency}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: '#E8E4DE' }}>
              {error && <span className="mr-auto text-xs" style={{ color: '#B91C1C' }}>{error}</span>}
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={doSave} loading={saving} disabled={saving || !product || price === '' || qty === ''}>
                {saving ? 'Adding…' : 'Add item'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
