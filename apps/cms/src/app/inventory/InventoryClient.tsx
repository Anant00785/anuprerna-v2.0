"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, Badge, DataListColumn, Card, CardHeader, CardTitle, Button, FormField, TextInput, Select, Textarea, ConfirmDialog } from "@/components/ui";
import type {
  InventoryAdjustmentLite,
  InventoryAdjustmentReason,
  OOSRequest,
  WarehouseItem,
  InventoryAdjustmentDetail,
} from "@/lib/api";

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** Shared /api/crud write helper. Returns {ok, message}. */
async function crudWrite(path: string, method: string, body?: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, method, body }),
    });
    const j = await res.json().catch(() => ({}));
    const ok = res.ok && j?.success !== false;
    return { ok, message: j?.message || (ok ? "" : `Request failed (${res.status})`) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Request failed" };
  }
}

const RESTOCK_STATUSES = ["PENDING", "PARTIALLY_FULFILLED", "FULFILLED", "CONVERTED"] as const;

// ── Sub-views ──────────────────────────────────────────────────────────────

interface AdjustmentItemDraft {
  productId: string;
  quantityAtHand: string;
  quantityAvailable: string;
  quantityAdjusted: string;
}

function blankItem(): AdjustmentItemDraft {
  return { productId: "", quantityAtHand: "", quantityAvailable: "", quantityAdjusted: "" };
}

function NewAdjustmentDrawer({
  warehouses, reasons, onClose,
}: {
  warehouses: WarehouseItem[];
  reasons: InventoryAdjustmentReason[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0] ? String(warehouses[0].id) : "");
  const [reasonId, setReasonId] = useState<string>(reasons[0] ? String(reasons[0].id) : "");
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<AdjustmentItemDraft[]>([blankItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchItem = (i: number, patch: Partial<AdjustmentItemDraft>) =>
    setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems((cur) => cur.filter((_, idx) => idx !== i));

  const valid = warehouseId && reasonId && items.some((it) => it.productId.trim());

  const doSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    const adjustmentItemList = items
      .filter((it) => it.productId.trim())
      .map((it) => ({
        productId: Number(it.productId),
        quantityAtHand: Number(it.quantityAtHand) || 0,
        quantityAvailable: Number(it.quantityAvailable) || 0,
        quantityAdjusted: Number(it.quantityAdjusted) || 0,
      }));
    const { ok, message } = await crudWrite("add/inventory-adjustment", "POST", {
      warehouseId: Number(warehouseId),
      reasonId: Number(reasonId),
      referenceNo,
      description,
      adjustmentDate: Date.now(),
      adjustmentItemList,
    });
    setSaving(false);
    if (!ok) { setError(message || "Save failed"); return; }
    onClose();
    router.refresh();
  }, [warehouseId, reasonId, referenceNo, description, items, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-xl border shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto"
        style={{ borderColor: "#E8E4DE" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E8E4DE" }}>
          <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>New inventory adjustment</h3>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#847D77" }}>&times;</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#FEF3C7", color: "#92400E" }}>
            Saves to the sandbox test DB only (never live). Sets external_quantity on the matched
            product(s) — the storefront stock figure moves too, in this sandbox only.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Warehouse">
              <Select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                placeholder="Select warehouse"
              />
            </FormField>
            <FormField label="Reason">
              <Select
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value)}
                options={reasons.map((r) => ({ value: r.id, label: r.reason }))}
                placeholder="Select reason"
              />
            </FormField>
            <FormField label="Reference no.">
              <TextInput value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. ADJ-2026-001" />
            </FormField>
            <FormField label="Description">
              <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" />
            </FormField>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold" style={{ color: "#302C28" }}>Items</h4>
              <Button variant="secondary" size="sm" onClick={() => setItems((c) => [...c, blankItem()])}>+ Add item</Button>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((it, i) => (
                <div key={i} className="grid gap-2 items-end p-2.5 rounded-lg border" style={{ borderColor: "#E8E4DE", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto" }}>
                  <FormField label="Product ID">
                    <TextInput value={it.productId} onChange={(e) => patchItem(i, { productId: e.target.value })} placeholder="Loom product id" />
                  </FormField>
                  <FormField label="Qty at hand">
                    <TextInput type="number" value={it.quantityAtHand} onChange={(e) => patchItem(i, { quantityAtHand: e.target.value })} />
                  </FormField>
                  <FormField label="Qty available">
                    <TextInput type="number" value={it.quantityAvailable} onChange={(e) => patchItem(i, { quantityAvailable: e.target.value })} />
                  </FormField>
                  <FormField label="Qty adjusted">
                    <TextInput type="number" value={it.quantityAdjusted} onChange={(e) => patchItem(i, { quantityAdjusted: e.target.value })} />
                  </FormField>
                  <button onClick={() => removeItem(i)} className="mb-1 flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-100" style={{ color: "#847D77" }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          {error && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{error}</span>}
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={doSave} disabled={!valid || saving} loading={saving}>
            {saving ? "Saving…" : "Create adjustment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdjustmentsView({
  adjustments, warehouses, reasons,
}: {
  adjustments: InventoryAdjustmentLite[];
  warehouses: WarehouseItem[];
  reasons: InventoryAdjustmentReason[];
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<InventoryAdjustmentDetail | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return adjustments;
    return adjustments.filter(
      (a) =>
        a.referenceNo.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.warehouse.toLowerCase().includes(q),
    );
  }, [adjustments, search]);

  const paginated = filtered.slice((page - 1) * 20, page * 20);

  const loadDetail = async (id: number) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/inventory/adjustment/${id}`);
      const data = await res.json();
      setDetail(data);
    } catch {
      // silent
    } finally {
      setLoadingId(null);
    }
  };

  const columns: DataListColumn<InventoryAdjustmentLite>[] = [
    {
      key: "date",
      label: "Adjustment date",
      render: (row) => <span className="text-sm" style={{ color: "#302C28" }}>{formatDate(row.adjustmentDate)}</span>,
    },
    {
      key: "ref",
      label: "Reference",
      render: (row) => <span className="text-sm font-medium" style={{ color: "#1A1714" }}>{row.referenceNo || "—"}</span>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => <span className="text-sm" style={{ color: "#635D58" }}>{row.reason}</span>,
    },
    {
      key: "warehouse",
      label: "Warehouse",
      render: (row) => <span className="text-sm" style={{ color: "#635D58" }}>{row.warehouse}</span>,
    },
    {
      key: "created",
      label: "Created",
      render: (row) => <span className="text-xs" style={{ color: "#AAA39E" }}>{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          onClick={() => loadDetail(row.id)}
          className="text-xs hover:underline"
          style={{ color: "#A86120" }}
          disabled={loadingId === row.id}
        >
          {loadingId === row.id ? "Loading…" : "Details"}
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {showNew && (
        <NewAdjustmentDrawer warehouses={warehouses} reasons={reasons} onClose={() => setShowNew(false)} />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDetail(null)}>
          <div
            className="relative bg-white rounded-xl border shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto m-4"
            style={{ borderColor: "#E8E4DE" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E8E4DE" }}>
              <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
                Adjustment #{detail.id}
              </h3>
              <button onClick={() => setDetail(null)} className="text-2xl leading-none" style={{ color: "#847D77" }}>&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#847D77" }}>Reference</span><div style={{ color: "#1A1714" }}>{detail.referenceNo || "—"}</div></div>
                <div><span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#847D77" }}>Reason</span><div style={{ color: "#1A1714" }}>{detail.reason}</div></div>
                <div><span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#847D77" }}>Warehouse</span><div style={{ color: "#1A1714" }}>{detail.warehouse}</div></div>
                <div><span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#847D77" }}>Date</span><div style={{ color: "#1A1714" }}>{formatDate(detail.adjustmentDate)}</div></div>
              </div>
              {detail.description && (
                <div className="text-sm" style={{ color: "#635D58" }}>{detail.description}</div>
              )}
              {detail.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: "#302C28" }}>Items adjusted ({detail.items.length})</h4>
                  <div className="overflow-auto rounded-lg border" style={{ borderColor: "#E8E4DE" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "#FAF9F7", borderBottom: "1px solid #F3F1ED" }}>
                          {["Product", "Qty at hand", "Adjusted", "Available after"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item, i) => (
                          <tr key={i} style={{ borderBottom: i < detail.items.length - 1 ? "1px solid #F3F1ED" : undefined }}>
                            <td className="px-3 py-2.5" style={{ color: "#302C28" }}>{item.productName}</td>
                            <td className="px-3 py-2.5 tabular-nums" style={{ color: "#635D58" }}>{item.quantityAtHand}</td>
                            <td className="px-3 py-2.5 tabular-nums font-medium" style={{ color: item.quantityAdjusted >= 0 ? "#059669" : "#DC2626" }}>
                              {item.quantityAdjusted >= 0 ? "+" : ""}{item.quantityAdjusted}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums" style={{ color: "#302C28" }}>{item.quantityAvailable}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#847D77" }}>{adjustments.length} adjustment{adjustments.length !== 1 ? "s" : ""}</p>
        <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>+ New adjustment</Button>
      </div>

      <DataList
        data={paginated}
        columns={columns}
        getId={(row) => String(row.id)}
        total={filtered.length}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        searchPlaceholder="Search reference, reason, warehouse…"
        onSearch={(q) => { setSearch(q); setPage(1); }}
        emptyMessage="No inventory adjustments found."
      />
    </div>
  );
}

function OOSView({ oosRequests }: { oosRequests: OOSRequest[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);
  const [editingQty, setEditingQty] = useState<{ id: number; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OOSRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let data = oosRequests;
    if (statusFilter) data = data.filter((r) => r.status === statusFilter);
    const q = search.toLowerCase();
    if (!q) return data;
    return data.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.productSku.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q),
    );
  }, [oosRequests, search, statusFilter]);

  const paginated = filtered.slice((page - 1) * 25, page * 25);
  const statuses = Array.from(new Set(oosRequests.map((r) => r.status))).sort();

  const doStatusChange = async (row: OOSRequest, status: string) => {
    setBusyId(row.id);
    setRowError(null);
    const { ok, message } = await crudWrite("update/inventory-restock-request/status", "PATCH", { id: row.id, status });
    setBusyId(null);
    if (!ok) { setRowError({ id: row.id, message }); return; }
    router.refresh();
  };

  const doQtySave = async (row: OOSRequest) => {
    if (!editingQty) return;
    setBusyId(row.id);
    setRowError(null);
    const { ok, message } = await crudWrite("update/inventory-restock-request/quantity", "PATCH", {
      requestId: row.id,
      quantity: Number(editingQty.value) || 0,
    });
    setBusyId(null);
    if (!ok) { setRowError({ id: row.id, message }); return; }
    setEditingQty(null);
    router.refresh();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    const { ok, message } = await crudWrite(`delete/inventory-restock-request/${confirmDelete.id}`, "DELETE");
    setDeleting(false);
    if (!ok) { setDeleteError(message); return; }
    setConfirmDelete(null);
    router.refresh();
  };

  const columns: DataListColumn<OOSRequest>[] = [
    {
      key: "product",
      label: "Product",
      render: (row) => (
        <div>
          <div className="text-sm font-medium" style={{ color: "#1A1714" }}>{row.productName}</div>
          <div className="text-xs font-mono" style={{ color: "#AAA39E" }}>{row.productSku}</div>
        </div>
      ),
    },
    {
      key: "group",
      label: "Type",
      render: (row) => (
        <span className="text-xs uppercase tracking-wide" style={{ color: "#635D58" }}>{row.productGroup}</span>
      ),
    },
    {
      key: "customer",
      label: "Requested by",
      render: (row) => <span className="text-sm" style={{ color: "#302C28" }}>{row.customerName}</span>,
    },
    {
      key: "qty",
      label: "Requested qty",
      render: (row) =>
        editingQty?.id === row.id ? (
          <div className="flex items-center gap-1.5">
            <TextInput
              type="number"
              className="h-7 w-20 text-sm"
              value={editingQty.value}
              onChange={(e) => setEditingQty({ id: row.id, value: e.target.value })}
            />
            <button className="text-xs font-medium hover:underline" style={{ color: "#047857" }} onClick={() => doQtySave(row)} disabled={busyId === row.id}>Save</button>
            <button className="text-xs" style={{ color: "#847D77" }} onClick={() => setEditingQty(null)}>Cancel</button>
          </div>
        ) : (
          <button
            className="text-sm tabular-nums hover:underline"
            style={{ color: "#302C28" }}
            title="Click to edit requested quantity"
            onClick={() => setEditingQty({ id: row.id, value: String(row.requestedQuantity) })}
          >
            {row.requestedQuantity}
          </button>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <select
          value={row.status}
          disabled={busyId === row.id}
          onChange={(e) => doStatusChange(row, e.target.value)}
          className="rounded-lg border px-2 py-1 text-xs font-medium"
          style={{ borderColor: "#E8E4DE", color: "#302C28", background: "white" }}
        >
          {RESTOCK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
    {
      key: "date",
      label: "Requested",
      render: (row) => <span className="text-xs" style={{ color: "#AAA39E" }}>{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          onClick={() => setConfirmDelete(row)}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-red-50"
          style={{ color: "#B91C1C" }}
          title="Delete request"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <>
      {rowError && (
        <div className="mb-2 rounded-lg border px-3 py-2 text-xs" style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}>
          Row #{rowError.id}: {rowError.message}
        </div>
      )}
      <DataList
        data={paginated}
        columns={columns}
        getId={(row) => String(row.id)}
        total={filtered.length}
        page={page}
        pageSize={25}
        onPageChange={setPage}
        searchPlaceholder="Search product, SKU, customer…"
        onSearch={(q) => { setSearch(q); setPage(1); }}
        emptyMessage="No out-of-stock requests found."
        filterPanel={
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium self-center" style={{ color: "#635D58" }}>Status:</span>
            {["", ...statuses].map((s) => (
              <button
                key={s || "all"}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={statusFilter === s ? { background: "#A86120", color: "white" } : { background: "#F3F1ED", color: "#635D58" }}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        }
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete restock request?"
        message={confirmDelete ? <>Request for &ldquo;{confirmDelete.productName}&rdquo; will be permanently removed from the sandbox database.</> : null}
        confirmLabel="Delete"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={doDelete}
        onCancel={() => { setConfirmDelete(null); setDeleteError(null); }}
      />
    </>
  );
}

function WarehouseFormDrawer({
  initial, onClose,
}: {
  initial: { id?: number; name: string; description: string } | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!initial) return null;

  const doSave = async () => {
    setSaving(true);
    setError(null);
    const { ok, message } = isEdit
      ? await crudWrite("update/warehouse", "PATCH", { id: initial.id, name, description })
      : await crudWrite("add/warehouse", "POST", { name, description });
    setSaving(false);
    if (!ok) { setError(message || "Save failed"); return; }
    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl border shadow-2xl max-w-md w-full" style={{ borderColor: "#E8E4DE" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E8E4DE" }}>
          <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>{isEdit ? "Edit warehouse" : "New warehouse"}</h3>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#847D77" }}>&times;</button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#FEF3C7", color: "#92400E" }}>
            Saves to the sandbox test DB only (never live).
          </p>
          <FormField label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></FormField>
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          {error && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{error}</span>}
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={doSave} disabled={!name.trim() || saving} loading={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function WarehousesView({ warehouses }: { warehouses: WarehouseItem[] }) {
  const [drawer, setDrawer] = useState<{ id?: number; name: string; description: string } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#847D77" }}>{warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""}</p>
        <Button variant="primary" size="sm" onClick={() => setDrawer({ name: "", description: "" })}>+ New warehouse</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.length === 0 && (
          <p className="text-sm col-span-3" style={{ color: "#AAA39E" }}>No warehouses found.</p>
        )}
        {warehouses.map((wh) => (
          <Card key={wh.id}>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>{wh.name}</CardTitle>
                <button
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#A86120" }}
                  onClick={() => setDrawer({ id: wh.id, name: wh.name, description: wh.description })}
                >
                  Edit
                </button>
              </div>
            </CardHeader>
            <div className="text-sm flex flex-col gap-2">
              {wh.description && <p style={{ color: "#635D58" }}>{wh.description}</p>}
              <p className="text-xs" style={{ color: "#AAA39E" }}>Added {formatDate(wh.createdAt)}</p>
            </div>
          </Card>
        ))}
      </div>
      {drawer && <WarehouseFormDrawer initial={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

function ReasonFormDrawer({
  initial, onClose,
}: {
  initial: { id?: number; reason: string; description: string } | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!initial) return null;

  const doSave = async () => {
    setSaving(true);
    setError(null);
    const { ok, message } = isEdit
      ? await crudWrite("update/inventory-adjustment-reason", "PATCH", { id: initial.id, reason, description })
      : await crudWrite("add/inventory-adjustment-reason", "POST", { reason, description });
    setSaving(false);
    if (!ok) { setError(message || "Save failed"); return; }
    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl border shadow-2xl max-w-md w-full" style={{ borderColor: "#E8E4DE" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E8E4DE" }}>
          <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>{isEdit ? "Edit reason" : "New adjustment reason"}</h3>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#847D77" }}>&times;</button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#FEF3C7", color: "#92400E" }}>
            Saves to the sandbox test DB only (never live).
          </p>
          <FormField label="Reason"><TextInput value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>
          <FormField label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></FormField>
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          {error && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{error}</span>}
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={doSave} disabled={!reason.trim() || saving} loading={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * ReasonsView — list of inventory adjustment reasons with create + edit,
 * wired to /api/crud (add|update /inventory-adjustment-reason). Editing a
 * live-synced reason (id below the sandbox band) is refused server-side with
 * a friendly "sandbox-only write" message — only ZZ_PARITY_TEST/new reasons
 * created here are freely editable.
 */
function ReasonsView({ reasons }: { reasons: InventoryAdjustmentReason[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<{ id?: number; reason: string; description: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return reasons;
    return reasons.filter(
      (r) =>
        r.reason.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [reasons, search]);

  const paginated = filtered.slice((page - 1) * 25, page * 25);

  const columns: DataListColumn<InventoryAdjustmentReason>[] = [
    {
      key: "reason",
      label: "Reason",
      render: (row) => (
        <span className="text-sm font-medium" style={{ color: "#1A1714" }}>{row.reason}</span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="text-sm" style={{ color: "#635D58" }}>{row.description || "—"}</span>
      ),
    },
    {
      key: "created",
      label: "Created on",
      render: (row) => (
        <span className="text-sm" style={{ color: "#847D77" }}>{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "edit",
      label: "",
      render: (row) => (
        <button
          className="text-xs font-medium hover:underline"
          style={{ color: "#A86120" }}
          onClick={() => setDrawer({ id: row.id, reason: row.reason, description: row.description })}
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#847D77" }}>
          {reasons.length} reason{reasons.length !== 1 ? "s" : ""} configured
        </p>
        <Button variant="primary" size="sm" onClick={() => setDrawer({ reason: "", description: "" })}>+ New reason</Button>
      </div>

      <DataList
        data={paginated}
        columns={columns}
        getId={(row) => String(row.id)}
        total={filtered.length}
        page={page}
        pageSize={25}
        onPageChange={setPage}
        searchPlaceholder="Search reason or description…"
        onSearch={(q) => { setSearch(q); setPage(1); }}
        emptyMessage="No adjustment reasons found."
      />
      {drawer && <ReasonFormDrawer initial={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

type InventoryTab = "adjustments" | "oos" | "warehouses" | "reasons";

interface InventoryClientProps {
  adjustments: InventoryAdjustmentLite[];
  oosRequests: OOSRequest[];
  warehouses: WarehouseItem[];
  reasons: InventoryAdjustmentReason[];
}

export function InventoryClient({ adjustments, oosRequests, warehouses, reasons }: InventoryClientProps) {
  const [tab, setTab] = useState<InventoryTab>("adjustments");

  const tabs: { id: InventoryTab; label: string; count?: number }[] = [
    { id: "adjustments", label: "Adjustments", count: adjustments.length },
    { id: "oos", label: "Out of stock", count: oosRequests.length },
    { id: "warehouses", label: "Warehouses", count: warehouses.length },
    { id: "reasons", label: "Adjustment reasons", count: reasons.length },
  ];

  return (
    <WeaveShell
      breadcrumb={
        <span className="font-serif text-lg font-medium" style={{ color: "#1A1714" }}>Inventory</span>
      }
    >
      <div className="flex flex-col gap-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Inventory</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Adjustments, out-of-stock requests, and warehouse management
            </p>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mt-1"
            style={{ background: "#ECFDF5", color: "#047857" }}
          >
            Writes save to the sandbox test DB only (never live)
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 border-b" style={{ borderColor: "#E8E4DE" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative px-4 py-2.5 text-sm font-medium transition-colors"
              style={
                tab === t.id
                  ? { color: "#A86120", borderBottom: "2px solid #A86120" }
                  : { color: "#635D58" }
              }
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={tab === t.id ? { background: "#FEF3E2", color: "#A86120" } : { background: "#F3F1ED", color: "#847D77" }}
                >
                  {t.count.toLocaleString("en-IN")}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        {tab === "adjustments" && <AdjustmentsView adjustments={adjustments} warehouses={warehouses} reasons={reasons} />}
        {tab === "oos" && <OOSView oosRequests={oosRequests} />}
        {tab === "warehouses" && <WarehousesView warehouses={warehouses} />}
        {tab === "reasons" && <ReasonsView reasons={reasons} />}
      </div>
    </WeaveShell>
  );
}
