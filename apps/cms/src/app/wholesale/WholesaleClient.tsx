"use client";

/**
 * WholesaleClient — Wholesale hub for the Weave sandbox.
 *
 * Two tabs: Enrolled Customers (metrics, active/inactive, + renew action) and
 * Eligible Customers (discovery form + enroll action). Reads go through the
 * native /api/wholesale/* server routes (wholesale-api.ts — no live-Loom
 * proxy). The enroll/renew action (2026-07-06, Phase 4) POSTs
 * /enable/loyalty-program via /api/crud (sandbox Postgres only).
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCheck } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, DataListColumn, Badge, Button, FormField, TextInput } from "@/components/ui";
import { TabBar } from "@/components/ui/TabBar";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useClientTable } from "@/lib/useClientTable";
import {
  fetchWholesaleMetrics,
  fetchEligibleCustomers,
  enableLoyaltyProgram,
  type WholesaleMetricsRow,
  type WholesaleEligibleCustomer,
  type EligibleFilter,
  type EnrollLoyaltyInput,
} from "@/lib/wholesale-api";
import { formatEpoch, formatPrice, formatCount } from "@/lib/utils";

type MainTab = "enrolled" | "eligible";
type EnrolledTab = "active" | "inactive";
const PAGE_SIZE = 25;

// -- Shared enroll/renew drawer -------------------------------------------------

interface EnrollTarget {
  mode: "enroll" | "renew";
  customerId: number;
  customerLabel: string;
  form: {
    tenure: number;
    discountPercentage: number;
    minimumOrderValue: number;
    minimumOrderValueCurrency: string;
    exchangeRate: number;
  };
  existingId?: number;
}

function EnrollDrawer({
  target,
  onClose,
  onSaved,
}: {
  target: EnrollTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(target.form);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSave = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const body: EnrollLoyaltyInput = {
        customerId: target.customerId,
        tenure: Number(form.tenure),
        discountPercentage: Number(form.discountPercentage),
        minimumOrderValue: Number(form.minimumOrderValue),
        minimumOrderValueCurrency: form.minimumOrderValueCurrency,
        minimumOrderValueINR: Number(form.minimumOrderValue) * Number(form.exchangeRate || 1),
        exchangeRate: Number(form.exchangeRate || 1),
        type: target.mode === "enroll" ? "ONBOARDING" : "RENEWAL_MANUAL",
        ...(target.existingId ? { id: target.existingId } : {}),
      };
      const r = await enableLoyaltyProgram(body);
      if (r.success === false) throw new Error(r.message || "Enrollment failed");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setSaving(false);
    }
  }, [form, target, onSaved]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl border-l" style={{ borderColor: "#E8E4DE" }}>
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
            {target.mode === "enroll" ? "Enroll in wholesale program" : "Renew membership"}
          </h3>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: "#847D77" }}>×</button>
        </div>
        <div className="px-5 pt-4">
          <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}>
            {target.customerLabel} — saves to the sandbox test DB only (never live).
          </div>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
          <FormField label="Tenure (months)">
            <TextInput type="number" value={form.tenure} onChange={(e) => setForm((f) => ({ ...f, tenure: Number(e.target.value) }))} />
          </FormField>
          <FormField label="Discount %">
            <TextInput type="number" value={form.discountPercentage} onChange={(e) => setForm((f) => ({ ...f, discountPercentage: Number(e.target.value) }))} />
          </FormField>
          <FormField label="Minimum order value">
            <TextInput type="number" value={form.minimumOrderValue} onChange={(e) => setForm((f) => ({ ...f, minimumOrderValue: Number(e.target.value) }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Currency">
              <TextInput value={form.minimumOrderValueCurrency} onChange={(e) => setForm((f) => ({ ...f, minimumOrderValueCurrency: e.target.value.toUpperCase() }))} />
            </FormField>
            <FormField label="Exchange rate (to INR)">
              <TextInput type="number" step="0.01" value={form.exchangeRate} onChange={(e) => setForm((f) => ({ ...f, exchangeRate: Number(e.target.value) }))} />
            </FormField>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <Button variant="secondary" onClick={onClose} size="sm">Cancel</Button>
          {error && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{error}</span>}
          <Button variant="primary" onClick={doSave} size="sm" disabled={saving}>
            {saving ? "Saving…" : target.mode === "enroll" ? "Enroll" : "Renew"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// -- Enrolled Customers tab ----------------------------------------------------

function EnrolledTab() {
  const [subTab, setSubTab] = useState<EnrolledTab>("active");
  const [activeRows, setActiveRows] = useState<WholesaleMetricsRow[]>([]);
  const [inactiveRows, setInactiveRows] = useState<WholesaleMetricsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gen, setGen] = useState(0);
  const [enrollTarget, setEnrollTarget] = useState<EnrollTarget | null>(null);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchWholesaleMetrics(true), fetchWholesaleMetrics(false)])
      .then(([a, i]) => {
        if (!alive) return;
        if (!a.ok) { setError(a.error); setLoading(false); return; }
        if (!i.ok) { setError(i.error); setLoading(false); return; }
        setActiveRows(a.data);
        setInactiveRows(i.data);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [gen]);

  const rows = subTab === "active" ? activeRows : inactiveRows;
  const searchFields = useCallback((r: WholesaleMetricsRow) => [r.userName, r.email], []);
  const table = useClientTable(rows, { searchFields, pageSize: PAGE_SIZE });

  const openRenew = (r: WholesaleMetricsRow) => {
    const mc = r.membershipConfig;
    setEnrollTarget({
      mode: "renew",
      customerId: r.customerId,
      customerLabel: r.userName || r.email,
      existingId: mc?.id,
      form: {
        tenure: mc?.tenure ?? 6,
        discountPercentage: mc?.discountPercentage ?? 10,
        minimumOrderValue: mc?.minimumOrderValue ?? 10000,
        minimumOrderValueCurrency: mc?.minimumOrderValueCurrency || "INR",
        exchangeRate: mc?.exchangeRate ?? 1,
      },
    });
  };

  const columns = useMemo<DataListColumn<WholesaleMetricsRow>[]>(() => [
    {
      key: "userName", label: "Name",
      render: (r) => <span className="font-medium text-sm" style={{ color: "#1A1714" }}>{r.userName || "—"}</span>,
    },
    {
      key: "email", label: "Email",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.email || "—"}</span>,
    },
    {
      key: "totalOrderCount", label: "Total Orders",
      render: (r) => <span className="text-sm font-medium" style={{ color: "#1A1714" }}>{formatCount(r.totalOrderCount)}</span>,
    },
    {
      key: "totalOrderValue", label: "Lifetime Value",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{formatPrice(r.totalOrderValue)}</span>,
    },
    {
      key: "totalLoyaltyOrderCount", label: "Wholesale Orders",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{formatCount(r.totalLoyaltyOrderCount)}</span>,
    },
    {
      key: "totalLoyaltyDiscountValue", label: "Discount Given",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{formatPrice(r.totalLoyaltyDiscountValue)}</span>,
    },
    {
      key: "tenure", label: "Tenure",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.membershipConfig ? `${r.membershipConfig.tenure}m` : "—"}</span>,
    },
    {
      key: "discountPct", label: "Discount",
      render: (r) => r.membershipConfig
        ? <Badge variant="green">{r.membershipConfig.discountPercentage}%</Badge>
        : <span style={{ color: "#D1CCC6" }}>—</span>,
    },
    {
      key: "endDate", label: "Ends",
      render: (r) => (
        <span className="text-sm" style={{ color: "#635D58" }}>
          {r.membershipConfig ? formatEpoch(r.membershipConfig.endDate) : "—"}
        </span>
      ),
    },
    {
      key: "actions", label: "",
      render: (r) => (
        <button
          type="button"
          className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
          style={{ background: "#FEF3E2", color: "#A86120" }}
          onClick={() => openRenew(r)}
        >
          {r.membershipConfig ? "Renew" : "Enroll"}
        </button>
      ),
    },
  ], []);

  const subTabs = [
    { id: "active", label: "Active", count: activeRows.length },
    { id: "inactive", label: "Inactive", count: inactiveRows.length },
  ];

  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active members", value: formatCount(activeRows.length), color: "#16A34A", bg: "#F0FDF4" },
            { label: "Inactive members", value: formatCount(inactiveRows.length), color: "#92400E", bg: "#FFF8F0" },
            {
              label: "Total enrolled",
              value: formatCount(activeRows.length + inactiveRows.length),
              color: "#1A1714",
              bg: "#FAF9F7",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border p-3" style={{ borderColor: "#E8E4DE", background: s.bg }}>
              <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "#847D77" }}>{s.label}</div>
              <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <TabBar
        tabs={subTabs}
        active={subTab}
        onChange={(id) => { setSubTab(id as EnrolledTab); table.setSearch(""); }}
        variant="underline"
        ariaLabel="Enrolled sub-tabs"
      />

      <DataList
        key={subTab}
        data={table.paged}
        columns={columns}
        getId={(r) => String(r.customerId)}
        total={table.filtered.length}
        page={table.page}
        pageSize={PAGE_SIZE}
        onPageChange={table.setPage}
        onSearch={table.setSearch}
        searchPlaceholder="Search by name or email…"
        emptyMessage={loading ? "Loading enrolled customers…" : "No enrolled customers found."}
        loading={loading}
      />

      {enrollTarget && (
        <EnrollDrawer
          target={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onSaved={() => { setEnrollTarget(null); setGen((g) => g + 1); router.refresh(); }}
        />
      )}
    </div>
  );
}

// -- Eligible Customers tab ----------------------------------------------------

type FilterMode = "email" | "tenure";

function EligibleTab() {
  const [mode, setMode] = useState<FilterMode>("tenure");
  const [email, setEmail] = useState("");
  const [tenure, setTenure] = useState("1");
  const [minAmount, setMinAmount] = useState("10000");
  const [rows, setRows] = useState<WholesaleEligibleCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<EnrollTarget | null>(null);
  const router = useRouter();
  // Generation counter guards against a slow earlier search resolving after a
  // newer one (stale-response guard, mirroring ImpactClient's genRef).
  const genRef = useRef(0);
  const lastFilterRef = useRef<EligibleFilter>({ tenureMonths: 1, minimumTotalAmount: 10000 });

  const searchFields = useCallback(() => [], []);
  const table = useClientTable(rows, { searchFields, pageSize: PAGE_SIZE });

  const runSearch = useCallback((filter: EligibleFilter) => {
    lastFilterRef.current = filter;
    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    setSearched(true);
    fetchEligibleCustomers(filter).then((res) => {
      if (gen !== genRef.current) return;
      if (res.ok) { setRows(res.data); }
      else { setError(res.error); setRows([]); }
      setLoading(false);
    });
  }, []);

  const handleSearch = () => {
    const filter: EligibleFilter = {};
    if (mode === "email") {
      if (!email.trim()) return;
      filter.email = email.trim();
    } else {
      if (!tenure.trim() && !minAmount.trim()) return;
      if (tenure.trim()) filter.tenureMonths = Number(tenure);
      if (minAmount.trim()) filter.minimumTotalAmount = Number(minAmount);
    }
    runSearch(filter);
  };

  // Default view (mirrors the original manage-loyalty-program): land on a ranked
  // list using the default tenure(1)+min(10000) criteria — no blank state.
  useEffect(() => {
    runSearch({ tenureMonths: 1, minimumTotalAmount: 10000 });
  }, [runSearch]);

  const openEnroll = (r: WholesaleEligibleCustomer) => {
    setEnrollTarget({
      mode: "enroll",
      customerId: r.customerId,
      customerLabel: r.userName || r.email,
      form: {
        tenure: Number(tenure) || 6,
        discountPercentage: 10,
        minimumOrderValue: Number(minAmount) || 10000,
        minimumOrderValueCurrency: "INR",
        exchangeRate: 1,
      },
    });
  };

  const columns = useMemo<DataListColumn<WholesaleEligibleCustomer>[]>(() => [
    {
      key: "userName", label: "Name",
      render: (r) => <span className="font-medium text-sm" style={{ color: "#1A1714" }}>{r.userName || "—"}</span>,
    },
    {
      key: "email", label: "Email",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.email || "—"}</span>,
    },
    {
      key: "totalOrderCount", label: "Orders",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{formatCount(r.totalOrderCount)}</span>,
    },
    {
      key: "totalOrderValue", label: "Lifetime Value",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{formatPrice(r.totalOrderValue)}</span>,
    },
    {
      key: "tenureMonths", label: "Tenure",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.tenureMonths ?? "—"}m</span>,
    },
    {
      key: "eligible", label: "Status",
      render: (r) => r.eligible
        ? <Badge variant="green">Eligible</Badge>
        : <Badge variant="stone">Not eligible</Badge>,
    },
    {
      key: "enroll", label: "",
      render: (r) => (
        <button
          type="button"
          className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
          style={{ background: "#FEF3E2", color: "#A86120" }}
          onClick={() => openEnroll(r)}
        >
          Enroll
        </button>
      ),
    },
  ], []);

  const modeTabs = [
    { id: "email", label: "Search by name or email" },
    { id: "tenure", label: "Search by tenure + amount" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Filter form */}
      <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}>
        <div className="mb-4">
          <TabBar
            tabs={modeTabs}
            active={mode}
            onChange={(id) => { setMode(id as FilterMode); setRows([]); setSearched(false); }}
            variant="pill"
            pillStyle="soft"
            ariaLabel="Eligibility filter mode"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {mode === "email" ? (
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium mb-1" style={{ color: "#847D77" }}>Name or email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="e.g. tereska (partial name or email)"
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{ borderColor: "#E8E4DE", color: "#1A1714", background: "#FFFFFF" }}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#847D77" }}>Tenure (months)</label>
                <input
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  placeholder="e.g. 6"
                  className="w-28 rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "#E8E4DE", color: "#1A1714", background: "#FFFFFF" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#847D77" }}>Min. total (₹)</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-36 rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "#E8E4DE", color: "#1A1714", background: "#FFFFFF" }}
                />
              </div>
            </>
          )}
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: "#A86120", color: "#FFFFFF" }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {searched && !loading && !error && (
        <DataList
          data={table.paged}
          columns={columns}
          getId={(r) => (r.customerId ? String(r.customerId) : r.email)}
          total={table.filtered.length}
          page={table.page}
          pageSize={PAGE_SIZE}
          onPageChange={table.setPage}
          emptyMessage="No eligible customers found for this filter."
          loading={false}
        />
      )}

      {!searched && (
        <p className="text-sm text-center py-8" style={{ color: "#AAA39E" }}>
          Enter a filter above and click Search to discover eligible customers.
        </p>
      )}

      {enrollTarget && (
        <EnrollDrawer
          target={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onSaved={() => { setEnrollTarget(null); runSearch(lastFilterRef.current); router.refresh(); }}
        />
      )}
    </div>
  );
}

// -- Shell ---------------------------------------------------------------------

const MAIN_TABS = [
  { id: "enrolled", label: "Enrolled Customers", icon: UserCheck },
  { id: "eligible", label: "Eligible Customers", icon: Users },
];

export function WholesaleClient() {
  const [tab, setTab] = useState<MainTab>("enrolled");

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Commerce</span><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Wholesale</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Wholesale</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Wholesale loyalty program — enrolled members and eligible customer discovery
            </p>
          </div>
          <UserCheck className="h-6 w-6" style={{ color: "#A86120" }} />
        </div>

        {/* Main tab bar */}
        <TabBar
          tabs={MAIN_TABS}
          active={tab}
          onChange={(id) => setTab(id as MainTab)}
          variant="underline"
          weight="semibold"
          ariaLabel="Wholesale tabs"
        />

        {/* Tab content */}
        {tab === "enrolled" && <EnrolledTab />}
        {tab === "eligible" && <EligibleTab />}
      </div>
    </WeaveShell>
  );
}
