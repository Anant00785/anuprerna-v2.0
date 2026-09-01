"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { MessageSquare, X } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, DataListColumn, Badge } from "@/components/ui";
import { TabBar } from "@/components/ui/TabBar";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useClientTable } from "@/lib/useClientTable";
import { formatEpoch, formatCount } from "@/lib/utils";
import type { WhatsAppRow } from "@/lib/admin-api";
import type { WhatsAppNotificationRow, WhatsAppClass } from "@/lib/whatsapp-api";

type ViewTab = "consent" | "history";
// Consent filter is derived from per-customer marketing consent (see marketingConsent()).
type FilterTab = "all" | "marketing" | "normal" | "opted_out";
type ClassFilter = "all" | "MARKETING" | "TRANSACTIONAL";
const PAGE_SIZE = 25;
const HISTORY_LIMIT = 500;

// -- CSV export (client-side only — no backend involved) ----------------------
// Both live "Download CSV" buttons (consent + audit-log) are pure client-side
// exports of the currently-filtered rows. 2026-07-06, Phase 4.
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DownloadCsvButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-stone-50"
      style={{ borderColor: "#E8E4DE", color: "#635D58" }}
    >
      ⬇ Download CSV
    </button>
  );
}

// -- Disabled poll actions — live's 3 delivery-status poll triggers have no
//    backend at all in the sandbox (NO-BACKEND per contract — they call a
//    live Freshchat poll). Surfaced as visibly disabled controls with a note
//    rather than left silently absent. ---------------------------------------
function DisabledPollButton({ label, note }: { label: string; note: string }) {
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

interface WhatsAppClientProps {
  rows: WhatsAppRow[];
  history: WhatsAppNotificationRow[];
  rowsError?: string | null;
  historyError?: string | null;
}

// -- Per-customer marketing-consent classification ----------------------------
// Consent state here is BINARY by data necessity, not by simplification. The live
// enum is 'active' | 'opted-out' | 'pending' (consent-entry.ts:1), but the source
// field whatsappOptInStatus only carries OPTED_IN/OPTED_OUT and live's own mapper
// (whatsapp-consent-manager.component.ts:64) never emits 'pending' - it's an
// unreachable placeholder (Pending stat card commented out, no pending tab in live).
// A 2026-07-03 probe of /get/customers/whatsapp-status confirmed 0 pending rows. We
// therefore do NOT fake a pending filter/badge; see whatsapp-api.ts for the full note.
type MarketingConsent = "marketing" | "normal" | "opted_out";

function marketingConsent(r: WhatsAppRow): MarketingConsent {
  if (r.optInStatus === "OPTED_OUT") return "opted_out";
  const hasMarketing = r.preferences.some((p) => p.type === "marketing" && p.enabled);
  return hasMarketing ? "marketing" : "normal";
}

// -- Status -> badge colour for the sent-message log --------------------------
function statusVariant(status: string): "green" | "red" | "amber" | "blue" | "stone" {
  const s = status.toUpperCase();
  if (s === "READ") return "green";
  if (s === "DELIVERED") return "blue";
  if (s === "POST_SUCCESS" || s === "SENT") return "amber";
  if (s.includes("FAIL") || s.includes("ERROR")) return "red";
  return "stone";
}

function prettyStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function WhatsAppClient({ rows, history, rowsError, historyError }: WhatsAppClientProps) {
  const [view, setView] = useState<ViewTab>("consent");

  // -- Consent state -----------------------------------------------------------
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedRow, setSelectedRow] = useState<WhatsAppRow | null>(null);

  const optedIn = useMemo(() => rows.filter((r) => r.optInStatus === "OPTED_IN"), [rows]);
  const optedOut = useMemo(() => rows.filter((r) => marketingConsent(r) === "opted_out"), [rows]);
  const marketingRows = useMemo(() => rows.filter((r) => marketingConsent(r) === "marketing"), [rows]);
  const normalRows = useMemo(() => rows.filter((r) => marketingConsent(r) === "normal"), [rows]);

  const baseRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => marketingConsent(r) === filter)),
    [rows, filter],
  );

  const consentSearchFields = useCallback(
    (r: WhatsAppRow) => [r.userName, r.email, r.whatsappNumber],
    [],
  );
  const consent = useClientTable(baseRows, { searchFields: consentSearchFields, pageSize: PAGE_SIZE });

  const columns = useMemo<DataListColumn<WhatsAppRow>[]>(() => [
    {
      key: "userName", label: "Name",
      render: (r) => (
        <button type="button" className="text-left font-medium text-sm hover:underline"
          style={{ color: "#1A1714" }} onClick={() => setSelectedRow(r)}>
          {r.userName || "—"}
        </button>
      ),
    },
    {
      key: "email", label: "Email",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.email || "—"}</span>,
    },
    {
      key: "whatsappNumber", label: "Phone",
      render: (r) => <span className="text-sm font-mono" style={{ color: "#635D58" }}>{r.whatsappNumber || "—"}</span>,
    },
    {
      key: "optInStatus", label: "Status",
      render: (r) => r.optInStatus === "OPTED_IN"
        ? <Badge variant="green">Opted In</Badge>
        : <Badge variant="red">Opted Out</Badge>,
    },
    {
      key: "marketingConsent", label: "Marketing consent",
      render: (r) => {
        const mc = marketingConsent(r);
        if (mc === "marketing") return <Badge variant="purple">Marketing ✓</Badge>;
        if (mc === "normal") return <Badge variant="stone">Normal only</Badge>;
        return <Badge variant="red">Opted out</Badge>;
      },
    },
    {
      key: "dismissCount", label: "Dismiss Count",
      render: (r) => <span className="text-sm" style={{ color: r.dismissCount > 0 ? "#92400E" : "#635D58" }}>{r.dismissCount}</span>,
    },
    {
      key: "consentExpiresAt", label: "Consent Expires",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.consentExpiresAt ? formatEpoch(r.consentExpiresAt) : "—"}</span>,
    },
    {
      key: "preferences", label: "Preferences",
      render: (r) => <span className="text-sm" style={{ color: r.preferences.length > 0 ? "#A86120" : "#D1CCC6" }}>
        {r.preferences.length > 0 ? `${r.preferences.length} pref${r.preferences.length > 1 ? "s" : ""}` : "—"}
      </span>,
    },
  ], []);

  const filterTabs = [
    { id: "all", label: "All", count: rows.length },
    { id: "marketing", label: "Marketing opted-in", count: marketingRows.length },
    { id: "normal", label: "Normal only", count: normalRows.length },
    { id: "opted_out", label: "Opted out", count: optedOut.length },
  ];

  // -- Message-history state ---------------------------------------------------
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const marketingCount = useMemo(() => history.filter((h) => h.messageClass === "MARKETING").length, [history]);
  const transactionalCount = useMemo(() => history.filter((h) => h.messageClass === "TRANSACTIONAL").length, [history]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => { if (h.status) set.add(h.status); });
    return Array.from(set).sort();
  }, [history]);

  const hBase = useMemo(() => {
    return history.filter((h) => {
      if (classFilter !== "all" && h.messageClass !== classFilter) return false;
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      return true;
    });
  }, [history, classFilter, statusFilter]);

  const historySearchFields = useCallback(
    (h: WhatsAppNotificationRow) => [h.recipientName, h.recipientMobile, h.templateName, h.triggerType],
    [],
  );
  const hist = useClientTable(hBase, { searchFields: historySearchFields, pageSize: PAGE_SIZE });

  const historyColumns = useMemo<DataListColumn<WhatsAppNotificationRow>[]>(() => [
    {
      key: "recipientName", label: "Recipient",
      render: (h) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium" style={{ color: "#1A1714" }}>{h.recipientName || "—"}</span>
          <span className="text-xs font-mono" style={{ color: "#847D77" }}>{h.recipientMobile || "—"}</span>
        </div>
      ),
    },
    {
      key: "templateName", label: "Template",
      render: (h) => <span className="text-sm font-mono" style={{ color: "#635D58" }}>{h.templateName || "—"}</span>,
    },
    {
      key: "triggerType", label: "Trigger",
      render: (h) => <span className="text-xs" style={{ color: "#847D77" }}>{h.triggerType || "—"}</span>,
    },
    {
      key: "messageClass", label: "Class",
      render: (h) => h.messageClass === "MARKETING"
        ? <Badge variant="purple">Marketing</Badge>
        : <Badge variant="blue">Transactional</Badge>,
    },
    {
      key: "status", label: "Status",
      render: (h) => <Badge variant={statusVariant(h.status)}>{prettyStatus(h.status) || "—"}</Badge>,
    },
    {
      key: "sentAt", label: "Sent At",
      render: (h) => <span className="text-sm" style={{ color: "#635D58" }}>{h.sentAt ? formatEpoch(h.sentAt) : "—"}</span>,
    },
    {
      key: "actions", label: "",
      render: () => (
        <button
          type="button"
          disabled
          title="Polls a live external service (Freshchat) for a delivery-status update — not available in sandbox"
          className="rounded-md p-1.5 cursor-not-allowed opacity-40"
          style={{ color: "#847D77" }}
        >
          ↻
        </button>
      ),
    },
  ], []);

  const classTabs = [
    { id: "all", label: "All", count: history.length },
    { id: "MARKETING", label: "Marketing", count: marketingCount },
    { id: "TRANSACTIONAL", label: "Transactional", count: transactionalCount },
  ];

  // -- Preferences drawer: close on Escape + lock body scroll while open -------
  useEffect(() => {
    if (!selectedRow) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedRow(null); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedRow]);

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Operations</span><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>WhatsApp</span>
    </div>
  );

  const viewTabs = [
    { id: "consent", label: "Consent" },
    { id: "history", label: "Message History" },
  ];

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>WhatsApp</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              {formatCount(rows.length)} customers · {formatCount(optedIn.length)} opted in · {formatCount(history.length)} messages sent
            </p>
          </div>
          <MessageSquare className="h-6 w-6" style={{ color: "#A86120" }} />
        </div>

        {/* Top-level view switcher */}
        <TabBar
          tabs={viewTabs}
          active={view}
          onChange={(id) => setView(id as ViewTab)}
          variant="underline"
          weight="semibold"
          ariaLabel="WhatsApp view"
        />

        {view === "consent" ? (
          rowsError ? (
            <ErrorBanner message={rowsError} />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Marketing opted-in", value: formatCount(marketingRows.length), color: "#7E22CE", bg: "#FAF5FF" },
                  { label: "Normal only", value: formatCount(normalRows.length), color: "#1A1714", bg: "#FAF9F7" },
                  { label: "Opted out", value: formatCount(optedOut.length), color: "#B91C1C", bg: "#FEF2F2" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border p-3"
                    style={{ borderColor: "#E8E4DE", background: s.bg }}>
                    <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "#847D77" }}>{s.label}</div>
                    <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <TabBar
                  tabs={filterTabs}
                  active={filter}
                  onChange={(id) => { setFilter(id as FilterTab); consent.setSearch(""); }}
                  variant="underline"
                  ariaLabel="Consent filter"
                />
                <DownloadCsvButton onClick={() => downloadCsv(
                  "whatsapp-consent.csv",
                  ["Name", "Email", "Phone", "Marketing Consent", "Status", "Consent Expires"],
                  consent.filtered.map((r) => [
                    r.userName, r.email, r.whatsappNumber,
                    marketingConsent(r), r.optInStatus, r.consentExpiresAt ? formatEpoch(r.consentExpiresAt) : "",
                  ]),
                )} />
              </div>

              <DataList
                data={consent.paged} columns={columns} getId={(r) => String(r.customerId)}
                total={consent.filtered.length} page={consent.page} pageSize={PAGE_SIZE}
                onPageChange={consent.setPage}
                onSearch={consent.setSearch}
                searchPlaceholder="Search by name, email or phone…"
                emptyMessage={consent.search ? `No customers match \"${consent.search}\"` : "No WhatsApp customers found."}
              />
            </>
          )
        ) : historyError ? (
          <ErrorBanner message={historyError} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Sent", value: formatCount(history.length), color: "#1A1714", bg: "#FAF9F7" },
                { label: "Transactional", value: formatCount(transactionalCount), color: "#1D4ED8", bg: "#EFF6FF" },
                { label: "Marketing", value: formatCount(marketingCount), color: "#7E22CE", bg: "#FAF5FF" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3" style={{ borderColor: "#E8E4DE", background: s.bg }}>
                  <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "#847D77" }}>{s.label}</div>
                  <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {history.length >= HISTORY_LIMIT && (
              <p className="text-xs" style={{ color: "#847D77" }}>
                Showing latest {HISTORY_LIMIT} messages.
              </p>
            )}

            {/* Delivery-status poll triggers — NO backend in the sandbox at all
                (live calls a real Freshchat poll); visibly disabled rather than
                silently absent (Phase 4). */}
            <div className="flex flex-wrap items-center gap-2">
              <DisabledPollButton label="↻ Refresh delivery statuses" note="Polls a live external service (Freshchat) for recent messages — not available in sandbox (no backend endpoint)." />
              <DisabledPollButton label="↻ Reconcile stale backlog" note="Polls a live external service (Freshchat) for older/stale messages — not available in sandbox (no backend endpoint)." />
            </div>

            {/* Class filter + status filter row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: "#E8E4DE" }}>
              <TabBar
                tabs={classTabs}
                active={classFilter}
                onChange={(id) => setClassFilter(id as ClassFilter)}
                variant="pill"
                pillStyle="soft"
                ariaLabel="Message class filter"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
                  Status
                  <select value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border px-2.5 py-1.5 text-sm"
                    style={{ borderColor: "#E8E4DE", color: "#1A1714", background: "#FFFFFF" }}>
                    <option value="all">All statuses</option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{prettyStatus(s)}</option>
                    ))}
                  </select>
                </label>
                <DownloadCsvButton onClick={() => downloadCsv(
                  "whatsapp-message-history.csv",
                  ["#", "Request ID", "To", "Template", "Trigger", "Status", "Created At"],
                  hist.filtered.map((h, i) => [
                    i + 1, h.id, h.recipientMobile, h.templateName, h.triggerType, h.status,
                    h.createdAt ? formatEpoch(h.createdAt) : "",
                  ]),
                )} />
              </div>
            </div>

            <DataList
              data={hist.paged} columns={historyColumns} getId={(h) => String(h.id)}
              total={hist.filtered.length} page={hist.page} pageSize={PAGE_SIZE}
              onPageChange={hist.setPage}
              onSearch={hist.setSearch}
              searchPlaceholder="Search by recipient, template or trigger…"
              emptyMessage={
                history.length === 0
                  ? "No WhatsApp messages found."
                  : hist.search
                    ? `No messages match \"${hist.search}\"`
                    : "No messages match the current filters."
              }
            />
          </>
        )}
      </div>

      {selectedRow && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedRow(null)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
              <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
                {selectedRow.userName || "Customer"} — Preferences
              </h3>
              <button onClick={() => setSelectedRow(null)} className="rounded p-1 hover:bg-stone-100" style={{ color: "#847D77" }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <div className="mb-4 flex flex-col gap-1">
                <div className="text-xs" style={{ color: "#847D77" }}>{selectedRow.email} · {selectedRow.whatsappNumber}</div>
                <div className="flex gap-2 flex-wrap items-center">
                  {selectedRow.optInStatus === "OPTED_IN"
                    ? <Badge variant="green">Opted In</Badge>
                    : <Badge variant="red">Opted Out</Badge>
                  }
                  {(() => {
                    const mc = marketingConsent(selectedRow);
                    if (mc === "marketing") return <Badge variant="purple">Marketing ✓</Badge>;
                    if (mc === "normal") return <Badge variant="stone">Normal only</Badge>;
                    return null;
                  })()}
                  {selectedRow.consentExpiresAt && (
                    <span className="text-xs" style={{ color: "#847D77" }}>Expires {formatEpoch(selectedRow.consentExpiresAt)}</span>
                  )}
                </div>
              </div>
              {selectedRow.preferences.length === 0 ? (
                <p className="text-sm" style={{ color: "#847D77" }}>No preferences set.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedRow.preferences.map((pref) => (
                    <div key={pref.id} className="flex items-start justify-between rounded-lg border p-3" style={{ borderColor: "#E8E4DE" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium" style={{ color: "#1A1714" }}>{pref.title}</div>
                          <Badge variant={pref.type === "marketing" ? "purple" : "blue"}>
                            {pref.type === "marketing" ? "Marketing" : "Service"}
                          </Badge>
                        </div>
                        {pref.description && <div className="text-xs mt-0.5" style={{ color: "#847D77" }}>{pref.description}</div>}
                        <div className="text-xs mt-1 font-mono" style={{ color: "#AAA39E" }}>id: {pref.id}</div>
                      </div>
                      <Badge variant={pref.enabled ? "green" : "stone"}>{pref.enabled ? "On" : "Off"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </WeaveShell>
  );
}
