"use client";

/**
 * ConfirmDialog — shared centered confirm modal for destructive row actions
 * (primarily row-delete). Reusable across any list page: pass open/title/
 * message and let the caller drive the async action + error state.
 *
 * Usage pattern (see SimpleItemCrud.tsx):
 *   const [confirmDelete, setConfirmDelete] = useState<{id, name} | null>(null);
 *   <ConfirmDialog
 *     open={!!confirmDelete}
 *     title={`Delete ${entitySingular}?`}
 *     message={`"${confirmDelete?.name}" will be permanently removed. This cannot be undone.`}
 *     confirmLabel="Delete"
 *     danger
 *     loading={deleting}
 *     error={deleteError}
 *     onConfirm={doDelete}
 *     onCancel={() => setConfirmDelete(null)}
 *   />
 */

import React from "react";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button as destructive (red). Default true. */
  danger?: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-xl border bg-white shadow-2xl"
        style={{ borderColor: "#E8E4DE" }}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="px-5 pt-5 pb-2">
          <h3
            className="font-serif text-base font-semibold"
            style={{ color: "#1A1714" }}
          >
            {title}
          </h3>
          {message && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "#635D58" }}>
              {message}
            </p>
          )}
        </div>

        {error && (
          <div className="mx-5 mb-2 rounded-lg border px-3 py-2 text-xs" style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}>
            {error}
          </div>
        )}

        <div
          className="flex items-center justify-end gap-3 border-t px-5 py-3"
          style={{ borderColor: "#E8E4DE" }}
        >
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
