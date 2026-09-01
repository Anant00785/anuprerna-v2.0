import React from "react";
import { StatusPill } from "./StatusPill";
import { formatEpoch } from "@/lib/utils";
import { orderWorkflowSteps } from "@/lib/artisanflow-api";
import type { WorkflowInstance, Artisan, OrderImpact, ArtisanAssignment } from "@/lib/artisanflow-api";
import { Package, ShoppingBag, Users, GitBranch, Leaf, MapPin, Droplets, Clock, Wind } from "lucide-react";

/**
 * Product journey traceability timeline (core IP).
 *
 * Derives a single product's journey from the existing links:
 *   product  →  order/customer  →  artisans (+ their cluster/state)  →
 *   process (workflow steps & subprocesses)  →  sustainability impact.
 *
 * All data comes from the workflow instance + the artisan directory + the order
 * impact endpoint — no new joins invented, just surfaced. Pure render.
 */

function Node({
  icon,
  tone,
  title,
  subtitle,
  last,
  children,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  subtitle?: string;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-4 pb-6">
      {!last && <span className="absolute left-[18px] top-9 bottom-0 w-px" style={{ background: "#E8E4DE" }} />}
      <span
        className="z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: tone, color: "white" }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>{title}</p>
          {subtitle && <span className="text-xs" style={{ color: "#AAA39E" }}>{subtitle}</span>}
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

export function TraceTimeline({
  wf,
  artisans,
  impact,
  assignments,
}: {
  wf: WorkflowInstance;
  artisans: Artisan[];
  impact: OrderImpact | null;
  // Merged blob + step/subprocess-level artisan lineage (see
  // getWorkflowArtisanLineage). Falls back to the legacy workflow-level blob
  // field when the caller doesn't pass it, so this component still works
  // standalone.
  assignments?: ArtisanAssignment[];
}) {
  const product = wf.product || wf.customProduct;
  const productName = (product as { name?: string })?.name || wf.name;
  const productSku = (product as { sku?: string })?.sku;
  const productImage = (product as { heroImage?: string })?.heroImage;
  const cat = wf.product?.subCategory?.segment?.category?.name;
  const seg = wf.product?.subCategory?.segment?.name;
  const sub = wf.product?.subCategory?.name;

  const assigned = (assignments ?? wf.artisanAssignments ?? []).map((a) => ({
    a,
    artisan: artisans.find((x) => x.id === a.artisanId),
  }));

  // Chain order, NOT id order. WorkflowBoard and PipelineSwimlane both order steps
  // with orderWorkflowSteps (previousStepId/nextStepId walk); this surface sorted by
  // id, so the same job could render its stages in a DIFFERENT order here than on the
  // board whenever ids were not allocated in chain order (an inserted or re-linked
  // stage). Same call shape as the other two: order over the UNFILTERED list — a
  // soft-deleted node in the middle still carries the links its neighbours point
  // through — then drop deleted rows afterwards.
  const steps = orderWorkflowSteps(wf.steps || []).filter((s) => !s.deleted);

  return (
    <div>
      <Node icon={<Package className="h-4 w-4" />} tone="#A86120" title="Product" subtitle={productSku ? `SKU ${productSku}` : undefined}>
        <div className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5" style={{ borderColor: "#E8E4DE" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {productImage ? (
            <img src={productImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg" style={{ background: "#F3F1ED" }} />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "#1A1714" }}>{productName}</p>
            {(cat || seg || sub) && (
              <p className="text-xs" style={{ color: "#847D77" }}>
                {[cat, seg, sub].filter(Boolean).join(" › ")}
              </p>
            )}
          </div>
        </div>
      </Node>

      {/* ORDER and CUSTOM_ORDER jobs are different entities sharing this one
          detail shape: a custom job's order/item link lives under
          referenceOrderId/referenceOrderItemId, not orderId/orderItemId. */}
      <Node
        icon={<ShoppingBag className="h-4 w-4" />}
        tone="#0EA5E9"
        title="Order & customer"
        subtitle={wf.type === "CUSTOM_ORDER" ? `Custom Order #${wf.referenceOrderId ?? "—"}` : `Order #${wf.orderId}`}
      >
        <div className="rounded-xl border bg-white px-3 py-2.5 text-xs" style={{ borderColor: "#E8E4DE", color: "#635D58" }}>
          Workflow <b style={{ color: "#1A1714" }}>{wf.name}</b> · item #{wf.type === "CUSTOM_ORDER" ? (wf.referenceOrderItemId ?? "—") : wf.orderItemId}
          <span className="ml-2 inline-flex"><StatusPill status={wf.status} /></span>
        </div>
      </Node>

      <Node
        icon={<Users className="h-4 w-4" />}
        tone="#16A34A"
        title="Artisans & cluster"
        subtitle={`${assigned.length} assigned`}
      >
        {assigned.length === 0 ? (
          <p className="text-xs" style={{ color: "#AAA39E" }}>No artisan recorded for this job.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {assigned.map(({ a, artisan }, i) => (
              <div key={`${a.artisanId ?? "a"}-${i}`} className="rounded-xl border bg-white px-3 py-2.5" style={{ borderColor: "#E8E4DE" }}>
                <p className="text-sm font-medium" style={{ color: "#1A1714" }}>
                  {artisan?.tenant?.name || artisan?.tenant?.uid || `Artisan #${a.artisanId}`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: "#847D77" }}>
                  {artisan?.state && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{artisan.state}</span>
                  )}
                  {artisan?.artisanRole && <span>{artisan.artisanRole}</span>}
                  {a.quantityOfFabricInMeters != null && <span>{a.quantityOfFabricInMeters} m</span>}
                  {a.basePayStatus && <StatusPill status={a.basePayStatus} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Node>

      <Node icon={<GitBranch className="h-4 w-4" />} tone="#6D28D9" title="Process" subtitle={`${steps.length} steps`}>
        {steps.length === 0 ? (
          <p className="text-xs" style={{ color: "#AAA39E" }}>No process steps.</p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {steps.map((s, i) => (
              <li key={s.id ?? i} className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2" style={{ borderColor: "#E8E4DE" }}>
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-semibold" style={{ background: "#F5F3FF", color: "#6D28D9" }}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm" style={{ color: "#1A1714" }}>{s.name}</span>
                {s.actualEndDate ? (
                  <span className="text-[11px]" style={{ color: "#847D77" }}>{formatEpoch(s.actualEndDate)}</span>
                ) : null}
                <StatusPill status={s.status} />
              </li>
            ))}
          </ol>
        )}
      </Node>

      <Node icon={<Leaf className="h-4 w-4" />} tone="#059669" title="Impact" subtitle={impact ? `order #${impact.orderId}` : "not computed"} last>
        {impact ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric icon={<Wind className="h-3.5 w-3.5" />} label="CO₂ offset" value={`${impact.co2OffsetKg} kg`} />
            <Metric icon={<Droplets className="h-3.5 w-3.5" />} label="Water saved" value={`${impact.waterSavedLitres} L`} />
            <Metric icon={<Clock className="h-3.5 w-3.5" />} label="Artisan hours" value={`${impact.artisanHours}`} />
            <Metric icon={<Users className="h-3.5 w-3.5" />} label="Women artisan hrs" value={`${impact.womenArtisanHours}`} />
            <Metric icon={<Package className="h-3.5 w-3.5" />} label="Fabric" value={`${impact.fabricMeters} m`} />
            <Metric icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Complete items" value={`${impact.completeItems}`} />
          </div>
        ) : (
          <p className="text-xs" style={{ color: "#AAA39E" }}>No impact metrics available for this order.</p>
        )}
      </Node>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2.5" style={{ borderColor: "#E8E4DE" }}>
      <div className="flex items-center gap-1.5" style={{ color: "#059669" }}>
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#847D77" }}>{label}</span>
      </div>
      <p className="mt-1 text-base font-semibold tabular-nums" style={{ color: "#1A1714" }}>{value}</p>
    </div>
  );
}
