"use client";

/**
 * OrderPricingManager — the "Adjust pricing" write surface for a custom order.
 *
 * Renders a button in the Pricing card header; opening it shows a modal editor
 * for the order's pricing adjustments. Mirrors live's adjust-custom-order-pricing
 * dialog + overview.performAdjustments, but with the anti-duplication fix:
 * edits are keyed by each row's real id — we PATCH changed rows, POST only
 * genuinely-new rows (no id yet) and DELETE only rows the user removed. We NEVER
 * blindly re-POST the whole array (that is what caused live's duplicate-row
 * pollution).
 *
 * The special "Wholesale Discount" (type-2) row is edited via its own field and
 * is EXCLUDED from the generic adjustment-line list (parity with live's
 * updateVisibleAdjustments) — but it is STILL subtracted inside adjustedTotal.
 *
 * After the row writes, we recompute adjustedTotal = total + Σ(type1 +amt /
 * type2 -amt) over the FINAL row set and persist it via PATCH update/custom-order
 * (the required follow-up call), then refresh the server-rendered detail.
 *
 * All writes go through /api/crud -> sandbox pg only (never live).
 */

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, Plus, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, FormField, TextInput, Select } from '@/components/ui';
import { formatMoney } from '@/lib/utils';
import type { CustomOrderDetail, CustomOrderAdjustment } from '@/lib/artisanflow-api';
import { crudWrite, computeAdjustedTotal, isWholesaleParticular, orderWriteCapability } from './crud';

interface Row {
  key: string;
  id: number; // 0 = new (not yet persisted)
  particular: string;
  adjustmentType: number; // 1 add, 2 subtract
  adjustmentAmount: number;
  currency: string;
}

let _uid = 0;
function nextKey(): string {
  _uid += 1;
  return 'r' + _uid;
}

export function OrderPricingManager({ order }: { order: CustomOrderDetail }) {
  // Adjustments and the adjusted total are order-level writes; /api/crud bands
  // both for a live-mirrored order, so the editor is not offered there.
  const write = orderWriteCapability(order.id);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ key: string; persisted: boolean } | null>(null);

  const all: CustomOrderAdjustment[] = useMemo(() => order.adjustments || [], [order.adjustments]);
  const originalWholesale = useMemo(() => all.find((a) => isWholesaleParticular(a.particular)) || null, [all]);
  const originalVisible = useMemo(() => all.filter((a) => !isWholesaleParticular(a.particular)), [all]);

  const [rows, setRows] = useState<Row[]>([]);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(false);
  const [wholesaleAmount, setWholesaleAmount] = useState('');

  const reset = () => {
    setRows(
      originalVisible.map((a) => ({
        key: nextKey(),
        id: a.id,
        particular: a.particular || '',
        adjustmentType: a.adjustmentType,
        adjustmentAmount: a.adjustmentAmount,
        currency: a.currency || order.currency,
      })),
    );
    setWholesaleEnabled(!!originalWholesale);
    setWholesaleAmount(originalWholesale ? String(originalWholesale.adjustmentAmount) : '');
    setError(null);
  };

  const openEditor = () => {
    reset();
    setOpen(true);
  };
  const close = () => {
    if (saving) return;
    setOpen(false);
  };

  const addRow = () =>
    setRows((r) => [
      ...r,
      { key: nextKey(), id: 0, particular: '', adjustmentType: 1, adjustmentAmount: 0, currency: order.currency },
    ]);

  const patchRow = (key: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const requestRemove = (row: Row) => {
    if (row.id > 0) setConfirmRemove({ key: row.key, persisted: true });
    else setRows((r) => r.filter((x) => x.key !== row.key));
  };
  const doRemove = () => {
    if (confirmRemove) setRows((r) => r.filter((x) => x.key !== confirmRemove.key));
    setConfirmRemove(null);
  };

  // Live preview of adjustedTotal (total is fixed; adjustments never change it).
  const previewAdjustedTotal = useMemo(() => {
    const set = rows.map((r) => ({ adjustmentType: r.adjustmentType, adjustmentAmount: Number(r.adjustmentAmount) || 0 }));
    if (wholesaleEnabled) set.push({ adjustmentType: 2, adjustmentAmount: Number(wholesaleAmount) || 0 });
    return computeAdjustedTotal(order.total, set);
  }, [rows, wholesaleEnabled, wholesaleAmount, order.total]);

  const doSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const finalVisible = rows.map((r) => ({ ...r, particular: r.particular.trim() }));

      // 1. DELETE removed persisted rows (original ids no longer present).
      const finalIds = new Set(finalVisible.filter((r) => r.id > 0).map((r) => r.id));
      for (const o of originalVisible) {
        if (o.id > 0 && !finalIds.has(o.id)) {
          await crudWrite('delete/custom-order-adjustment/' + o.id, 'DELETE');
        }
      }

      // 2. POST new rows / PATCH changed rows (keyed by real id).
      for (let i = 0; i < finalVisible.length; i++) {
        const r = finalVisible[i];
        const sortOrder = i + 1;
        const amount = Number(r.adjustmentAmount) || 0;
        if (r.id <= 0) {
          await crudWrite('add/custom-order-adjustment', 'POST', {
            customOrderId: order.id,
            particular: r.particular,
            adjustmentAmount: amount,
            adjustmentType: r.adjustmentType,
            currency: r.currency || order.currency,
            sortOrder,
          });
        } else {
          const o = originalVisible.find((x) => x.id === r.id);
          const changed =
            !o ||
            (o.particular || '').trim() !== r.particular ||
            o.adjustmentType !== r.adjustmentType ||
            o.adjustmentAmount !== amount ||
            (o.currency || order.currency) !== (r.currency || order.currency);
          if (changed) {
            await crudWrite('update/custom-order-adjustment', 'PATCH', {
              id: r.id,
              customOrderId: order.id,
              particular: r.particular,
              adjustmentAmount: amount,
              adjustmentType: r.adjustmentType,
              currency: r.currency || order.currency,
              sortOrder,
            });
          }
        }
      }

      // 3. Reconcile the single wholesale-discount row (untouched otherwise).
      const wsAmount = Number(wholesaleAmount) || 0;
      if (wholesaleEnabled) {
        if (originalWholesale) {
          if (originalWholesale.adjustmentAmount !== wsAmount) {
            await crudWrite('update/custom-order-adjustment', 'PATCH', {
              id: originalWholesale.id,
              customOrderId: order.id,
              particular: 'Wholesale Discount',
              adjustmentAmount: wsAmount,
              adjustmentType: 2,
              currency: originalWholesale.currency || order.currency,
              sortOrder: originalWholesale.sortOrder ?? 0,
            });
          }
        } else {
          await crudWrite('add/custom-order-adjustment', 'POST', {
            customOrderId: order.id,
            particular: 'Wholesale Discount',
            adjustmentAmount: wsAmount,
            adjustmentType: 2,
            currency: order.currency,
            sortOrder: 0,
          });
        }
      } else if (originalWholesale) {
        await crudWrite('delete/custom-order-adjustment/' + originalWholesale.id, 'DELETE');
      }

      // 4. Recompute adjustedTotal over the FINAL row set and PERSIST it (required
      //    follow-up: backend does NOT recompute adjustedTotal on adjustment writes).
      const finalSet = finalVisible.map((r) => ({
        adjustmentType: r.adjustmentType,
        adjustmentAmount: Number(r.adjustmentAmount) || 0,
      }));
      if (wholesaleEnabled) finalSet.push({ adjustmentType: 2, adjustmentAmount: wsAmount });
      const adjustedTotal = computeAdjustedTotal(order.total, finalSet);
      await crudWrite('update/custom-order', 'PATCH', { customOrderId: order.id, adjustedTotal });

      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openEditor} disabled={!write.ok} title={write.ok ? undefined : write.reason}>
        <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust pricing
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={close} />
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border bg-white shadow-2xl"
            style={{ borderColor: '#E8E4DE' }}
          >
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: '#E8E4DE' }}>
              <h3 className="font-serif text-base font-semibold" style={{ color: '#1A1714' }}>
                Adjust pricing · Order #{order.id}
              </h3>
              <button onClick={close} className="text-xl leading-none" style={{ color: '#847D77' }}>×</button>
            </div>

            <div className="px-5 pt-4">
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: '#FFF8F0', borderColor: '#FDE9C5', color: '#8A4C19' }}
              >
                Saves to the sandbox test DB only (never live).
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#847D77' }}>
                  Adjustment lines
                </p>
                <Button variant="ghost" size="sm" onClick={addRow}>
                  <Plus className="h-3.5 w-3.5" /> Add line
                </Button>
              </div>

              {rows.length === 0 && (
                <p className="mb-3 text-xs" style={{ color: '#AAA39E' }}>No adjustment lines. Add one above.</p>
              )}

              <div className="flex flex-col gap-2">
                {rows.map((r) => (
                  <div key={r.key} className="flex items-end gap-2">
                    <FormField label="Particular" className="flex-1">
                      <TextInput
                        value={r.particular}
                        placeholder="e.g. Shipping"
                        onChange={(e) => patchRow(r.key, { particular: e.target.value })}
                      />
                    </FormField>
                    <FormField label="Type" className="w-28">
                      <Select
                        value={r.adjustmentType}
                        options={[
                          { value: 1, label: '+ Add' },
                          { value: 2, label: '− Subtract' },
                        ]}
                        onChange={(e) => patchRow(r.key, { adjustmentType: Number(e.target.value) })}
                      />
                    </FormField>
                    <FormField label="Amount" className="w-28">
                      <TextInput
                        type="number"
                        step="any"
                        value={String(r.adjustmentAmount)}
                        onChange={(e) => patchRow(r.key, { adjustmentAmount: e.target.value === '' ? 0 : Number(e.target.value) })}
                      />
                    </FormField>
                    <button
                      type="button"
                      onClick={() => requestRemove(r)}
                      className="mb-1.5 rounded-md p-1.5 hover:bg-red-50"
                      style={{ color: '#AAA39E' }}
                      title="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Wholesale discount (special type-2 row, kept out of the line list) */}
              <div className="mt-5 rounded-lg border px-3 py-3" style={{ borderColor: '#E8E4DE', background: '#FAFAF8' }}>
                <label className="flex items-center gap-2 text-sm font-medium" style={{ color: '#4A4540' }}>
                  <input
                    type="checkbox"
                    checked={wholesaleEnabled}
                    onChange={(e) => setWholesaleEnabled(e.target.checked)}
                  />
                  Wholesale discount (subtracted; shown on its own line)
                </label>
                {wholesaleEnabled && (
                  <div className="mt-2 w-40">
                    <FormField label="Discount amount">
                      <TextInput
                        type="number"
                        step="any"
                        value={wholesaleAmount}
                        onChange={(e) => setWholesaleAmount(e.target.value)}
                      />
                    </FormField>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t pt-3" style={{ borderColor: '#E8E4DE' }}>
                <span className="text-sm" style={{ color: '#635D58' }}>New adjusted total</span>
                <span className="text-base font-semibold tabular-nums" style={{ color: '#A86120' }}>
                  {formatMoney(previewAdjustedTotal, order.currency)}
                </span>
              </div>
              <p className="mt-1 text-[11px]" style={{ color: '#AAA39E' }}>
                = total {formatMoney(order.total, order.currency)} ± adjustment lines (wholesale subtracted).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: '#E8E4DE' }}>
              {error && <span className="mr-auto text-xs" style={{ color: '#B91C1C' }}>{error}</span>}
              <Button variant="secondary" size="sm" onClick={close} disabled={saving}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={doSave} loading={saving} disabled={saving}>
                {saving ? 'Saving…' : 'Save pricing'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove adjustment line?"
        message="This line will be removed from the order when you save. The adjusted total will be recomputed."
        confirmLabel="Remove"
        danger
        onConfirm={doRemove}
        onCancel={() => setConfirmRemove(null)}
      />
    </>
  );
}
