"use client";

/**
 * RebuildMapClient — collapsible per-module list for the Rebuild Map.
 * Pure presentational client component; all data is generated server-side and
 * passed in as props. Dates are formatted with the shared deterministic
 * formatter (en-IN / Asia/Kolkata) so SSR and client hydration match exactly.
 */
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface RebuildEndpoint {
  module: string;
  method: string;
  path: string;
  controllerClass: string;
  status: "native" | "passthrough";
  tested: boolean;
  lastVerified: string | null;
}

export interface RebuildModule {
  name: string;
  total: number;
  native: number;
  tested: number;
  passthrough: number;
  entities: string[];
  endpoints: RebuildEndpoint[];
}

const METHOD_COLOR: Record<string, { bg: string; fg: string }> = {
  GET: { bg: "#EAF3EE", fg: "#0F7B4F" },
  POST: { bg: "#EAF0F9", fg: "#2456A6" },
  PATCH: { bg: "#FBF2E4", fg: "#A86120" },
  PUT: { bg: "#FBF2E4", fg: "#A86120" },
  DELETE: { bg: "#FBECEC", fg: "#C0392B" },
};

function Dot({ e }: { e: RebuildEndpoint }) {
  const color =
    e.status === "native" && e.tested
      ? "#10B981" // green — native & tested
      : e.status === "native"
        ? "#F59E0B" // amber — native, untested
        : "#D6D0C9"; // grey — passthrough
  const title =
    e.status === "native" && e.tested
      ? "Native (own Postgres) & parity-verified by tests"
      : e.status === "native"
        ? "Native, not yet test-covered"
        : "Passthrough — still served by live Loom";
  return (
    <span
      title={title}
      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

function MethodBadge({ method }: { method: string }) {
  const c = METHOD_COLOR[method] ?? { bg: "#F1EEE9", fg: "#635D58" };
  return (
    <span
      className="inline-block w-14 flex-shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-semibold tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      {method}
    </span>
  );
}

function ModuleRow({ mod, defaultOpen }: { mod: RebuildModule; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = mod.total > 0 ? (mod.native / mod.total) * 100 : 0;
  const hasNative = mod.native > 0;

  return (
    <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#E8E4DE" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-stone-50"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: "#AAA39E" }} />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "#AAA39E" }} />
        )}
        <span className="font-medium" style={{ color: "#1A1714" }}>
          {mod.name}
        </span>
        {hasNative && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "#EAF3EE", color: "#0F7B4F" }}
          >
            {mod.native} native
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden h-2 w-32 overflow-hidden rounded-full sm:block" style={{ background: "#F1EEE9" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hasNative ? "#10B981" : "#E8E4DE" }} />
          </div>
          <span className="w-20 text-right text-xs tabular-nums" style={{ color: "#847D77" }}>
            {mod.native}/{mod.total}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: "#F1EEE9" }}>
          {mod.entities.length > 0 && (
            <p className="px-5 pt-3 text-[11px]" style={{ color: "#AAA39E" }}>
              <span className="font-medium" style={{ color: "#847D77" }}>Entities ({mod.entities.length}):</span>{" "}
              {mod.entities.join(", ")}
            </p>
          )}
          <ul className="divide-y" style={{ borderColor: "#F5F3EF" }}>
            {mod.endpoints.map((e, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-2">
                <Dot e={e} />
                <MethodBadge method={e.method} />
                <code className="truncate text-xs" style={{ color: "#4A4540" }}>{e.path}</code>
                <span className="ml-auto flex-shrink-0 text-[11px]" style={{ color: "#AAA39E" }}>
                  {e.status === "native" && e.tested && e.lastVerified
                    ? `verified ${formatDate(e.lastVerified)}`
                    : e.status === "native"
                      ? "native"
                      : "proxied"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function RebuildMapModules({ modules }: { modules: RebuildModule[] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]" style={{ color: "#847D77" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#10B981" }} /> native &amp; test-verified
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#F59E0B" }} /> native, untested
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#D6D0C9" }} /> passthrough (live Loom)
        </span>
      </div>
      {modules.map((mod) => (
        <ModuleRow key={mod.name} mod={mod} defaultOpen={mod.native > 0} />
      ))}
    </div>
  );
}
