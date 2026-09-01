"use client";

/**
 * ClusterCraftSection — the cluster/craft auto-tagging traceability panel on the
 * product-edit form. Shows the product's current CRAFT + CLUSTER stories with a
 * derivation badge (Auto-derived / Manual override / Needs mapping), and lets an
 * editor override them. Overrides go through /api/story-mapping/override, which
 * writes to our Postgres sandbox only (never live Loom).
 */
import React, { useState, useCallback } from "react";
import { Badge, Button, FormField, Select, MultiSelect } from "@/components/ui";
import type { StoryMappingDetail, StoryOption } from "@/lib/api";

type StatusKind = "auto-derived" | "manual-override" | "needs-mapping";

function statusBadge(status: StatusKind) {
  if (status === "manual-override") return <Badge variant="blue">Manual override</Badge>;
  if (status === "needs-mapping") return <Badge variant="amber">Needs mapping</Badge>;
  return <Badge variant="green">Auto-derived</Badge>;
}

interface Props {
  productId: number;
  initial: StoryMappingDetail;
  craftOptions: StoryOption[];
  clusterOptions: StoryOption[];
}

export function ClusterCraftSection({ productId, initial, craftOptions, clusterOptions }: Props) {
  const [detail, setDetail] = useState<StoryMappingDetail>(initial);
  const [craftId, setCraftId] = useState<number>(
    initial.current.craft?.id ?? initial.derived?.craftStoryId ?? 0,
  );
  const [clusterIds, setClusterIds] = useState<number[]>(
    initial.current.clusters.map((c) => c.id),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const status = detail.status as StatusKind;

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/story-mapping/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          craftStoryId: craftId || null,
          clusterStoryIds: clusterIds,
        }),
      });
      const data = (await res.json()) as { success: boolean; message?: string; added?: number[]; removed?: number[] };
      if (!data.success) {
        setMsg({ kind: "err", text: data.message ?? "Override failed" });
        setSaving(false);
        return;
      }
      // Re-fetch the mapping so the badges + current tags reflect the new state.
      const ref = await fetch(`/api/story-mapping/${productId}`, { cache: "no-store" });
      const fresh = (await ref.json()) as StoryMappingDetail & { success?: boolean };
      if (fresh && fresh.success !== false && fresh.current) {
        setDetail(fresh);
        setCraftId(fresh.current.craft?.id ?? 0);
        setClusterIds(fresh.current.clusters.map((c) => c.id));
      }
      setMsg({
        kind: "ok",
        text: `Saved — added ${data.added?.length ?? 0}, removed ${data.removed?.length ?? 0}. Now marked as a manual override.`,
      });
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    }
    setSaving(false);
  }, [productId, craftId, clusterIds]);

  const cardStyle = { borderColor: "#E8E4DE" };
  const craftSelectOpts = craftOptions.map((o) => ({ value: o.id, label: o.title }));
  const clusterMultiOpts = clusterOptions.map((o) => ({ id: o.id, name: o.title }));

  const derivedCraftTitle =
    craftOptions.find((o) => o.id === detail.derived?.craftStoryId)?.title ?? null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-5" style={cardStyle}>
      {/* Explainer */}
      <div
        className="rounded-lg border px-4 py-3 text-sm"
        style={{ background: "#F5F7F5", borderColor: "#DDE7DD", color: "#3F5140" }}
      >
        Cluster &amp; craft are <strong>auto-derived from the sub-category</strong> using the
        empirical tag rules. Override them below only when the automatic mapping is wrong —
        overrides are recorded and take precedence. Writes go to the Postgres sandbox, never live Loom.
      </div>

      {/* Current mapping (read-only) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4" style={cardStyle}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
              Craft
            </span>
            {statusBadge(status)}
          </div>
          {detail.current.craft ? (
            <p className="text-sm font-medium" style={{ color: "#1A1714" }}>
              {detail.current.craft.title}
              <span className="ml-2 text-xs" style={{ color: "#AAA39E" }}>#{detail.current.craft.id}</span>
            </p>
          ) : (
            <p className="text-sm" style={{ color: "#B45309" }}>
              No craft tagged{status === "needs-mapping" ? " — needs a manual mapping" : ""}
            </p>
          )}
          {derivedCraftTitle && detail.derived?.status === "ok" && (
            <p className="mt-1 text-xs" style={{ color: "#847D77" }}>
              Rule derives: {derivedCraftTitle}
            </p>
          )}
        </div>

        <div className="rounded-lg border p-4" style={cardStyle}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
              Cluster
            </span>
            {statusBadge(status)}
          </div>
          {detail.current.clusters.length ? (
            <div className="flex flex-wrap gap-1.5">
              {detail.current.clusters.map((c) => (
                <Badge key={c.id} variant={c.isHandloom ? "stone" : "purple"}>
                  {c.title}{c.isHandloom ? " (umbrella)" : ""}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#B45309" }}>
              No cluster tagged{status === "needs-mapping" ? " — needs a manual mapping" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Override controls */}
      <div className="rounded-lg border p-4" style={{ ...cardStyle, background: "#FCFBFA" }}>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "#1A1714" }}>
          Override mapping
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField dataField="override-craft" label="Craft story">
            <Select
              options={craftSelectOpts}
              placeholder="Select craft"
              value={craftId || ""}
              onChange={(e) => setCraftId(Number(e.target.value))}
            />
          </FormField>
          <FormField dataField="override-clusters" label="Cluster stories">
            <MultiSelect
              options={clusterMultiOpts}
              value={clusterIds}
              onChange={(v) => setClusterIds(v.map(Number))}
              placeholder="Select clusters"
            />
          </FormField>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" size="md" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save overrides"}
          </Button>
          {msg && (
            <span
              className="text-xs font-medium"
              style={{ color: msg.kind === "ok" ? "#047857" : "#B91C1C" }}
            >
              {msg.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
