"use client";

/**
 * ItemActions — per-item Edit (price/quantity) + Delete for a custom order.
 *
 * Edit  -> PATCH update/custom-order-item {orderItemId, price, quantity}.
 * Delete -> DELETE delete/custom-order-item/{orderItemId} (ConfirmDialog first).
 *
 * The BACKEND deltas total/subTotal/adjustedTotal by exactly new(price*qty) −
 * old(price*qty) (add) or −price*qty (delete), so the client does NOT recompute
 * any total here — it just refreshes the server-rendered detail after the write.
 * All writes go through /api/crud -> sandbox pg only (never live).
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, FormField, TextInput } from '@/components/ui';
import type { CustomOrderItem } from '@/lib/artisanflow-api';
import { crudWrite, orderWriteCapability } from './crud';

export function ItemActions({ item, currency, orderId }: { item: CustomOrderItem; currency: string; orderId: number }) {
  const router = useRouter();
  // Live-mirrored order -> the pencil and the trash are not offered. See
  // orderWriteCapability; /api/crud refuses these two paths regardless.
  const write = orderWriteCapability(orderId);
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(item.price ?? 0));
  const [qty, setQty] = useState(String(item.quantity ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openEdit = () => {
    setPrice(String(item.price ?? 0));
    setQty(String(item.quantity ?? 0));
    setError(null);
    setEditing(true);
  };

  const doSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await crudWrite('update/custom-order-item', 'PATCH', {
        orderItemId: item.id,
        price: Number(price),
        quantity: Number(qty),
      });
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await crudWrite('delete/custom-order-item/' + item.id, 'DELETE');
      setConfirmDelete(false);
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={openEdit}
        disabled={!write.ok}
        className="rounded-md p-1.5 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        style={{ color: '#847D77' }}
        title={write.ok ? 'Edit price / quantity' : write.reason}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => { setDeleteError(null); setConfirmDelete(true); }}
        disabled={!write.ok}
        className="rounded-md p-1.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        style={{ color: '#AAA39E' }}
        title={write.ok ? 'Delete item' : write.reason}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => !saving && setEditing(false)} />
          <div className="relative w-full max-w-sm rounded-xl border bg-white shadow-2xl" style={{ borderColor: '#E8E4DE' }}>
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: '#E8E4DE' }}>
              <h3 className="font-serif text-base font-semibold" style={{ color: '#1A1714' }}>Edit item #{item.id}</h3>
              <button onClick={() => !saving && setEditing(false)} className="text-xl leading-none" style={{ color: '#847D77' }}>×</button>
            </div>
            <div className="flex flex-col gap-3 px-5 py-4">
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: '#FFF8F0', borderColor: '#FDE9C5', color: '#8A4C19' }}
              >
                Saves to the sandbox test DB only (never live). Totals recompute automatically.
              </div>
              <FormField label={'Price (' + (item.currency || currency) + ')'}>
                <TextInput type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
              </FormField>
              <FormField label={'Quantity (' + item.unit + ')'}>
                <TextInput type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: '#E8E4DE' }}>
              {error && <span className="mr-auto text-xs" style={{ color: '#B91C1C' }}>{error}</span>}
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={doSave} loading={saving} disabled={saving || price === '' || qty === ''}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete item?"
        message="This item will be removed and the order totals reduced by its price × quantity. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
