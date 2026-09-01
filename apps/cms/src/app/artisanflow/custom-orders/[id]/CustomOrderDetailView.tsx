/**
 * Custom-order detail — ONE view of the order's lines, plus the money rail.
 *
 * CONSOLIDATED 2026-08-16. This page used to render the Production card AND an
 * "Items (24)" card underneath it, and the Items card repeated each line's
 * workflow progress a second time ("2/8 subprocesses · 38% · Yarn Weaving ·
 * INITIATED · View production"). Amit: "two views are not needed, any one view
 * is fine… the first view is more than enough… I like it better: how much is
 * ready, how much is ordered."
 *
 * So the Items card is GONE and OrderProductionWatch is the single per-line
 * table. The four things only Items carried are folded into it rather than
 * dropped: the product IMAGE and line PRICE ride on the model
 * (buildCustomOrderProductionWatch), and the two WRITE affordances are injected
 * as slots — headerAction={<AddItemButton/>} and renderRowActions={…
 * <ItemActions/>}. Slots, not imports, so the shared table stays read-only and
 * server-renderable and the custom-orders list expand can pass neither.
 *
 * The old bottom "Partial ready / Partial shipments / Full shipments" cards were
 * removed at the same time, for the same one-place reason: every event they
 * showed (quantity, date, record id, carrier, tracking URL, Zoho package, note)
 * also renders in the per-line "Ready & dispatch history" disclosure on the row
 * it belongs to, grouped by ITEM instead of by shipment.
 *
 * PARTLY REVERSED 2026-08-17, and the reasoning above was wrong about one
 * thing. Amit: "We need this partial dispatch information towards the end...
 * what the partial dispatch is and which of them are dispatched via what."
 * Grouping by item and grouping by BATCH are not two views of one list — an
 * item-grouped history physically cannot answer "what went in the 13 July DTDC
 * shipment", because that answer spans lines. So OrderBatchesSection is back at
 * the bottom as the consignment-axis roll-up.
 *
 * What is NOT reintroduced is the duplication that was actually wrong: the old
 * cards repeated each line's workflow progress and status. The new section
 * carries consignment facts only (batch id, date, carrier, tracking, the lines
 * and their quantities) and no progress, status or row actions, so the two
 * views stay obviously different rather than competing.
 */

import React from "react";
import { Card, Button } from "@/components/ui";
import { StatusPill } from "@/components/artisanflow/StatusPill";
import { customOrderRollupStatus } from "@/components/artisanflow/orderStatus";
import { formatMoney, formatEpoch } from "@/lib/utils";
import {
  computeCustomOrderMoney,
  type CustomOrderDetail,
  type CustomOrderItem,
} from "@/lib/artisanflow-api";
import { OrderPricingManager } from "../manage/OrderPricingManager";
import { ItemActions } from "../manage/ItemActions";
import { AddItemButton, type ProductLite } from "../manage/AddItemButton";
import { OrderHeaderActions } from "../manage/OrderHeaderActions";
import { orderWriteCapability } from "../manage/crud";
import { OrderProductionWatch } from "@/components/artisanflow/OrderProductionWatch";
import type { OrderProductionWatch as OrderProductionWatchModel } from "@/lib/order-production-watch";
import type { CustomOrderReady, CustomOrderFulfillment, OrderImpact } from "@/lib/artisanflow-api";
import type { RosterArtisan } from "@/lib/order-artisan-roster";
import { ArtisanNamesCell } from "./ArtisanNamesCell";
import { OrderBatchesSection } from "./OrderBatchesSection";
import { OrderImpactPanel } from "./OrderImpactPanel";
import { Mail, StickyNote, NotebookPen, User, ShieldAlert } from "lucide-react";

// ── View ────────────────────────────────────────────────────────────────────

export function CustomOrderDetailView({
  order,
  products = [],
  watch,
  readies = [],
  fulfillments = [],
  artisanRoster,
  impact = null,
  impactUnavailable,
}: {
  order: CustomOrderDetail;
  products?: ProductLite[];
  watch: OrderProductionWatchModel;
  /** Batch sources for the order-level roll-up at the bottom. */
  readies?: CustomOrderReady[];
  fulfillments?: CustomOrderFulfillment[];
  /** workflowId -> distinct artisans, for the ARTISAN column. */
  artisanRoster?: Map<number, RosterArtisan[]>;
  impact?: OrderImpact | null;
  impactUnavailable?: string;
}) {
  const money = computeCustomOrderMoney(order);
  // ONE rule for every write control on this screen and for the badge above them.
  const orderWrite = orderWriteCapability(order.id);
  const items = order.orderItems || [];
  const orderLabel = `#${order.id}${order.tenant?.name ? ` \u00b7 ${order.tenant.name}` : ""}`;

  // Edit/Delete need the FULL order item (price, quantity, currency), which the
  // watch row deliberately does not carry — it is a production model, not an
  // order-item mirror. Index once, look up per row.
  const itemById = new Map<number, CustomOrderItem>(items.map((it) => [it.id, it]));

  return (
    <div className="flex flex-col gap-6 max-w-[1800px]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              Custom Order #{order.id}
            </h1>
            {/* The ORDER-level roll-up over every line, not the first line's own
                status — see customOrderRollupStatus. This header used to read
                PROCESSING for order 132440539 while the list read IN TRANSIT,
                because line 1 of 24 is PROCESSING and lines 23-24 are shipped.
                Both screens now compute the same function, so they cannot drift. */}
            <StatusPill
              status={
                order.deleted
                  ? "CANCELLED"
                  : customOrderRollupStatus(order.orderItems || []) || "INITIATED"
              }
            />
            {order.loyaltyOrder && (
              <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: "#ECFDF5", color: "#047857" }}>
                Wholesale program
              </span>
            )}
          </div>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Placed {formatEpoch(order.createdAt)}
            {order.zohoOrderId ? <> · Zoho #{order.zohoOrderId}</> : <> · not linked to Zoho</>}
            {" · "}{order.orderType}
          </p>
        </div>
        {/* flex-wrap, not nowrap: at 390 this row was 87px wider than <main>,
            pushing the "Sandbox — writes never touch live" badge off-screen
            behind main's own overflow scroll. The badge is a write-safety
            warning; it is the last thing that may be scrolled out of sight. */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {order.zohoOrderId && (
            <a href="https://inventory.zoho.com/app#/salesorders" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">View in Zoho</Button>
            </a>
          )}
          <OrderHeaderActions orderId={order.id} />
          {/* THE BADGE HAS TO MATCH THE BUTTONS. It used to read "writes never
              touch live" on every order, including the live-mirrored ones whose
              pencil, trash and Add item were fully enabled — a promise the screen
              could not keep. Now it states which of the two orders this is, and the
              controls beside it are disabled to match. */}
          <span
            className="inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={
              orderWrite.ok
                ? { background: "#FEF3C7", color: "#92400E" }
                : { background: "#F5F5F4", color: "#57534E" }
            }
            title={orderWrite.ok ? undefined : orderWrite.reason}
          >
            {orderWrite.ok ? "Sandbox — writes never touch live" : "Live-mirrored — read-only"}
          </span>
        </div>
      </div>

      {/* LAYOUT — audit 2026-08-16 B-1. This used to be `max-w-6xl` + a
          `lg:grid-cols-3` split with the table on 2 of 3 columns. Both halves of
          that were wrong at once: the 6xl cap (1152px) meant 1440 and 1600
          rendered IDENTICALLY (the extra viewport became whitespace), and the
          2/3 column left the table a 758px window onto ~1110px of content — so
          the STAGES column and every row action sat off-screen with no visible
          scrollbar. Measured before: scrollWidth 1107 / clientWidth 758 at BOTH
          1440 and 1600.

          The fix is the LAYOUT, not the columns — nothing was deleted or shrunk.
          The table now owns the full content width; the money/customer rail sits
          BELOW it as a card grid. The rail only returns to a right-hand column
          at >=1780px, where the table still keeps >=1150px. Do not reintroduce a
          `lg:`-level split here: at 1440 the content box is 1152px, and giving
          the table two thirds of that reopens exactly this blocker. */}
      <div className="grid grid-cols-1 gap-6 min-[1780px]:grid-cols-[minmax(0,1fr)_390px]">
        {/* The ONE per-line table (production + quantities + money + row
            actions). Nothing else belongs alongside it — a second summary of
            the same lines is the exact duplication this page was consolidated
            to remove. */}
        <div className="flex min-w-0 flex-col gap-6">
          <OrderProductionWatch
            watch={watch}
            orderId={order.id}
            orderKind="custom-order"
            orderLabel={orderLabel}
            currency={order.currency}
            headerAction={
              <AddItemButton orderId={order.id} currency={order.currency} orderType={order.orderType} products={products} />
            }
            renderRowActions={(row) => {
              const it = itemById.get(row.orderItemId);
              return it ? <ItemActions item={it} currency={order.currency} orderId={order.id} /> : null;
            }}
            /* WHO, not just whether. Passing this slot is what upgrades the
               ARTISAN column from the literal word "Assigned" to real names;
               the list expand deliberately does not pass it (see the slot's
               own comment for the cost that buys). */
            renderArtisan={(row) => (
              <ArtisanNamesCell
                roster={(row.workflowId != null && artisanRoster?.get(row.workflowId)) || []}
                assigned={row.assigned}
              />
            )}
          />
        </div>

        {/* Money + customer + meta, in the plain Order detail page's rail order:
            Pricing, Payment, then metadata. Below the table it lays out as a
            card grid (so it is a short band, not a tall column); at >=1780px it
            collapses back to a single-column right-hand rail. Pricing keeps the
            widest cell in both arrangements because it carries the adjustments
            ledger. */}
        <div className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-3 min-[1780px]:grid-cols-1">
          <Card padding="none">
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#F3F1ED" }}>
              <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>Pricing</h3>
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-wide" style={{ color: "#AAA39E" }}>{order.currency}</span>
                <OrderPricingManager order={order} />
              </div>
            </div>
            <div className="px-5 py-4 text-sm">
              <Row label={`Subtotal`} value={formatMoney(money.subTotal, order.currency)} />
              <Row
                label="Wholesale program discount"
                value={
                  order.loyaltyOrder && money.loyaltyDiscountAmount > 0
                    ? `- ${formatMoney(money.loyaltyDiscountAmount, order.currency)} (${money.loyaltyDiscountPct.toFixed(2)}%)`
                    : "N/A"
                }
                muted
              />
              <Row label="Total" value={formatMoney(money.total, order.currency)} strong />
              {money.visibleAdjustments.length > 0 && (
                <div className="my-2 border-t pt-2" style={{ borderColor: "#F3F1ED" }}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
                    Adjustments
                  </p>
                  {money.visibleAdjustments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-1">
                      <span style={{ color: "#635D58" }}>
                        {a.particular || "—"}
                        <span
                          className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={a.adjustmentType === 1
                            ? { background: "#ECFDF5", color: "#047857" }
                            : { background: "#FEF2F2", color: "#B91C1C" }}
                        >
                          {a.adjustmentType === 1 ? "+ add" : "− subtract"}
                        </span>
                      </span>
                      <span className="tabular-nums" style={{ color: "#1A1714" }}>
                        {a.adjustmentType === 1 ? "+ " : "− "}
                        {formatMoney(a.adjustmentAmount, order.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between border-t pt-3" style={{ borderColor: "#E8E4DE" }}>
                <span className="text-base font-semibold" style={{ color: "#1A1714" }}>Adjusted total</span>
                <span className="text-base font-semibold tabular-nums" style={{ color: "#A86120" }}>
                  {formatMoney(order.adjustedTotal, order.currency)}
                </span>
              </div>
              <p className="mt-2 text-[11px]" style={{ color: "#AAA39E" }}>
                Adjusted total is the saved (persisted) value — total {money.visibleAdjustments.length || order.loyaltyOrder ? "± adjustments" : "(no adjustments)"}, as stored on the order.
              </p>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>Payment</p>
            <Row label="Advance paid" value={formatMoney(order.advancePay, order.currency)} small />
            <Row label="Remaining" value={formatMoney(order.remainingPay, order.currency)} small />
            <Row label="Shipping cost" value={formatMoney(order.shippingCost, order.currency)} small />
          </Card>

          <Card>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
              <User className="h-3.5 w-3.5" /> Customer
            </p>
            <p className="text-sm font-medium" style={{ color: "#1A1714" }}>{order.tenant?.name || "—"}</p>
            {order.tenant?.email && <p className="text-xs" style={{ color: "#635D58" }}>{order.tenant.email}</p>}
            {order.tenant?.contactNumber && <p className="text-xs" style={{ color: "#635D58" }}>{order.tenant.contactNumber}</p>}
          </Card>

          {(order.ccEmails || []).length > 0 && (
            <Card>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
                <Mail className="h-3.5 w-3.5" /> CC emails
              </p>
              {order.ccEmails.map((e, i) => (
                <p key={i} className="text-xs" style={{ color: "#635D58" }}>{e}</p>
              ))}
            </Card>
          )}

          {/* TWO different notes, and live keeps them apart on purpose — so do we.
              `note` is what the CUSTOMER sent with the order; `globalNote` is the
              internal running commentary staff keep against it ("July 27: 3 kantha
              stitch fabric is in production stage. Jallaluddin will share the images
              of initial sample."). The audit found we rendered only the first, and
              this order has the first EMPTY and the second populated — so the whole
              card disappeared and the internal commentary was dropped page-wide.
              Merging them into one "Note" would be worse than dropping it: staff
              would read an internal status line as something the customer wrote. */}
          {order.note && (
            <Card>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
                <StickyNote className="h-3.5 w-3.5" /> Customer note
              </p>
              <p className="whitespace-pre-wrap text-xs" style={{ color: "#635D58" }}>{order.note}</p>
            </Card>
          )}

          {order.globalNote && (
            <Card>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#92400E" }}>
                <NotebookPen className="h-3.5 w-3.5" /> Global note
              </p>
              <p className="whitespace-pre-wrap text-xs" style={{ color: "#635D58" }}>{order.globalNote}</p>
              <p className="mt-1.5 text-[10px]" style={{ color: "#AAA39E" }}>
                Internal running commentary on the whole order. Read-only here — live edits it in place.
              </p>
            </Card>
          )}

          {order.cancellationReason && (
            <Card>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#B91C1C" }}>
                <ShieldAlert className="h-3.5 w-3.5" /> Cancellation reason
              </p>
              <p className="text-xs" style={{ color: "#635D58" }}>{order.cancellationReason}</p>
            </Card>
          )}
        </div>
      </div>

      {/* ── BOTTOM OF THE PAGE, in the order Amit asked for them ──────────
          Both are ORDER-level roll-ups, which is why they sit below the
          per-line table rather than inside the rail: they summarise across
          lines, and a rail card would imply they belong to one. */}
      <OrderBatchesSection readies={readies} fulfillments={fulfillments} rows={watch.rows} />

      <OrderImpactPanel impact={impact} orderId={order.id} unavailableReason={impactUnavailable} />
    </div>
  );
}

function Row({ label, value, strong, muted, small }: { label: string; value: string; strong?: boolean; muted?: boolean; small?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${small ? "py-0.5" : "py-1.5"}`}>
      <span className={small ? "text-xs" : "text-sm"} style={{ color: muted ? "#847D77" : "#635D58" }}>{label}</span>
      <span
        className={`tabular-nums ${strong ? "text-base font-semibold" : small ? "text-xs" : "text-sm"}`}
        style={{ color: strong ? "#1A1714" : muted ? "#847D77" : "#1A1714" }}
      >
        {value}
      </span>
    </div>
  );
}
