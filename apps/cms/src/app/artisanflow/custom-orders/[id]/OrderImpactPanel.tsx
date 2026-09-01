/**
 * OrderImpactPanel — the per-order Impact Dashboard, ported from live.
 *
 * Live renders this from ONE shared Angular component
 * (live-weave-ref/.../order-detail/order-impact-dashboard/) whose only switch is
 * a `[custom]` input, because custom orders have their OWN endpoint —
 * request-mapper.service.ts keeps '/get/impact/order/' and
 * '/get/impact/custom-order/' strictly separate. Calling the regular endpoint
 * with a custom order id returns a well-formed ALL-ZERO envelope, which is the
 * single most dangerous failure mode here: it looks like a working dashboard
 * reporting an order with no impact.
 *
 * ── THE HONESTY RULE THIS COMPONENT EXISTS TO ENFORCE ──────────────────────
 * Nothing on this panel is ever computed, inferred or back-filled by us. Every
 * figure is copied from the impact row as Loom calculated it. Where a figure is
 * null it renders as "not calculated", NEVER as 0 — a zero is a measurement and
 * a null is an absence, and collapsing the two would silently claim an order
 * saved 0 litres of water when nobody ever worked it out.
 *
 * Hours are the field most likely to be null: they are
 * `fabricMeters x avgWorkHoursPerMeter`, and that constant is configured PER
 * PRODUCT SUB-CATEGORY, not globally. When it is unset the row comes back
 * PARTIAL with AVG_ARTISAN_WORK_HOURS_PER_METER_NOT_CONFIGURED and carries no
 * hour fields at all.
 *
 * ── WHEN THERE IS NO DATA ──────────────────────────────────────────────────
 * The panel states plainly that impact has not been calculated for the order and
 * stops. It does not hide itself, because "the section is missing" and "the
 * numbers are missing" are different facts to an operator, and it does not
 * render an empty grid of zeroes, because that is a lie with a nice layout.
 */

import React from "react";
import { Leaf, AlertCircle } from "lucide-react";
import type { OrderImpact, OrderImpactItem } from "@/lib/artisanflow-api";

/**
 * Operator words for the pendingReason enum, per Amit 2026-08-17: "surface the
 * pendingReason in operator words, not the raw enum."
 *
 * Live's own formatPendingReason only lowercases and strips underscores
 * ("avg artisan work hours per meter not configured"), which is still the enum
 * wearing a hat — it never says WHERE the missing setting lives, which is the
 * one thing the reader needs in order to fix it. The tokens are comma-separated
 * and compose, so each is translated independently.
 *
 * The four observed in the sandbox (129 rows) are all covered; anything new
 * degrades to live's transform rather than being dropped.
 */
const PENDING_REASON_WORDS: Record<string, string> = {
  AVG_ARTISAN_WORK_HOURS_PER_METER_NOT_CONFIGURED:
    "Average artisan work-hours per metre is not set on this product's sub-category",
  SUB_CATEGORY_AVG_WORK_HOURS_PER_METER_NOT_CONFIGURED:
    "Average work-hours per metre is not set on this product's sub-category",
  AVG_WORK_HOURS_PER_PRODUCT_NOT_CONFIGURED:
    "Average work-hours per product is not set on this product",
  FABRIC_USED_PER_PRODUCT_IN_METERS_NOT_CONFIGURED:
    "Fabric used per product (in metres) is not set on this product",
  WORKFLOW_NOT_CONFIGURED:
    "This line has no production workflow, so its work hours cannot be derived",
};

export function formatPendingReason(reason: string | null | undefined): string {
  if (!reason) return "";
  return reason
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => PENDING_REASON_WORDS[t] ?? t.replace(/_/g, " ").toLowerCase())
    .join("; ");
}

/** A measured zero prints as "0"; an absent figure prints as "not calculated".
 *  These must never render the same way — see the honesty rule above. */
function Metric({ label, value, unit, tone }: { label: string; value: number | null | undefined; unit: string; tone?: string }) {
  const missing = value == null;
  return (
    <div className="rounded-xl border px-4 py-3" style={{ borderColor: "#E8E4DE", background: "#FFFFFF" }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>{label}</p>
      {missing ? (
        <p className="mt-1 text-xs italic" style={{ color: "#AAA39E" }}>not calculated</p>
      ) : (
        <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: tone || "#1A1714" }}>
          {round(value)} <span className="text-[11px] font-normal" style={{ color: "#847D77" }}>{unit}</span>
        </p>
      )}
    </div>
  );
}

function round(n: number): string {
  const r = Math.round(n * 100) / 100;
  return r.toLocaleString("en-IN");
}

function cell(v: number | null | undefined): React.ReactNode {
  return v == null ? <span style={{ color: "#D6D1CA" }}>—</span> : round(v);
}

export function OrderImpactPanel({
  impact,
  orderId,
  unavailableReason,
}: {
  impact: OrderImpact | null;
  orderId: number;
  /** Why there is nothing to show, when the caller already knows. Rendered
   *  verbatim so an operator can tell "never calculated" from "we could not
   *  reach the service". */
  unavailableReason?: string;
}) {
  const items: OrderImpactItem[] = impact?.items ?? [];
  // "Present" means a real row exists — not merely a 200 with a zeroed body,
  // which is exactly what the WRONG endpoint returns for a custom order.
  const hasData = !!impact && items.length > 0;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
          <Leaf className="h-4 w-4" style={{ color: "#047857" }} /> Impact
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: "#847D77" }}>
          Calculated by Loom from each line&apos;s fabric and workflow. Figures are copied as calculated —
          never recomputed here.
        </p>
      </div>

      {!hasData ? (
        <div
          className="flex items-start gap-3 rounded-xl border px-4 py-3.5"
          style={{ borderColor: "#FDE9C5", background: "#FFF8F0" }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#B45309" }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#8A4C19" }}>
              Impact has not been calculated for this order.
            </p>
            <p className="mt-1 text-xs" style={{ color: "#8A4C19" }}>
              {unavailableReason ??
                `No impact rows exist for custom order #${orderId}. Nothing is shown rather than a zeroed dashboard — a 0 here would read as "this order saved no water", which is not what the absence means.`}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className="rounded-full px-2.5 py-1 font-semibold"
              style={{ background: "#ECFDF5", color: "#047857" }}
            >
              {impact!.completeItems} complete
            </span>
            <span
              className="rounded-full px-2.5 py-1 font-semibold"
              style={{ background: impact!.partialItems > 0 ? "#FEF3C7" : "#F5F5F4", color: impact!.partialItems > 0 ? "#92400E" : "#78716C" }}
            >
              {impact!.partialItems} pending
            </span>
            {impact!.configurationError && (
              <span className="rounded-full px-2.5 py-1 font-semibold" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                {impact!.configurationError}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <Metric label="Fabric" value={impact!.fabricMeters} unit="m" />
            <Metric label="CO2 offset" value={impact!.co2OffsetKg} unit="kg" tone="#047857" />
            <Metric label="Water saved" value={impact!.waterSavedLitres} unit="L" tone="#0369A1" />
            <Metric label="Artisan hours" value={impact!.artisanHours} unit="hrs" />
            <Metric label="Women artisan hours" value={impact!.womenArtisanHours} unit="hrs" tone="#A86120" />
            <Metric label="Stitching hours" value={impact!.stitchingHours} unit="hrs" />
            <Metric label="Women stitching hours" value={impact!.womenStitchingHours} unit="hrs" tone="#A86120" />
            <Metric label="Total work hours" value={impact!.totalWorkHours} unit="hrs" />
          </div>

          {/* WIDE TABLE — scrolls inside its OWN container so the page itself
              never gains a horizontal scrollbar at 1440 or 390. */}
          <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#E8E4DE" }}>
            <div className="border-b px-4 py-2.5" style={{ borderColor: "#F3F1ED" }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
                Per line · {items.length} {items.length === 1 ? "item" : "items"}
              </h3>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-xs">
                <thead>
                  <tr style={{ background: "#FAF9F7" }}>
                    <Th>Workflow</Th>
                    <Th>Item</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th right>Fabric (m)</Th>
                    <Th right>CO2 (kg)</Th>
                    <Th right>Water (L)</Th>
                    <Th right>Artisan hrs</Th>
                    <Th right>Women hrs</Th>
                    <Th right>Total hrs</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => {
                    const partial = (it.calculationStatus || "").toUpperCase() !== "COMPLETE";
                    const reason = formatPendingReason(it.pendingReason);
                    return (
                      <React.Fragment key={`${it.orderItemId}-${it.workflowId ?? "none"}-${i}`}>
                        <tr style={{ borderTop: "1px solid #F3F1ED" }}>
                          <Td mono>{it.workflowId ?? "—"}</Td>
                          <Td mono>{it.orderItemId}</Td>
                          <Td>{it.productType || "—"}</Td>
                          <Td>
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                              style={partial ? { background: "#FEF3C7", color: "#92400E" } : { background: "#ECFDF5", color: "#047857" }}
                            >
                              {partial ? "Pending" : "Complete"}
                            </span>
                          </Td>
                          <Td right>{cell(it.fabricMeters)}</Td>
                          <Td right>{cell(it.co2OffsetKg)}</Td>
                          <Td right>{cell(it.waterSavedLitres)}</Td>
                          <Td right>{cell(it.artisanHours)}</Td>
                          <Td right>{cell(it.womenArtisanHours)}</Td>
                          <Td right>{cell(it.totalWorkHours)}</Td>
                        </tr>
                        {/* The reason gets its OWN full-width row: it is a
                            sentence, and squeezing it into a column either
                            truncates it or forces the table wider than the
                            viewport. */}
                        {partial && reason && (
                          <tr>
                            <td colSpan={10} className="px-3 pb-2 text-[11px]" style={{ color: "#92400E" }}>
                              {reason}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide ${right ? "text-right" : "text-left"}`}
      style={{ color: "#AAA39E" }}
    >
      {children}
    </th>
  );
}

function Td({ children, right, mono }: { children?: React.ReactNode; right?: boolean; mono?: boolean }) {
  return (
    <td
      className={`px-3 py-2 ${right ? "text-right tabular-nums" : ""} ${mono ? "font-mono text-[11px]" : ""}`}
      style={{ color: "#1A1714" }}
    >
      {children}
    </td>
  );
}
