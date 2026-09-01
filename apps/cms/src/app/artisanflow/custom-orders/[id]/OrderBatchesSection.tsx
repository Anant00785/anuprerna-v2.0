/**
 * OrderBatchesSection — the ORDER-LEVEL roll-up of partial ready and dispatch
 * batches, at the bottom of the custom-order detail page.
 *
 * Amit, 2026-08-17: "We need this partial dispatch information towards the
 * end... what the partial dispatch is and which of them are dispatched via
 * what. That information we had before."
 *
 * ── WHY THIS IS NOT A DUPLICATE OF THE PER-LINE HISTORY ────────────────────
 * The row-level "Ready & dispatch history" disclosure in OrderProductionWatch
 * shows the SAME events grouped BY ITEM: for one line, its dated sequence. This
 * section groups the same facts BY BATCH: for one receipt or one shipment, every
 * line that travelled in it. They answer different questions —
 *   per line:  "how did THIS fabric arrive, over time?"
 *   per batch: "what went in the 13 July DTDC shipment?"
 * — and only the batch view can answer the second, because an item-grouped list
 * physically cannot show two lines sharing one consignment.
 *
 * These cards existed before, were removed on 2026-08-16 when the page was
 * consolidated (the reasoning is in CustomOrderDetailView's header), and are
 * restored here because that consolidation dropped the batch axis entirely. The
 * duplication that was actually wrong then — repeating each line's workflow
 * progress twice — is not reintroduced: this section carries no status, no
 * progress and no per-line actions, only the consignment facts.
 *
 * ── FIELD NAMES ARE THE REAL ONES ──────────────────────────────────────────
 * Measured against relational.custom_order_fulfillment_full on 2026-08-17.
 * Dispatch carries: shippingCode, trackingUrl, zohoPackageId, dispatchedOn,
 * estimatedDeliveryFrom/To, note.
 *
 * `shippingMode` IS DELIBERATELY NOT RENDERED. It exists on the table, but in
 * all 182 sandbox rows its value is the literal two-character string "{}" —
 * never a courier, never a mode. `shippingCode` is the field that actually
 * carries the carrier ("DTDC", "DHL", "India Post", "SHREE ANJANI"), so that is
 * what is labelled Courier. Rendering shippingMode would print "{}" next to
 * every shipment.
 */

import React from "react";
import { PackageCheck, Truck, ExternalLink } from "lucide-react";
import { formatEpoch } from "@/lib/utils";
import type { CustomOrderReady, CustomOrderFulfillment } from "@/lib/artisanflow-api";
import type { ProductionWatchRow } from "@/lib/order-production-watch";

interface LineRef {
  sku: string;
  name: string;
  image?: string;
}

/** A batch line, after the item id is resolved against the order's own lines. */
interface BatchLine {
  orderItemId: number;
  quantity: number;
  unit: string;
  ref: LineRef | null;
}

function fmtQty(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
}

/** Total per batch, labelled with the unit only when the batch shares ONE — a
 *  mixed-unit batch gets a bare number rather than a confidently wrong "METER". */
function totalOf(lines: BatchLine[]): { total: number; unit: string } {
  const total = lines.reduce((t, l) => t + (Number(l.quantity) || 0), 0);
  const units = Array.from(new Set(lines.map((l) => (l.unit || "").toUpperCase()).filter(Boolean)));
  return { total, unit: units.length === 1 ? units[0] : "" };
}

export function OrderBatchesSection({
  readies,
  fulfillments,
  rows,
}: {
  readies: CustomOrderReady[];
  fulfillments: CustomOrderFulfillment[];
  /** The production model's lines — the ONLY source of sku/name/image here, so
   *  this section cannot drift from the table above it. */
  rows: ProductionWatchRow[];
}) {
  const refById = new Map<number, LineRef>();
  for (const r of rows) refById.set(r.orderItemId, { sku: r.sku, name: r.name, image: r.image });

  // Newest first, on each stream's OWN date field. Ready batches are dated by
  // receivedDate and dispatches by dispatchedOn; both fall back to createdAt,
  // which is what the record was written, not what happened.
  const readyBatches = [...(readies || [])]
    .map((b) => {
      const lines: BatchLine[] = (b.customOrderItemReadyList || []).map((i) => ({
        orderItemId: i.customOrderItemId,
        quantity: i.quantity,
        unit: i.unit,
        ref: refById.get(i.customOrderItemId) ?? null,
      }));
      return { batch: b, at: b.receivedDate || b.createdAt || 0, dated: !!b.receivedDate, lines };
    })
    .sort((a, b) => b.at - a.at);

  const dispatchBatches = [...(fulfillments || [])]
    .map((b) => {
      const lines: BatchLine[] = (b.customOrderItemFulfillmentList || []).map((i) => ({
        orderItemId: i.customOrderItemId,
        quantity: i.quantity,
        unit: i.unit,
        ref: refById.get(i.customOrderItemId) ?? null,
      }));
      return { batch: b, at: b.dispatchedOn || b.createdAt || 0, dated: !!b.dispatchedOn, lines };
    })
    .sort((a, b) => b.at - a.at);

  if (readyBatches.length === 0 && dispatchBatches.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
          Ready &amp; dispatch batches
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: "#847D77" }}>
          The same events the per-line “Ready &amp; dispatch history” shows, grouped by CONSIGNMENT
          instead of by item — what arrived together, and what shipped together. Newest first.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ── PARTIAL READY ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4" style={{ color: "#047857" }} />
            <h3 className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
              Partial ready · {readyBatches.length} {readyBatches.length === 1 ? "batch" : "batches"}
            </h3>
          </div>
          {readyBatches.length === 0 ? (
            <EmptyNote>Nothing recorded as ready yet.</EmptyNote>
          ) : (
            readyBatches.map(({ batch, at, dated, lines }) => {
              const { total, unit } = totalOf(lines);
              return (
                <BatchCard
                  key={batch.id}
                  accent="#047857"
                  title={`Ready #${batch.id}`}
                  dateLabel={dated ? "Received" : "Recorded"}
                  at={at}
                  total={total}
                  unit={unit}
                  lines={lines}
                  note={batch.note}
                />
              );
            })
          )}
        </div>

        {/* ── DISPATCH ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" style={{ color: "#A86120" }} />
            <h3 className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
              Dispatched · {dispatchBatches.length} {dispatchBatches.length === 1 ? "shipment" : "shipments"}
            </h3>
          </div>
          {dispatchBatches.length === 0 ? (
            <EmptyNote>Nothing dispatched yet.</EmptyNote>
          ) : (
            dispatchBatches.map(({ batch, at, dated, lines }) => {
              const { total, unit } = totalOf(lines);
              return (
                <BatchCard
                  key={batch.id}
                  accent="#A86120"
                  title={`Shipment #${batch.id}`}
                  dateLabel={dated ? "Dispatched" : "Recorded"}
                  at={at}
                  total={total}
                  unit={unit}
                  lines={lines}
                  note={batch.note}
                  shipping={{
                    courier: batch.shippingCode,
                    trackingUrl: batch.trackingUrl,
                    zohoPackageId: batch.zohoPackageId,
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border px-4 py-3 text-xs" style={{ borderColor: "#E8E4DE", background: "#FAF9F7", color: "#847D77" }}>
      {children}
    </div>
  );
}

function BatchCard({
  accent,
  title,
  dateLabel,
  at,
  total,
  unit,
  lines,
  note,
  shipping,
}: {
  accent: string;
  title: string;
  dateLabel: string;
  at: number;
  total: number;
  unit: string;
  lines: BatchLine[];
  note?: string;
  shipping?: { courier?: string; trackingUrl?: string; zohoPackageId?: string };
}) {
  const trimmedNote = (note || "").trim();
  const courier = (shipping?.courier || "").trim();
  const tracking = (shipping?.trackingUrl || "").trim();
  const zoho = (shipping?.zohoPackageId || "").trim();

  return (
    <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#E8E4DE" }}>
      <div
        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b px-4 py-2.5"
        style={{ borderColor: "#F3F1ED" }}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-mono text-xs font-semibold" style={{ color: accent }}>{title}</span>
          <span className="text-[11px]" style={{ color: "#847D77" }}>
            {dateLabel}: {formatEpoch(at)}
          </span>
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: "#635D58" }}>
          {lines.length} {lines.length === 1 ? "item" : "items"} · {fmtQty(total)}
          {unit ? <span style={{ color: "#AAA39E" }}> {unit}</span> : null}
        </span>
      </div>

      {/* HOW it went. Only rendered when the shipment actually carries it —
          an empty "Courier: —" row on every card is noise, not information. */}
      {(courier || tracking || zoho) && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2 text-[11px]"
          style={{ borderColor: "#F3F1ED", background: "#FDFBF7" }}
        >
          {courier && (
            <span style={{ color: "#635D58" }}>
              Courier <span className="font-semibold" style={{ color: "#1A1714" }}>{courier}</span>
            </span>
          )}
          {tracking && (
            <a
              href={tracking}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium underline"
              style={{ color: "#A86120" }}
            >
              Track <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {zoho && <span style={{ color: "#847D77" }}>Zoho pkg {zoho}</span>}
        </div>
      )}

      <ul>
        {lines.map((l, i) => (
          <li
            key={`${l.orderItemId}-${i}`}
            className="flex items-center gap-2.5 px-4 py-2"
            style={i > 0 ? { borderTop: "1px solid #F7F5F1" } : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {l.ref?.image ? (
              <img src={l.ref.image} alt="" className="h-8 w-8 flex-shrink-0 rounded-md object-cover" />
            ) : (
              <div className="h-8 w-8 flex-shrink-0 rounded-md" style={{ background: "#F3F1ED" }} />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] font-semibold" style={{ color: "#1A1714" }}>
                {l.ref?.sku || "—"}
              </p>
              <p className="truncate text-[11px]" style={{ color: "#635D58" }} title={l.ref?.name}>
                {/* A batch can reference a line that is no longer on the order.
                    Say so rather than rendering a blank row. */}
                {l.ref?.name ?? "Item not on this order any more"}
              </p>
              <p className="text-[10px]" style={{ color: "#AAA39E" }}>Item #{l.orderItemId}</p>
            </div>
            <span className="flex-shrink-0 text-xs tabular-nums" style={{ color: "#1A1714" }}>
              {fmtQty(l.quantity)} <span style={{ color: "#AAA39E" }}>{l.unit}</span>
            </span>
          </li>
        ))}
      </ul>

      {trimmedNote && (
        <p className="border-t px-4 py-2 text-[11px]" style={{ borderColor: "#F3F1ED", color: "#847D77" }}>
          {trimmedNote}
        </p>
      )}
    </div>
  );
}
