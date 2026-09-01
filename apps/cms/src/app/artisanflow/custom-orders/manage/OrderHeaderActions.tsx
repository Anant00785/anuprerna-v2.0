"use client";

/**
 * OrderHeaderActions — order-level writes shown in the detail header.
 *
 *   Cancel order -> DELETE cancel/custom-order {orderId, cancellationReason}
 *                   (moves the order to CANCELLED; needs a reason).
 *   Delete order -> DELETE delete/custom-order/{orderId}
 *                   (hard delete; backend only permits INITIATED/FAILED orders).
 *
 * Both go through /api/crud -> sandbox pg only (never live). On delete we
 * navigate back to the list; on cancel we refresh the detail in place.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, FormField, Textarea } from '@/components/ui';
import { crudWrite, orderWriteCapability } from './crud';

export function OrderHeaderActions({ orderId }: { orderId: number }) {
  const router = useRouter();
  const write = orderWriteCapability(orderId);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const doCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await crudWrite('cancel/custom-order', 'DELETE', { orderId, cancellationReason: reason.trim() });
      setCancelOpen(false);
      router.refresh();
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await crudWrite('delete/custom-order/' + orderId, 'DELETE');
      setDeleteOpen(false);
      router.push('/artisanflow/custom-orders');
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="danger"
        size="sm"
        onClick={() => { setReason(''); setCancelError(null); setCancelOpen(true); }}
        disabled={!write.ok}
        title={write.ok ? undefined : write.reason}
      >
        <XCircle className="h-3.5 w-3.5" /> Cancel order
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => { setDeleteError(null); setDeleteOpen(true); }}
        disabled={!write.ok}
        title={write.ok ? undefined : write.reason}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </Button>

      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => !cancelling && setCancelOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl border bg-white shadow-2xl" style={{ borderColor: '#E8E4DE' }}>
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: '#E8E4DE' }}>
              <h3 className="font-serif text-base font-semibold" style={{ color: '#1A1714' }}>Cancel order #{orderId}</h3>
              <button onClick={() => !cancelling && setCancelOpen(false)} className="text-xl leading-none" style={{ color: '#847D77' }}>×</button>
            </div>
            <div className="flex flex-col gap-3 px-5 py-4">
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: '#FFF8F0', borderColor: '#FDE9C5', color: '#8A4C19' }}
              >
                Saves to the sandbox test DB only (never live).
              </div>
              <FormField label="Cancellation reason">
                <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this order being cancelled?" />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: '#E8E4DE' }}>
              {cancelError && <span className="mr-auto text-xs" style={{ color: '#B91C1C' }}>{cancelError}</span>}
              <Button variant="secondary" size="sm" onClick={() => setCancelOpen(false)} disabled={cancelling}>Back</Button>
              <Button variant="danger" size="sm" onClick={doCancel} loading={cancelling} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel order'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title={'Delete order #' + orderId + '?'}
        message="This permanently removes the custom order from the sandbox database. The backend only allows deleting orders still in INITIATED / FAILED state."
        confirmLabel="Delete order"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={doDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
