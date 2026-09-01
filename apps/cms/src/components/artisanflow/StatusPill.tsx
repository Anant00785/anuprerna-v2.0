import React from "react";

/**
 * Operational status pill (Linear/Asana style) for ArtisanFlow.
 *
 * Single mapping for the three status vocabularies in the production spine:
 *   - order item:     INITIATED / PROCESSING / PARTIALLY_DISPATCHED / IN_TRANSIT / DISPATCHED / DELIVERED / CANCELLED / FAILED
 *   - workflow:       CREATED / INITIATED / HALTED / COMPLETED
 *   - workflow step:  PENDING / IN_PROGRESS / HALTED / COMPLETED
 *   - feedback:       PENDING / APPROVED / REJECTED
 * A coloured dot + label, dense, neutral — not a storefront badge.
 */

type Tone = "green" | "amber" | "blue" | "red" | "stone" | "violet";

const TONE: Record<Tone, { dot: string; bg: string; fg: string }> = {
  green:  { dot: "#10B981", bg: "#ECFDF5", fg: "#047857" },
  amber:  { dot: "#D97706", bg: "#FFFBEB", fg: "#92400E" },
  blue:   { dot: "#2563EB", bg: "#EFF6FF", fg: "#1D4ED8" },
  red:    { dot: "#DC2626", bg: "#FEF2F2", fg: "#B91C1C" },
  stone:  { dot: "#A8A29E", bg: "#F5F5F4", fg: "#57534E" },
  violet: { dot: "#7C3AED", bg: "#F5F3FF", fg: "#6D28D9" },
};

function toneFor(status: string): Tone {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
    case "APPROVED":
    case "READY":
    case "DISPATCHED":
    case "DELIVERED":
      return "green";
    case "IN_PROGRESS":
    case "IN_TRANSIT":
    case "PROCESSING":
      return "blue";
    case "PENDING":
    case "NOT_STARTED":
    case "INITIATED":
    case "PLACED":
      return "amber";
    case "HALTED":
    case "REJECTED":
    case "CANCELLED":
    case "FAILED":
      return "red";
    default:
      return "stone";
  }
}

function pretty(status: string): string {
  return (status || "—").replace(/_/g, " ");
}

export function StatusPill({ status, label, className }: { status?: string; label?: string; className?: string }) {
  const tone = TONE[toneFor(status || "")];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${className ?? ""}`}
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
      {label ?? pretty(status || "")}
    </span>
  );
}
