"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Card, CardHeader, CardTitle, Badge, Button, FormField, TextInput, Textarea } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { deriveOrderStatus, type OrderDetail, type OrderItemRow } from "@/lib/api";
import type { OrderFulfillment, OrderReady } from "@/lib/order-fulfillment-api";
import type { OrderWorkflowSummary } from "@/lib/artisanflow-api";
import { paymentStatusVariant, isActiveItemStatus } from "@/components/artisanflow/orderStatus";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import { StartProductionDialog } from "@/components/artisanflow/StartProductionDialog";
import { computeWorkflowProgress, computeSubProcessCounts } from "@/lib/workflow-progress";
import { Truck, PackageCheck, Inbox, GitBranch, ArrowRight, Package, CreditCard, Info, MapPin } from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatMoney(amount: number, currency: string) {
  if (!currency || !amount) return amount ? amount.toLocaleString("en-IN") : "—";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

// Quantity display — 2 decimals for measured units (METER etc.), whole for UNIT.
// Faithful port of order-overview.component.ts `_normalizeFulfillmentQuantity`.
function normalizeQty(qty: number, unit: string): number {
  const precision = unit === "UNIT" ? 0 : 2;
  const m = Math.pow(10, precision);
  return Math.round((qty + Number.EPSILON) * m) / m;
}

function fmtQty(n: number, unit: string): string {
  const dec = unit === "UNIT" ? 0 : 2;
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
}

/** Total shipped qty for one order item across all fulfillment records. */
function fulfilledQty(orderItemId: number, fulfillments: OrderFulfillment[]): number {
  return fulfillments
    .flatMap((f) => f.orderItemFulfillmentList || [])
    .filter((x) => x.orderItemId === orderItemId)
    .reduce((s, x) => s + x.quantity, 0);
}

/** Total ready qty for one order item across all ready records. */
function readyQty(orderItemId: number, readies: OrderReady[]): number {
  return readies
    .flatMap((r) => r.orderItemReadyList || [])
    .filter((x) => x.orderItemId === orderItemId)
    .reduce((s, x) => s + x.quantity, 0);
}

/** A fulfillment is a FULL shipment when it covers every order item's full qty.
 *  Faithful port of `_isFulfillmentFullShipment`. */
function isFullFulfillment(f: OrderFulfillment, items: OrderItemRow[]): boolean {
  const fItems = f.orderItemFulfillmentList || [];
  if (items.length === 0 || fItems.length === 0) return false;
  return items.every((item) => {
    const q = fItems
      .filter((x) => x.orderItemId === item.id)
      .reduce((s, x) => s + x.quantity, 0);
    return normalizeQty(q, item.unit) >= normalizeQty(item.quantity, item.unit);
  });
}

/** Item-level full shipments: order items that already carry tracking + a
 *  shipping code, grouped by (zohoPackageId|trackingUrl|shippingCode). Faithful
 *  port of `_refreshFullShipmentList` — a fully-dispatched order records its
 *  shipment on the items themselves, not through a fulfillment record. */
interface ItemShipment {
  key: string;
  shippingCode: string;
  trackingUrl: string;
  zohoPackageId: string;
  dispatchedOn: number;
  items: OrderItemRow[];
}
function buildItemShipmentList(items: OrderItemRow[]): ItemShipment[] {
  const map = new Map<string, ItemShipment>();
  for (const it of items) {
    if (!it.trackingUrl || !it.shippingCode) continue;
    const key = [it.zohoPackageId || "", it.trackingUrl || "", it.shippingCode || ""].join("|");
    if (!map.has(key)) {
      map.set(key, {
        key,
        shippingCode: it.shippingCode,
        trackingUrl: it.trackingUrl,
        zohoPackageId: it.zohoPackageId,
        dispatchedOn: it.dispatchedOn,
        items: [],
      });
    }
    map.get(key)!.items.push(it);
  }
  return Array.from(map.values());
}

// ── Per-item production ───────────────────────────────────────────────────────
//
// One of three states per order item:
//   1. Has a matching native workflow (orderWorkflows, keyed by orderItemId) ->
//      compact progress panel + "View production" link.
//   2. Item isn't active (cancelled/dispatched/delivered/failed) -> nothing.
//   3. Neither -> a quiet "Start production" trigger.

function ItemProduction({
  orderId,
  item,
  workflow,
}: {
  orderId: number;
  item: OrderItemRow;
  workflow?: OrderWorkflowSummary;
}) {
  if (workflow) {
    const { pct, currentStageName } = computeWorkflowProgress(workflow);
    const subs = computeSubProcessCounts(workflow);
    return (
      <div className="mt-2.5 ml-[60px] rounded-lg border px-3 py-2.5" style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: "#635D58" }}>
            <GitBranch className="h-3.5 w-3.5" style={{ color: "#1D4ED8" }} />
            <span className="font-medium" style={{ color: "#1A1714" }}>{workflow.workflowName}</span>
            <span style={{ color: "#C7C1BB" }}>·</span>
            <span><b style={{ color: "#1A1714" }}>{subs.done}</b>/{subs.total} subprocesses</span>
            <span style={{ color: "#C7C1BB" }}>&middot;</span>
            <span><b style={{ color: "#1A1714" }}>{pct}%</b>{currentStageName ? " \u00b7 " + currentStageName : ""}</span>
          </div>
          <Link
            href={`/artisanflow/workflow/instance/${workflow.workflowId}`}
            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: "#1D4ED8" }}
          >
            View production <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {subs.total > 0 && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#EDE8E1" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#1D4ED8" }} />
          </div>
        )}
      </div>
    );
  }

  if (!isActiveItemStatus(item.orderStatus)) return null;

  return (
    <div className="mt-2.5 ml-[60px]">
      <StartProductionDialog
        item={{
          kind: "order",
          orderId,
          orderItemId: item.id,
          productName: item.productName,
          productSku: item.sku,
          quantity: item.quantity,
          unit: item.unit,
          orderLabel: `#${orderId}`,
        }}
      />
    </div>
  );
}

function PayBadge({ status }: { status: string }) {
  return <Badge variant={paymentStatusVariant(status)}>{status.replace(/_/g, " ")}</Badge>;
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#847D77" }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: "#1A1714" }}>{value ?? "—"}</p>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        {action}
      </div>
      {children}
    </Card>
  );
}

// ── DISABLED-BY-DESIGN affordance — external side-effects not reproduced in
//    the sandbox (add-fulfillment/add-ready/send-mail/trigger-impact all stay
//    proxied to live Loom or have no native compute; per Phase 4 scope these
//    are surfaced as visibly disabled controls with a short note, never wired
//    as writes). ───────────────────────────────────────────────────────────
function DisabledAction({ label, note }: { label: string; note: string }) {
  return (
    <button
      type="button"
      disabled
      title={note}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-not-allowed opacity-50"
      style={{ background: "#F3F1ED", color: "#847D77", borderColor: "#E8E4DE" }}
    >
      {label}
    </button>
  );
}

// ── Fulfilment history (read-only history + a real "Update tracking" action) ─
//
// Faithful port of the live order-overview "Partial Ready", "Partial Shipments"
// and "Full Shipments" regions. The history records themselves stay read-only
// (add-fulfillment / add-ready are passthrough-only — see DisabledAction below
// the item table); "Update tracking" (update/order/shipment) is native+tested
// and IS wired for real (2026-07-06, Phase 4).

function ReadOnlyBadge() {
  return (
    <span
      title="History is read-only — recorded fulfilment/ready entries cannot be edited"
      className="ml-auto rounded px-2 py-1 text-[11px] font-medium cursor-not-allowed opacity-60 select-none"
      style={{ background: "#F3F1ED", color: "#847D77", border: "1px solid #E8E4DE" }}
    >
      Read-only
    </span>
  );
}

function DonePill({ done, doneLabel }: { done: boolean; doneLabel: string }) {
  return (
    <span
      className="rounded-md px-2 py-0.5 text-[10px] font-medium"
      style={done ? { background: "#ECFDF5", color: "#047857" } : { background: "#F5F5F4", color: "#A8A29E" }}
    >
      {done ? doneLabel : "in progress"}
    </span>
  );
}

function FulfilmentBlock({
  icon,
  title,
  done,
  doneLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  done?: boolean;
  doneLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="none">
      <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: "#F3F1ED" }}>
        <span style={{ color: "#A86120" }}>{icon}</span>
        <h3 className="font-serif text-sm font-semibold uppercase tracking-wide" style={{ color: "#1A1714" }}>{title}</h3>
        {done != null && <DonePill done={done} doneLabel={doneLabel || "complete"} />}
        <ReadOnlyBadge />
      </div>
      <div className="flex flex-col gap-2 p-4">{children}</div>
    </Card>
  );
}

/** A single item row inside a ready / shipment card (name + SKU + qty). */
function ItemLine({
  orderItemId,
  quantity,
  unit,
  itemsById,
  verb,
  readyQtyHint,
}: {
  orderItemId: number;
  quantity: number;
  unit: string;
  itemsById: Map<number, OrderItemRow>;
  verb: string;
  readyQtyHint?: number;
}) {
  const row = itemsById.get(orderItemId);
  const label = row?.productName || `Item #${orderItemId}`;
  const sku = row?.sku;
  return (
    <div className="flex items-center justify-between gap-3 rounded border px-3 py-2" style={{ borderColor: "#E8E4DE" }}>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" style={{ color: "#1A1714" }}>{label}</p>
        {sku && <p className="text-xs font-mono" style={{ color: "#847D77" }}>SKU: {sku}</p>}
        <p className="text-[11px]" style={{ color: "#AAA39E" }}>Order Item #{orderItemId}</p>
      </div>
      <div className="whitespace-nowrap text-right">
        <p className="text-sm font-semibold tabular-nums" style={{ color: "#1A1714" }}>{fmtQty(quantity, unit)} {unit}</p>
        {readyQtyHint != null && readyQtyHint > 0 && (
          <p className="text-[11px]" style={{ color: "#847D77" }}>Ready: {fmtQty(readyQtyHint, unit)} {unit}</p>
        )}
        <p className="text-[11px]" style={{ color: "#AAA39E" }}>{verb}</p>
      </div>
    </div>
  );
}

function ShipmentCard({
  idLabel,
  shippingCode,
  trackingUrl,
  zohoPackageId,
  dispatchedOn,
  note,
  children,
}: {
  idLabel: string;
  shippingCode?: string;
  trackingUrl?: string;
  zohoPackageId?: string;
  dispatchedOn?: number;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "#E8E4DE" }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1A1714" }}>
            {idLabel}
            {shippingCode ? <span className="font-normal" style={{ color: "#847D77" }}> | {shippingCode}</span> : null}
          </p>
          {dispatchedOn && dispatchedOn > 0 ? (
            <p className="text-xs" style={{ color: "#635D58" }}>Dispatched: {formatDate(dispatchedOn)}</p>
          ) : null}
        </div>
        <div className="text-left sm:text-right">
          {trackingUrl ? (
            <p className="text-xs" style={{ color: "#1A1714" }}>
              Tracking:{" "}
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#1D4ED8" }}>
                {trackingUrl.length > 40 ? trackingUrl.slice(0, 40) + "…" : trackingUrl}
              </a>
            </p>
          ) : null}
          {zohoPackageId ? <p className="text-xs" style={{ color: "#1A1714" }}>Zoho Package ID: {zohoPackageId}</p> : null}
        </div>
      </div>
      {note ? <p className="mt-2 text-xs" style={{ color: "#635D58" }}>Note: {note}</p> : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function FulfilmentHistory({
  order,
  fulfillments,
  readies,
  error,
}: {
  order: OrderDetail;
  fulfillments: OrderFulfillment[];
  readies: OrderReady[];
  error?: string;
}) {
  const items = order.items;
  const itemsById = new Map<number, OrderItemRow>(items.map((it) => [it.id, it]));

  const fullFulfillments = fulfillments.filter((f) => isFullFulfillment(f, items));
  const partialFulfillments = fulfillments.filter((f) => !isFullFulfillment(f, items));
  const itemShipments = buildItemShipmentList(items);

  const allReady =
    items.length > 0 &&
    items.every((it) => normalizeQty(readyQty(it.id, readies), it.unit) >= normalizeQty(it.quantity, it.unit));
  const allShipped =
    items.length > 0 &&
    items.every((it) => normalizeQty(fulfilledQty(it.id, fulfillments), it.unit) >= normalizeQty(it.quantity, it.unit));

  const hasFull = itemShipments.length > 0 || fullFulfillments.length > 0;
  const nothing = readies.length === 0 && partialFulfillments.length === 0 && !hasFull;

  if (error) {
    return (
      <Section title="Fulfilment history">
        <ErrorBanner message={error} />
      </Section>
    );
  }

  if (nothing) {
    return (
      <Section title="Fulfilment history">
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Inbox className="h-4 w-4" style={{ color: "#AAA39E" }} />
          Nothing has been marked ready or shipped for this order yet.
        </div>
      </Section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {readies.length > 0 && (
        <FulfilmentBlock icon={<PackageCheck className="h-4 w-4" />} title="Partial ready" done={allReady} doneLabel="all items ready">
          {readies.map((r) => (
            <div key={r.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: "#E8E4DE" }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: "#1A1714" }}>Ready #{r.id}</p>
                {r.receivedDate && r.receivedDate > 0 ? (
                  <p className="text-xs" style={{ color: "#635D58" }}>Received: {formatDate(r.receivedDate)}</p>
                ) : null}
              </div>
              {r.note ? <p className="mt-2 text-xs" style={{ color: "#635D58" }}>Note: {r.note}</p> : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(r.orderItemReadyList || []).map((x, i) => (
                  <ItemLine key={i} orderItemId={x.orderItemId} quantity={x.quantity} unit={x.unit} itemsById={itemsById} verb="Ready" />
                ))}
              </div>
            </div>
          ))}
        </FulfilmentBlock>
      )}

      {partialFulfillments.length > 0 && (
        <FulfilmentBlock icon={<Truck className="h-4 w-4" />} title="Partial shipments" done={allShipped} doneLabel="all items shipped">
          {partialFulfillments.map((f) => (
            <ShipmentCard
              key={f.id}
              idLabel={`Shipment #${f.id}`}
              shippingCode={f.shippingCode}
              trackingUrl={f.trackingUrl}
              zohoPackageId={f.zohoPackageId}
              dispatchedOn={f.dispatchedOn}
              note={f.note}
            >
              {(f.orderItemFulfillmentList || []).map((x, i) => (
                <ItemLine
                  key={i}
                  orderItemId={x.orderItemId}
                  quantity={x.quantity}
                  unit={x.unit}
                  itemsById={itemsById}
                  verb="Fulfilled"
                  readyQtyHint={normalizeQty(readyQty(x.orderItemId, readies), x.unit)}
                />
              ))}
            </ShipmentCard>
          ))}
        </FulfilmentBlock>
      )}

      {hasFull && (
        <FulfilmentBlock icon={<Truck className="h-4 w-4" />} title="Full shipments">
          {itemShipments.map((s) => (
            <ShipmentCard
              key={s.key}
              idLabel="Shipment"
              shippingCode={s.shippingCode}
              trackingUrl={s.trackingUrl}
              zohoPackageId={s.zohoPackageId}
              dispatchedOn={s.dispatchedOn}
            >
              {s.items.map((it) => (
                <ItemLine key={it.id} orderItemId={it.id} quantity={it.quantity} unit={it.unit} itemsById={itemsById} verb="Shipped" />
              ))}
            </ShipmentCard>
          ))}
          {fullFulfillments.map((f) => (
            <ShipmentCard
              key={f.id}
              idLabel={`Shipment #${f.id}`}
              shippingCode={f.shippingCode}
              trackingUrl={f.trackingUrl}
              zohoPackageId={f.zohoPackageId}
              dispatchedOn={f.dispatchedOn}
              note={f.note}
            >
              {(f.orderItemFulfillmentList || []).map((x, i) => (
                <ItemLine key={i} orderItemId={x.orderItemId} quantity={x.quantity} unit={x.unit} itemsById={itemsById} verb="Fulfilled" />
              ))}
            </ShipmentCard>
          ))}
        </FulfilmentBlock>
      )}
    </div>
  );
}

// ── Cancel order drawer (DELETE /cancel/order via /api/crud — native+tested) ─

function CancelOrderDialog({
  orderId,
  open,
  onClose,
  onCancelled,
}: {
  orderId: number;
  open: boolean;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doCancel = useCallback(async () => {
    if (!reason.trim()) { setError("Cancellation reason is required."); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "cancel/order", method: "DELETE", body: { orderId, cancellationReason: reason.trim() } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || `Cancel failed (${res.status})`);
      onCancelled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setSaving(false);
    }
  }, [reason, orderId, onCancelled]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border bg-white shadow-2xl" style={{ borderColor: "#E8E4DE" }}>
        <div className="px-5 pt-5 pb-2">
          <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>Cancel order #{orderId}?</h3>
          <p className="mt-2 text-sm" style={{ color: "#635D58" }}>
            Every item is set to CANCELLED. Saves to the sandbox test DB only (never live).
          </p>
        </div>
        <div className="px-5 pb-2">
          <FormField label="Cancellation reason" required>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} autoFocus placeholder="e.g. Customer requested cancellation" />
          </FormField>
        </div>
        {error && (
          <div className="mx-5 mb-2 rounded-lg border px-3 py-2 text-xs" style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}>
            {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>Keep order</Button>
          <Button variant="danger" size="sm" onClick={doCancel} loading={saving}>{saving ? "Cancelling…" : "Cancel order"}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Update tracking drawer (PATCH /update/order/shipment via /api/crud) ─────

function UpdateTrackingDrawer({
  order,
  onClose,
  onSaved,
}: {
  order: OrderDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const openItems = order.items.filter((it) => it.orderStatus !== "CANCELLED");
  const [selected, setSelected] = useState<Set<number>>(new Set(openItems.map((it) => it.id)));
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shippingCode, setShippingCode] = useState("");
  const [zohoPackageId, setZohoPackageId] = useState("");
  const [estFrom, setEstFrom] = useState("");
  const [estTo, setEstTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const doSave = useCallback(async () => {
    if (!trackingUrl.trim() || !shippingCode.trim()) { setError("Tracking URL and shipping code are required."); return; }
    if (selected.size === 0) { setError("Select at least one item."); return; }
    setSaving(true); setError(null);
    try {
      const orderItemList = Array.from(selected).map((id) => ({
        id, trackingUrl: trackingUrl.trim(), shippingCode: shippingCode.trim(), zohoPackageId: zohoPackageId.trim() || undefined,
      }));
      const body: Record<string, unknown> = { orderId: order.id, orderItemList };
      if (estFrom.trim() || estTo.trim()) {
        body.shippingMode = { estimatedFromDay: Number(estFrom || 0), estimatedToDay: Number(estTo || 0) };
      }
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "update/order/shipment", method: "PATCH", body }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || `Save failed (${res.status})`);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [trackingUrl, shippingCode, zohoPackageId, estFrom, estTo, selected, order.id, onSaved]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl border-l" style={{ borderColor: "#E8E4DE" }}>
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>Update tracking — Order #{order.id}</h3>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: "#847D77" }}>×</button>
        </div>
        <div className="px-5 pt-4">
          <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}>
            Marks the selected items IN_TRANSIT and stamps dispatch date. Saves to the sandbox test DB only (never live).
          </div>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
          <FormField label="Tracking URL" required>
            <TextInput value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://track.example.com/…" autoFocus />
          </FormField>
          <FormField label="Shipping / courier code" required>
            <TextInput value={shippingCode} onChange={(e) => setShippingCode(e.target.value)} placeholder="e.g. BLUEDART-12345" />
          </FormField>
          <FormField label="Zoho package ID" hint="Optional">
            <TextInput value={zohoPackageId} onChange={(e) => setZohoPackageId(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Est. delivery from (days)" hint="Optional">
              <TextInput type="number" value={estFrom} onChange={(e) => setEstFrom(e.target.value)} />
            </FormField>
            <FormField label="Est. delivery to (days)" hint="Optional">
              <TextInput type="number" value={estTo} onChange={(e) => setEstTo(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Items to mark shipped">
            <div className="flex flex-col gap-2">
              {openItems.map((it) => (
                <label key={it.id} className="flex items-center gap-2 text-sm" style={{ color: "#302C28" }}>
                  <input type="checkbox" checked={selected.has(it.id)} onChange={() => toggle(it.id)} />
                  {it.productName} <span className="text-xs font-mono" style={{ color: "#847D77" }}>({it.sku})</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <Button variant="secondary" onClick={onClose} size="sm">Cancel</Button>
          {error && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{error}</span>}
          <Button variant="primary" onClick={doSave} size="sm" disabled={saving}>{saving ? "Saving…" : "Save tracking"}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface OrderDetailViewProps {
  order: OrderDetail;
  fulfillments: OrderFulfillment[];
  readies: OrderReady[];
  fulfilmentError?: string;
  orderWorkflows?: OrderWorkflowSummary[];
}

export function OrderDetailView({ order, fulfillments, readies, fulfilmentError, orderWorkflows = [] }: OrderDetailViewProps) {
  const router = useRouter();
  const hasDiscounts = order.couponApplied || order.loyaltyOrder || order.autoDiscount > 0;
  const isCancelled = !!order.cancellationReason || (order.items.length > 0 && order.items.every((it) => it.orderStatus === "CANCELLED"));
  const isDeleted = order.deleted;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);

  const [editingZoho, setEditingZoho] = useState(false);
  const [zohoValue, setZohoValue] = useState(order.zohoOrderId || "");
  const [savingZoho, setSavingZoho] = useState(false);
  const [zohoError, setZohoError] = useState<string | null>(null);

  const saveZoho = useCallback(async () => {
    setSavingZoho(true); setZohoError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "update/order", method: "PATCH", body: { id: order.id, zohoOrderId: zohoValue.trim() } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || `Save failed (${res.status})`);
      setEditingZoho(false);
      router.refresh();
    } catch (e) {
      setZohoError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingZoho(false);
    }
  }, [zohoValue, order.id, router]);

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/orders" style={{ color: "#847D77" }}>Orders</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>#{order.id}</span>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
                Order #{order.id}
              </h1>
              <StatusPill status={deriveOrderStatus(order.items)} />
              {order.loyaltyOrder && (
                <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: "#ECFDF5", color: "#047857" }}>
                  Wholesale program
                </span>
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Placed {formatDate(order.createdAt)}
              {order.zohoOrderId ? <> · Zoho #{order.zohoOrderId}</> : <> · not linked to Zoho</>}
              {" · "}{order.customerName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {order.zohoOrderId && (
              <a
                href={`https://inventory.zoho.com/app#/salesorders`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="sm">View in Zoho</Button>
              </a>
            )}
            {!isCancelled && !isDeleted && (
              <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>Cancel order</Button>
            )}
            <span
              className="inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "#FEF3C7", color: "#92400E" }}
            >
              Sandbox — writes never touch live
            </span>
          </div>
        </div>

        {order.deleted && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ background: "#FFF1F2", borderColor: "#FECDD3", color: "#9F1239" }}
          >
            This order has been deleted.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: items + fulfilment */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Order Items */}
            <Card padding="none">
              <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#F3F1ED" }}>
                <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                  Items <span className="font-sans text-xs font-normal" style={{ color: "#847D77" }}>({order.items.length})</span>
                </h3>
                {!isCancelled && !isDeleted && (
                  <Button variant="secondary" size="sm" onClick={() => setTrackingOpen(true)}>Update tracking</Button>
                )}
              </div>
              <div className="divide-y" style={{ borderColor: "#F3F1ED" }}>
                {order.items.map((item) => (
                  <div key={item.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "#F3F1ED" }}>
                        <Package className="h-4 w-4" style={{ color: "#AAA39E" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: "#1A1714" }}>{item.productName}</p>
                        {item.sku && <p className="text-xs font-mono" style={{ color: "#847D77" }}>SKU: {item.sku}</p>}
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs" style={{ color: "#635D58" }}>
                          <span>Qty <b style={{ color: "#1A1714" }}>{item.quantity} {item.unit}</b></span>
                          <PayBadge status={item.paymentStatus} />
                          {item.shippingCode && (
                            <span>
                              {item.shippingCode}
                              {item.trackingUrl && (
                                <a href={item.trackingUrl} target="_blank" rel="noopener noreferrer" className="ml-1 hover:underline" style={{ color: "#A86120" }}>
                                  Track
                                </a>
                              )}
                              {item.dispatchedOn > 0 && <span style={{ color: "#AAA39E" }}> · Dispatched {formatDate(item.dispatchedOn)}</span>}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-medium tabular-nums" style={{ color: "#1A1714" }}>
                          {formatMoney(item.price, item.currency)}
                        </span>
                        <StatusPill status={item.orderStatus} />
                      </div>
                    </div>
                    <ItemProduction
                      orderId={order.id}
                      item={item}
                      workflow={orderWorkflows.find((w) => w.orderItemId === item.id)}
                    />
                  </div>
                ))}
                {order.items.length === 0 && (
                  <p className="px-5 py-6 text-center text-sm" style={{ color: "#AAA39E" }}>No items on this order.</p>
                )}
              </div>
            </Card>

            {/* Fulfilment history — Partial Ready / Partial Shipments / Full Shipments */}
            <FulfilmentHistory order={order} fulfillments={fulfillments} readies={readies} error={fulfilmentError} />

            {/* Actions that stay proxied to live Loom (external side-effects: real
                customer emails / Freshchat / partial-fulfilment workflow) — visibly
                disabled per Phase 4 scope, never wired as writes. */}
            <div className="flex flex-wrap items-center gap-2">
              <DisabledAction label="Add partial fulfilment" note="Sends real customer notifications — enabled at launch (backend passthrough only)." />
              <DisabledAction label="Mark items ready" note="Sends real customer notifications — enabled at launch (backend passthrough only)." />
              <DisabledAction label="Send confirmation email" note="Sends a real customer email — enabled at launch (backend passthrough only)." />
              <DisabledAction label="Recalculate impact" note="Triggers a live compute over Zoho/order data — enabled at launch (backend passthrough only)." />
            </div>

            {/* Transactions */}
            {order.transactions.length > 0 && (
              <Section title="Transactions">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #F3F1ED" }}>
                        {["ID", "Transaction ref", "Amount", "Status", "Date"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {order.transactions.map((txn, i) => (
                        <tr key={txn.id} style={{ borderBottom: i < order.transactions.length - 1 ? "1px solid #F3F1ED" : undefined }}>
                          <td className="px-4 py-3 tabular-nums" style={{ color: "#635D58" }}>{txn.id}</td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "#302C28" }}>{txn.transactionId || "—"}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: "#302C28" }}>{formatMoney(txn.amount, txn.currency)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={txn.status === "PAID" ? "green" : txn.status === "FAILED" ? "red" : "stone"}>
                              {txn.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "#635D58" }}>{txn.createdAt || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}
          </div>

          {/* Right: financials + metadata + addresses (Custom Order sidebar idiom:
              bare Card + icon-labelled uppercase header, not the bigger Section title) */}
          <div className="flex flex-col gap-4">
            {/* Pricing — same shape + same card split as Custom Order: Pricing
                (subtotal/discounts/total) is its own card, Payment (advance/
                remaining/shipping cost) is a separate card below. */}
            <Card padding="none">
              <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#F3F1ED" }}>
                <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>Pricing</h3>
                <span className="text-[11px] uppercase tracking-wide" style={{ color: "#AAA39E" }}>{order.currency}</span>
              </div>
              <div className="flex flex-col gap-3 px-5 py-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#635D58" }}>Subtotal</span>
                  <span style={{ color: "#302C28" }}>{formatMoney(order.subTotal, order.currency)}</span>
                </div>
                {hasDiscounts && (
                  <>
                    {order.autoDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "#635D58" }}>Auto discount</span>
                        <span style={{ color: "#059669" }}>−{order.autoDiscount}%</span>
                      </div>
                    )}
                    {order.couponApplied && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "#635D58" }}>Coupon <code className="text-xs bg-stone-100 px-1 rounded">{order.couponCode}</code></span>
                        <span style={{ color: "#059669" }}>−{order.couponDiscount}% (−{formatMoney(order.couponDiscountAmount, order.currency)})</span>
                      </div>
                    )}
                    {order.loyaltyOrder && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "#635D58" }}>Loyalty discount</span>
                        <span style={{ color: "#059669" }}>−{order.loyaltyDiscount}% (−{formatMoney(order.loyaltyDiscountAmount, order.currency)})</span>
                      </div>
                    )}
                  </>
                )}
                <div className="mt-1 flex items-center justify-between border-t pt-3" style={{ borderColor: "#E8E4DE" }}>
                  <span className="text-base font-semibold" style={{ color: "#1A1714" }}>Total</span>
                  <span className="text-base font-semibold tabular-nums" style={{ color: "#A86120" }}>{formatMoney(order.total, order.currency)}</span>
                </div>
                {order.exchangeRate > 0 && (
                  <p className="text-[11px]" style={{ color: "#AAA39E" }}>
                    Exchange rate: 1 {order.currency} = ₹{(1 / order.exchangeRate).toFixed(2)} (to INR)
                  </p>
                )}
              </div>
            </Card>

            {/* Payment */}
            <Card>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>Payment</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#635D58" }}>Advance paid</span>
                  <span style={{ color: "#302C28" }}>{formatMoney(order.advancePay, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#635D58" }}>Remaining</span>
                  <span style={{ color: "#B45309" }}>{formatMoney(order.remainingPay, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#635D58" }}>Shipping cost</span>
                  <span style={{ color: "#302C28" }}>{formatMoney(order.shippingCost, order.currency)}</span>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
                <Info className="h-3.5 w-3.5" /> Order details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Payment mode" value={order.paymentMode || "—"} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#847D77" }}>Zoho order ID</p>
                  {editingZoho ? (
                    <div className="flex items-center gap-1.5">
                      <TextInput value={zohoValue} onChange={(e) => setZohoValue(e.target.value)} className="!py-1 !text-xs" />
                      <button className="text-xs font-medium" style={{ color: "#A86120" }} disabled={savingZoho} onClick={saveZoho}>
                        {savingZoho ? "…" : "Save"}
                      </button>
                      <button className="text-xs" style={{ color: "#847D77" }} onClick={() => { setEditingZoho(false); setZohoValue(order.zohoOrderId || ""); setZohoError(null); }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm flex items-center gap-2" style={{ color: "#1A1714" }}>
                      {order.zohoOrderId || "—"}
                      <button className="text-xs font-medium hover:underline" style={{ color: "#A86120" }} onClick={() => setEditingZoho(true)}>Edit</button>
                    </p>
                  )}
                  {zohoError && <p className="text-xs mt-1" style={{ color: "#B91C1C" }}>{zohoError}</p>}
                </div>
                <Field label="Loyalty order" value={order.loyaltyOrder ? "Yes" : "No"} />
                <Field label="Gift" />
              </div>
            </Card>

            {order.note && (
              <Card>
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
                  Customer note
                </p>
                <p className="text-xs" style={{ color: "#635D58" }}>{order.note}</p>
              </Card>
            )}

            {/* Addresses */}
            {order.shippingAddress && (
              <Card>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
                  <MapPin className="h-3.5 w-3.5" /> Shipping address
                </p>
                <div className="text-sm flex flex-col gap-0.5" style={{ color: "#302C28" }}>
                  <div className="font-medium">{order.shippingAddress.name}</div>
                  {order.shippingAddress.addressLineOne && <div>{order.shippingAddress.addressLineOne}</div>}
                  <div>{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}</div>
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.primaryPhone && <div className="mt-1 text-xs" style={{ color: "#635D58" }}>{order.shippingAddress.primaryPhone}</div>}
                  {order.shippingAddress.contactEmail && <div className="text-xs" style={{ color: "#635D58" }}>{order.shippingAddress.contactEmail}</div>}
                </div>
              </Card>
            )}
            {order.billingAddress && (
              <Card>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
                  <CreditCard className="h-3.5 w-3.5" /> Billing address
                </p>
                <div className="text-sm flex flex-col gap-0.5" style={{ color: "#302C28" }}>
                  <div className="font-medium">{order.billingAddress.name}</div>
                  {order.billingAddress.addressLineOne && <div>{order.billingAddress.addressLineOne}</div>}
                  <div>{[order.billingAddress.city, order.billingAddress.state, order.billingAddress.postalCode].filter(Boolean).join(", ")}</div>
                  <div>{order.billingAddress.country}</div>
                </div>
              </Card>
            )}

            {order.cancellationReason && (
              <Card>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#B91C1C" }}>
                  Cancellation reason
                </p>
                <p className="text-xs" style={{ color: "#635D58" }}>{order.cancellationReason}</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <CancelOrderDialog
        orderId={order.id}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onCancelled={() => { setCancelOpen(false); router.refresh(); }}
      />
      {trackingOpen && (
        <UpdateTrackingDrawer
          order={order}
          onClose={() => setTrackingOpen(false)}
          onSaved={() => { setTrackingOpen(false); router.refresh(); }}
        />
      )}
    </WeaveShell>
  );
}
