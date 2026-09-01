"use client";

import React, { useState, useMemo } from "react";
import { Heart } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, DataListColumn, Badge } from "@/components/ui";
import { CatalogPayloadDrawer } from "@/components/catalog/CatalogPayloadDrawer";
import { formatEpoch, formatPrice, formatCount } from "@/lib/utils";
import type { LoyaltyMetricsRow } from "@/lib/admin-api";

type Tab = "active" | "inactive";
const PAGE_SIZE = 25;

interface LoyaltyClientProps {
  active: LoyaltyMetricsRow[];
  inactive: LoyaltyMetricsRow[];
}

export function LoyaltyClient({ active, inactive }: LoyaltyClientProps) {
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawerPayload, setDrawerPayload] = useState<Record<string, unknown> | null>(null);

  const switchTab = (t: Tab) => { setTab(t); setSearch(""); setPage(1); };
  const rows = tab === "active" ? active : inactive;

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      r.userName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo<DataListColumn<LoyaltyMetricsRow>[]>(() => [
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
      key: "totalLoyaltyOrderCount", label: "Loyalty Orders",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{formatCount(r.totalLoyaltyOrderCount)}</span>,
    },
    {
      key: "totalLoyaltyDiscountValue", label: "Loyalty Discount",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{formatPrice(r.totalLoyaltyDiscountValue)}</span>,
    },
    {
      key: "cycleTotalOrderCount", label: "Cycle Orders",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{formatCount(r.cycleTotalOrderCount)}</span>,
    },
    {
      key: "tenure", label: "Tenure",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.membershipConfig ? `${r.membershipConfig.tenure}m` : "—"}</span>,
    },
    {
      key: "discountPct", label: "Discount %",
      render: (r) => r.membershipConfig
        ? <Badge variant="green">{r.membershipConfig.discountPercentage}%</Badge>
        : <span style={{ color: "#D1CCC6" }}>—</span>,
    },
    {
      key: "endDate", label: "End Date",
      render: (r) => <span className="text-sm" style={{ color: "#635D58" }}>{r.membershipConfig ? formatEpoch(r.membershipConfig.endDate) : "—"}</span>,
    },
    {
      key: "actions", label: "",
      render: (r) => {
        if (!r.membershipConfig) return null;
        const mc = r.membershipConfig;
        const payload: Record<string, unknown> = {
          id: mc.id,
          customerId: r.customerId,
          tenure: mc.tenure,
          discountPercentage: mc.discountPercentage,
          minimumOrderValueCurrency: mc.minimumOrderValueCurrency,
          minimumOrderValue: mc.minimumOrderValue,
          minimumOrderValueINR: mc.minimumOrderValueINR,
          exchangeRate: mc.exchangeRate,
          type: mc.id > 0 ? "RENEWAL_MANUAL" : "ONBOARDING",
        };
        return (
          <button
            type="button"
            className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
            style={{ background: "#FEF3E2", color: "#A86120" }}
            onClick={() => setDrawerPayload(payload)}
          >
            Update Loyalty
          </button>
        );
      },
    },
  ], []);

  const tabList = [
    { id: "active" as Tab, label: "Active", count: active.length },
    { id: "inactive" as Tab, label: "Inactive", count: inactive.length },
  ];

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Relationships</span><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Loyalty</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Loyalty Program</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              {formatCount(active.length)} active · {formatCount(inactive.length)} inactive members
            </p>
          </div>
          <Heart className="h-6 w-6" style={{ color: "#A86120" }} />
        </div>

        <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: "#E8E4DE" }}>
          {tabList.map((t) => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => switchTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2"
                style={{ color: isActive ? "#A86120" : "#847D77", borderColor: isActive ? "#A86120" : "transparent" }}
              >
                {t.label}
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: isActive ? "#FEF3E2" : "#F3F1ED", color: isActive ? "#A86120" : "#847D77" }}>
                  {t.count.toLocaleString("en-IN")}
                </span>
              </button>
            );
          })}
        </div>

        <DataList
          key={tab}
          data={paged} columns={columns} getId={(r) => String(r.customerId)}
          total={filtered.length} page={page} pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onSearch={(q) => { setSearch(q); setPage(1); }}
          searchPlaceholder="Search by name or email…"
          emptyMessage={search ? `No members match "${search}"` : "No loyalty members found."}
        />
      </div>
      {drawerPayload && (
        <CatalogPayloadDrawer payload={drawerPayload} onClose={() => setDrawerPayload(null)} entityName="loyalty membership" />
      )}
    </WeaveShell>
  );
}
