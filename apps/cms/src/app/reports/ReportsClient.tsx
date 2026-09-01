"use client";

/**
 * ReportsClient — inventory report center.
 *
 * Download CSV is a READ that streams a report. It calls the server route
 * /api/reports/download, which forwards to Loom with the service token and
 * streams the CSV back. This is the only live data call on the admin screens
 * and is read-only (stock levels) — no Loom data is mutated.
 */

import React, { useState } from "react";
import { Boxes, Shirt, Download, FileSpreadsheet, Check } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Toggle, Button } from "@/components/ui";

type ReportType = "FABRIC_STOCK" | "FINISHED_STOCK";

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
}

const REPORTS: ReportOption[] = [
  {
    id: "FABRIC_STOCK",
    title: "Fabric Stock Inventory",
    description: "Stock levels for all fabric products — Zoho + external quantity, price, disabled flag.",
    icon: Boxes,
  },
  {
    id: "FINISHED_STOCK",
    title: "Finished Stock Inventory",
    description: "Stock levels for all finished products — Zoho + external quantity, price, disabled flag.",
    icon: Shirt,
  },
];

export function ReportsClient() {
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    if (!selected) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/reports/download?type=${selected}&includeDisabled=${includeDisabled}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, "");
      const filename = match?.[1] ?? `${selected.toLowerCase()}_report_${stamp}.csv`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDownloading(false);
    }
  }

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Operations</span>
      <span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Reports</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
            Report Center
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Pick a report, set options, and download the live CSV.
          </p>
        </div>

        {/* Report type cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {REPORTS.map((r) => {
            const Icon = r.icon;
            const isActive = selected === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r.id)}
                className="flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all"
                style={{
                  borderColor: isActive ? "#A86120" : "#E8E4DE",
                  background: isActive ? "#FFF8F0" : "white",
                  boxShadow: isActive ? "0 0 0 1px #A86120" : "none",
                }}
              >
                <div className="flex w-full items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: isActive ? "#FEF3E2" : "#F3F1ED" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: isActive ? "#A86120" : "#847D77" }} />
                  </div>
                  {isActive && (
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ background: "#A86120" }}
                    >
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                    {r.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "#847D77" }}>
                    {r.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Options + download */}
        <div
          className="flex flex-col gap-4 rounded-2xl border p-5"
          style={{ background: "#FAF9F7", borderColor: "#E8E4DE" }}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" style={{ color: "#847D77" }} />
            <span className="text-sm font-semibold" style={{ color: "#1A1714" }}>
              Report options
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: "#4A4540" }}>
                Include disabled products
              </p>
              <p className="text-xs" style={{ color: "#847D77" }}>
                When on, products hidden from the storefront are also listed.
              </p>
            </div>
            <Toggle checked={includeDisabled} onChange={setIncludeDisabled} />
          </div>

          {error && (
            <div
              className="rounded-lg border px-3 py-2 text-xs"
              style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-xs" style={{ color: "#847D77" }}>
              {selected
                ? `Ready: ${REPORTS.find((r) => r.id === selected)?.title}`
                : "Select a report above to enable download."}
            </span>
            <Button
              variant="primary"
              size="md"
              onClick={download}
              disabled={!selected || downloading}
              loading={downloading}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>
      </div>
    </WeaveShell>
  );
}
