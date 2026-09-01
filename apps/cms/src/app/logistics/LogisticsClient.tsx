"use client";

/**
 * LogisticsClient — Logistics hub for the Weave sandbox.
 *
 * Three tabs: Shipping partners / Discount codes / Forex rates. Each tab reads
 * via a dedicated native server route (/api/logistics/*, no live-Loom proxy —
 * see logistics-api.ts) and writes via the shared /api/crud forwarder (sandbox
 * Postgres only). CRUD wired 2026-07-06 (Phase 4): create/edit drawer + row
 * delete for all three tabs, mirroring the SimpleItemCrud save/delete pattern.
 * Discount CRUD lives here (not a separate /wholesale surface) because the
 * live app's Discounts list already renders on this page; Forex CRUD is here
 * because live puts Forex under manage-logistic too (see settings contract).
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Truck, Tag, TrendingUp, ExternalLink, ShoppingCart, Boxes, ClipboardList, Trash2 } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, DataListColumn, Badge, Button, FormField, TextInput, Select, Toggle, ConfirmDialog } from "@/components/ui";
import { TabBar } from "@/components/ui/TabBar";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useClientTable } from "@/lib/useClientTable";
import {
  fetchShippingList,
  fetchDiscountList,
  fetchForexList,
  createShipment,
  updateShipment,
  deleteShipment,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  createForex,
  updateForex,
  deleteForex,
  type ShippingItem,
  type DiscountItem,
  type ForexItem,
  type ShipmentInput,
  type DiscountInput,
  type ForexInput,
} from "@/lib/logistics-api";
import type { Result } from "@/lib/result";
import { formatEpoch } from "@/lib/utils";

type Tab = "shipping" | "discount" | "forex";
const PAGE_SIZE = 25;

// -- Shared helpers --------------------------------------------------------------

/** Fetch-with-reload: like useListState but exposes a `reload()` for post-write refresh. */
function useReloadableList<T>(fetcher: () => Promise<Result<T[]>>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gen, setGen] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetcher().then((res) => {
      if (!alive) return;
      if (res.ok) setRows(res.data);
      else setError(res.error);
      setLoading(false);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gen]);

  const reload = useCallback(() => setGen((g) => g + 1), []);
  return { rows, loading, error, reload };
}

function DrawerShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl border-l" style={{ borderColor: "#E8E4DE" }}>
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>{title}</h3>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: "#847D77" }}>×</button>
        </div>
        <div className="px-5 pt-4">
          <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}>
            Saves to the sandbox test DB only (never live).
          </div>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">{children}</div>
        <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>{footer}</div>
      </div>
    </div>
  );
}

function epochToDateInput(v?: number): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
function dateInputToEpoch(v: string): number | undefined {
  if (!v) return undefined;
  const t = new Date(v + "T00:00:00Z").getTime();
  return Number.isNaN(t) ? undefined : t;
}

// -- Shipping tab ----------------------------------------------------------------

const LOCATION_OPTIONS = [
  { value: "DOMESTIC", label: "Domestic" },
  { value: "INTERNATIONAL", label: "International" },
];

interface ShipDrawerState {
  mode: "create" | "edit";
  id?: number;
  form: ShipmentInput;
}

function emptyShipForm(): ShipmentInput {
  return { name: "", locationType: "DOMESTIC", baseAmount: 0, baseQuantity: 0, additionalAmount: 0, estimatedFromDay: 0, estimatedToDay: 0 };
}

function ShippingTab() {
  const { rows, loading, error, reload } = useReloadableList<ShippingItem>(fetchShippingList);
  const searchFields = useCallback((r: ShippingItem) => [r.name, r.locationType], []);
  const table = useClientTable(rows, { searchFields, pageSize: PAGE_SIZE });
  const router = useRouter();

  const [drawer, setDrawer] = useState<ShipDrawerState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ShippingItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreate = () => { setDrawer({ mode: "create", form: emptyShipForm() }); setSaveError(null); };
  const openEdit = (r: ShippingItem) => {
    setDrawer({
      mode: "edit", id: r.id,
      form: { name: r.name, locationType: r.locationType, baseAmount: r.baseAmount, baseQuantity: r.baseQuantity, additionalAmount: r.additionalAmount, estimatedFromDay: r.estimatedFromDay, estimatedToDay: r.estimatedToDay },
    });
    setSaveError(null);
  };
  const closeDrawer = () => setDrawer(null);

  const doSave = useCallback(async () => {
    if (!drawer || !drawer.form.name.trim()) return;
    setSaving(true); setSaveError(null);
    try {
      const body: ShipmentInput = drawer.mode === "edit" ? { ...drawer.form, id: drawer.id } : drawer.form;
      if (drawer.mode === "create") await createShipment(body); else await updateShipment(body);
      closeDrawer(); reload(); router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }, [drawer, reload, router]);

  const doDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true); setDeleteError(null);
    try {
      await deleteShipment(confirmDelete.id);
      setConfirmDelete(null); reload(); router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally { setDeleting(false); }
  }, [confirmDelete, reload, router]);

  const columns = useMemo<DataListColumn<ShippingItem>[]>(() => [
    {
      key: "name", label: "Name",
      render: (r) => (
        <button type="button" className="font-medium text-sm text-left hover:underline" style={{ color: "#1A1714" }} onClick={() => openEdit(r)}>
          {r.name || "—"}
        </button>
      ),
    },
    {
      key: "locationType", label: "Type",
      render: (r) => (
        <Badge variant={r.locationType === "INTERNATIONAL" ? "purple" : "blue"}>
          {r.locationType === "INTERNATIONAL" ? "International" : "Domestic"}
        </Badge>
      ),
    },
    {
      key: "baseAmount", label: "Base Amount",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>₹{r.baseAmount.toLocaleString("en-IN")}</span>,
    },
    {
      key: "baseQuantity", label: "Base Qty",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.baseQuantity}</span>,
    },
    {
      key: "additionalAmount", label: "Additional",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>₹{r.additionalAmount.toLocaleString("en-IN")}</span>,
    },
    {
      key: "days", label: "Est. Days",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.estimatedFromDay}–{r.estimatedToDay} days</span>,
    },
    {
      key: "actions", label: "", headerClassName: "w-12", cellClassName: "text-right",
      render: (r) => (
        <button type="button" className="rounded-md p-1.5 hover:bg-red-50 transition-colors" style={{ color: "#AAA39E" }}
          title="Delete shipping partner"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ], []);

  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={openCreate}>+ New Shipping Partner</Button>
      </div>
      <DataList
        data={table.paged} columns={columns} getId={(r) => String(r.id)}
        total={table.filtered.length} page={table.page} pageSize={PAGE_SIZE}
        onPageChange={table.setPage}
        onSearch={table.setSearch}
        searchPlaceholder="Search by name or type…"
        emptyMessage={loading ? "Loading shipping partners…" : "No shipping partners found."}
        loading={loading}
      />

      {drawer && (
        <DrawerShell
          title={drawer.mode === "create" ? "New Shipping Partner" : `Edit Shipping Partner #${drawer.id}`}
          onClose={closeDrawer}
          footer={<>
            <Button variant="secondary" onClick={closeDrawer} size="sm">Cancel</Button>
            {saveError && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{saveError}</span>}
            <Button variant="primary" onClick={doSave} size="sm" disabled={saving || !drawer.form.name.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>}
        >
          <FormField label="Name" required>
            <TextInput value={drawer.form.name} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, name: e.target.value } })} autoFocus />
          </FormField>
          <FormField label="Location Type">
            <Select options={LOCATION_OPTIONS} value={drawer.form.locationType} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, locationType: e.target.value } })} />
          </FormField>
          <FormField label="Base Amount (₹)">
            <TextInput type="number" value={drawer.form.baseAmount} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, baseAmount: Number(e.target.value) } })} />
          </FormField>
          <FormField label="Base Quantity">
            <TextInput type="number" value={drawer.form.baseQuantity} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, baseQuantity: Number(e.target.value) } })} />
          </FormField>
          <FormField label="Additional Amount (₹)" hint="Charged per unit beyond the base quantity">
            <TextInput type="number" value={drawer.form.additionalAmount} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, additionalAmount: Number(e.target.value) } })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Est. From (days)">
              <TextInput type="number" value={drawer.form.estimatedFromDay} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, estimatedFromDay: Number(e.target.value) } })} />
            </FormField>
            <FormField label="Est. To (days)">
              <TextInput type="number" value={drawer.form.estimatedToDay} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, estimatedToDay: Number(e.target.value) } })} />
            </FormField>
          </div>
        </DrawerShell>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete shipping partner?"
        message={confirmDelete ? <>&ldquo;{confirmDelete.name}&rdquo; will be permanently removed from the sandbox database. This cannot be undone.</> : null}
        confirmLabel="Delete" danger loading={deleting} error={deleteError}
        onConfirm={doDelete}
        onCancel={() => { setConfirmDelete(null); setDeleteError(null); }}
      />
    </div>
  );
}

// -- Discount tab ------------------------------------------------------------------

const DISCOUNT_TYPE_OPTIONS = [
  { value: "PERCENTAGE_OFF", label: "Percentage off" },
  { value: "FREE_SHIPPING", label: "Free shipping" },
];
const DISCOUNT_METHOD_OPTIONS = [
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "MANUAL", label: "Manual (coupon code)" },
];
const USAGE_TYPE_OPTIONS = [
  { value: "SINGLE", label: "Single use" },
  { value: "MULTIPLE", label: "Multiple use" },
];

interface DiscDrawerState {
  mode: "create" | "edit";
  id?: number;
  form: DiscountInput;
  startDateStr: string;
  endDateStr: string;
}

function emptyDiscForm(): DiscountInput {
  return { couponCode: "", discountType: "PERCENTAGE_OFF", discountMethod: "MANUAL", discountPercentage: 0, minimumOrderValue: 0, location: "DOMESTIC", usageType: "MULTIPLE", active: true };
}

function DiscountTab() {
  const { rows, loading, error, reload } = useReloadableList<DiscountItem>(fetchDiscountList);
  const searchFields = useCallback((r: DiscountItem) => [r.code, r.discountType], []);
  const table = useClientTable(rows, { searchFields, pageSize: PAGE_SIZE });
  const router = useRouter();

  const [drawer, setDrawer] = useState<DiscDrawerState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DiscountItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreate = () => {
    // Backend requires startDate >= today (validDateRange) — default to today
    // so create doesn't silently fail with "Invalid start/end date range".
    setDrawer({ mode: "create", form: emptyDiscForm(), startDateStr: epochToDateInput(Date.now()), endDateStr: "" });
    setSaveError(null);
  };
  const openEdit = (r: DiscountItem) => {
    setDrawer({
      mode: "edit", id: r.id,
      form: {
        couponCode: r.code, discountType: r.discountType || "PERCENTAGE_OFF", discountMethod: r.discountMethod || "MANUAL",
        discountPercentage: r.discountValue, minimumOrderValue: r.minimumOrderValue, location: r.location || "DOMESTIC",
        usageType: "MULTIPLE", startDate: r.startDate, endDate: r.expiryDate, active: r.active,
      },
      startDateStr: epochToDateInput(r.startDate), endDateStr: epochToDateInput(r.expiryDate),
    });
    setSaveError(null);
  };
  const closeDrawer = () => setDrawer(null);

  const doSave = useCallback(async () => {
    if (!drawer || !drawer.form.couponCode.trim()) return;
    if (drawer.mode === "create" && !drawer.startDateStr) { setSaveError("Start date is required."); return; }
    setSaving(true); setSaveError(null);
    try {
      const form: DiscountInput = { ...drawer.form, startDate: dateInputToEpoch(drawer.startDateStr) ?? Date.now(), endDate: dateInputToEpoch(drawer.endDateStr) };
      const body: DiscountInput = drawer.mode === "edit" ? { ...form, id: drawer.id } : form;
      if (drawer.mode === "create") await createDiscount(body); else await updateDiscount(body);
      closeDrawer(); reload(); router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }, [drawer, reload, router]);

  const doDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true); setDeleteError(null);
    try {
      await deleteDiscount(confirmDelete.id);
      setConfirmDelete(null); reload(); router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally { setDeleting(false); }
  }, [confirmDelete, reload, router]);

  const columns = useMemo<DataListColumn<DiscountItem>[]>(() => [
    {
      key: "code", label: "Code",
      render: (r) => (
        <button type="button" className="font-mono font-semibold text-sm text-left hover:underline" style={{ color: "#1A1714" }} onClick={() => openEdit(r)}>
          {r.code || "—"}
        </button>
      ),
    },
    {
      key: "discountValue", label: "Value",
      render: (r) => (
        <span className="text-sm font-medium" style={{ color: "#A86120" }}>
          {r.discountType.includes("FREE") ? "Free shipping" : `${r.discountValue}%`}
        </span>
      ),
    },
    {
      key: "discountType", label: "Type",
      render: (r) => (
        <Badge variant={r.discountType.includes("FREE") ? "green" : "amber"}>
          {r.discountType.includes("FREE") ? "Free shipping" : "Percentage"}
        </Badge>
      ),
    },
    {
      key: "usage", label: "Usage",
      render: (r) => (
        <span className="text-sm" style={{ color: r.currentUsage >= r.maxUsage && r.maxUsage > 0 ? "#B91C1C" : "#635D58" }}>
          {r.currentUsage}/{r.maxUsage || "∞"}
        </span>
      ),
    },
    {
      key: "active", label: "Status",
      render: (r) => r.active ? <Badge variant="green">Active</Badge> : <Badge variant="stone">Inactive</Badge>,
    },
    {
      key: "expiryDate", label: "Expires",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.expiryDate ? formatEpoch(r.expiryDate) : "—"}</span>,
    },
    {
      key: "actions", label: "", headerClassName: "w-12", cellClassName: "text-right",
      render: (r) => (
        <button type="button" className="rounded-md p-1.5 hover:bg-red-50 transition-colors" style={{ color: "#AAA39E" }}
          title="Delete discount"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ], []);

  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={openCreate}>+ New Discount</Button>
      </div>
      <DataList
        data={table.paged} columns={columns} getId={(r) => String(r.id)}
        total={table.filtered.length} page={table.page} pageSize={PAGE_SIZE}
        onPageChange={table.setPage}
        onSearch={table.setSearch}
        searchPlaceholder="Search by code or type…"
        emptyMessage={loading ? "Loading discount codes…" : "No discount codes found."}
        loading={loading}
      />

      {drawer && (
        <DrawerShell
          title={drawer.mode === "create" ? "New Discount" : `Edit Discount #${drawer.id}`}
          onClose={closeDrawer}
          footer={<>
            <Button variant="secondary" onClick={closeDrawer} size="sm">Cancel</Button>
            {saveError && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{saveError}</span>}
            <Button variant="primary" onClick={doSave} size="sm" disabled={saving || !drawer.form.couponCode.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>}
        >
          <FormField label="Coupon Code" required>
            <TextInput value={drawer.form.couponCode} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, couponCode: e.target.value.toUpperCase() } })} autoFocus />
          </FormField>
          <FormField label="Type">
            <Select options={DISCOUNT_TYPE_OPTIONS} value={drawer.form.discountType} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, discountType: e.target.value } })} />
          </FormField>
          <FormField label="Method">
            <Select options={DISCOUNT_METHOD_OPTIONS} value={drawer.form.discountMethod} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, discountMethod: e.target.value } })} />
          </FormField>
          {!drawer.form.discountType.includes("FREE") && (
            <FormField label="Discount %">
              <TextInput type="number" value={drawer.form.discountPercentage} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, discountPercentage: Number(e.target.value) } })} />
            </FormField>
          )}
          <FormField label="Minimum Order Value (₹)">
            <TextInput type="number" value={drawer.form.minimumOrderValue} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, minimumOrderValue: Number(e.target.value) } })} />
          </FormField>
          <FormField label="Location">
            <Select options={LOCATION_OPTIONS} value={drawer.form.location} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, location: e.target.value } })} />
          </FormField>
          <FormField label="Usage Type">
            <Select options={USAGE_TYPE_OPTIONS} value={drawer.form.usageType} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, usageType: e.target.value } })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start date" required hint="Must be today or later">
              <TextInput type="date" value={drawer.startDateStr} onChange={(e) => setDrawer((d) => d && { ...d, startDateStr: e.target.value })} />
            </FormField>
            <FormField label="Expiry date">
              <TextInput type="date" value={drawer.endDateStr} onChange={(e) => setDrawer((d) => d && { ...d, endDateStr: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Active">
            <Toggle checked={drawer.form.active} onChange={(v) => setDrawer((d) => d && { ...d, form: { ...d.form, active: v } })} label={drawer.form.active ? "Active" : "Inactive"} />
          </FormField>
        </DrawerShell>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete discount?"
        message={confirmDelete ? <>Coupon &ldquo;{confirmDelete.code}&rdquo; will be permanently removed from the sandbox database. This cannot be undone.</> : null}
        confirmLabel="Delete" danger loading={deleting} error={deleteError}
        onConfirm={doDelete}
        onCancel={() => { setConfirmDelete(null); setDeleteError(null); }}
      />
    </div>
  );
}

// -- Forex tab -----------------------------------------------------------------

interface ForexDrawerState {
  mode: "create" | "edit";
  id?: number;
  form: ForexInput;
}
function emptyForexForm(): ForexInput { return { country: "", currency: "", rate: 0 }; }

function ForexTab() {
  const { rows, loading, error, reload } = useReloadableList<ForexItem>(fetchForexList);
  const searchFields = useCallback((r: ForexItem) => [r.country, r.currency], []);
  const table = useClientTable(rows, { searchFields, pageSize: PAGE_SIZE });
  const router = useRouter();

  const [drawer, setDrawer] = useState<ForexDrawerState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ForexItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreate = () => { setDrawer({ mode: "create", form: emptyForexForm() }); setSaveError(null); };
  const openEdit = (r: ForexItem) => { setDrawer({ mode: "edit", id: r.id, form: { country: r.country, currency: r.currency, rate: r.rate } }); setSaveError(null); };
  const closeDrawer = () => setDrawer(null);

  const doSave = useCallback(async () => {
    if (!drawer || !drawer.form.country.trim() || !drawer.form.currency.trim()) return;
    setSaving(true); setSaveError(null);
    try {
      const body: ForexInput = drawer.mode === "edit" ? { ...drawer.form, id: drawer.id } : drawer.form;
      if (drawer.mode === "create") await createForex(body); else await updateForex(body);
      closeDrawer(); reload(); router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }, [drawer, reload, router]);

  const doDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true); setDeleteError(null);
    try {
      await deleteForex(confirmDelete.id);
      setConfirmDelete(null); reload(); router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally { setDeleting(false); }
  }, [confirmDelete, reload, router]);

  const columns = useMemo<DataListColumn<ForexItem>[]>(() => [
    {
      key: "country", label: "Country",
      render: (r) => (
        <button type="button" className="font-medium text-sm text-left hover:underline" style={{ color: "#1A1714" }} onClick={() => openEdit(r)}>
          {r.country || "—"}
        </button>
      ),
    },
    {
      key: "currency", label: "Currency",
      render: (r) => <span className="font-mono text-sm font-semibold" style={{ color: "#1A1714" }}>{r.currency || "—"}</span>,
    },
    {
      key: "rate", label: "Rate (to INR)",
      render: (r) => <span className="text-sm font-medium" style={{ color: "#A86120" }}>₹{r.rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>,
    },
    {
      key: "actions", label: "", headerClassName: "w-12", cellClassName: "text-right",
      render: (r) => r.country === "DEFAULT" ? null : (
        <button type="button" className="rounded-md p-1.5 hover:bg-red-50 transition-colors" style={{ color: "#AAA39E" }}
          title="Delete forex rate"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ], []);

  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={openCreate}>+ New Forex Rate</Button>
      </div>
      <DataList
        data={table.paged} columns={columns} getId={(r) => String(r.id)}
        total={table.filtered.length} page={table.page} pageSize={PAGE_SIZE}
        onPageChange={table.setPage}
        onSearch={table.setSearch}
        searchPlaceholder="Search by country or currency…"
        emptyMessage={loading ? "Loading forex rates…" : "No forex rates found."}
        loading={loading}
      />

      {drawer && (
        <DrawerShell
          title={drawer.mode === "create" ? "New Forex Rate" : `Edit Forex Rate #${drawer.id}`}
          onClose={closeDrawer}
          footer={<>
            <Button variant="secondary" onClick={closeDrawer} size="sm">Cancel</Button>
            {saveError && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{saveError}</span>}
            <Button variant="primary" onClick={doSave} size="sm" disabled={saving || !drawer.form.country.trim() || !drawer.form.currency.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>}
        >
          <FormField label="Country" required>
            <TextInput value={drawer.form.country} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, country: e.target.value } })} autoFocus />
          </FormField>
          <FormField label="Currency Code" required hint="e.g. USD, EUR, GBP">
            <TextInput value={drawer.form.currency} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, currency: e.target.value.toUpperCase() } })} />
          </FormField>
          <FormField label="Rate (to INR)" required>
            <TextInput type="number" step="0.0001" value={drawer.form.rate} onChange={(e) => setDrawer((d) => d && { ...d, form: { ...d.form, rate: Number(e.target.value) } })} />
          </FormField>
        </DrawerShell>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete forex rate?"
        message={confirmDelete ? <>&ldquo;{confirmDelete.country}&rdquo; ({confirmDelete.currency}) will be permanently removed from the sandbox database. This cannot be undone.</> : null}
        confirmLabel="Delete" danger loading={deleting} error={deleteError}
        onConfirm={doDelete}
        onCancel={() => { setConfirmDelete(null); setDeleteError(null); }}
      />
    </div>
  );
}

// -- Quick links ---------------------------------------------------------------

const QUICK_LINKS = [
  { href: "/orders", label: "Orders", icon: ShoppingCart, desc: "View all orders" },
  { href: "/inventory", label: "Inventory", icon: Boxes, desc: "Stock levels" },
  { href: "/artisanflow/custom-orders", label: "Custom Orders", icon: ClipboardList, desc: "Custom order pipeline" },
] as const;

// -- Shell ---------------------------------------------------------------------

const TABS = [
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "discount", label: "Discounts", icon: Tag },
  { id: "forex", label: "Forex Rates", icon: TrendingUp },
];

export function LogisticsClient() {
  const [tab, setTab] = useState<Tab>("shipping");

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Commerce</span><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Logistics</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Logistics</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Shipping partners, discount codes, and forex rates
            </p>
          </div>
          <Truck className="h-6 w-6" style={{ color: "#A86120" }} />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-stone-50 group"
                style={{ borderColor: "#E8E4DE" }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" style={{ color: "#A86120" }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium" style={{ color: "#1A1714" }}>{link.label}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: "#847D77" }} />
                  </div>
                  <span className="text-xs" style={{ color: "#847D77" }}>{link.desc}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Tab bar */}
        <TabBar
          tabs={TABS}
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          variant="underline"
          ariaLabel="Logistics tabs"
        />

        {/* Tab content */}
        {tab === "shipping" && <ShippingTab />}
        {tab === "discount" && <DiscountTab />}
        {tab === "forex" && <ForexTab />}
      </div>
    </WeaveShell>
  );
}
