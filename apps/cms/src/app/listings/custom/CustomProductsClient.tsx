"use client";

/**
 * CustomProductsClient — read-only custom-product table.
 *
 * Faithful port of the live custom-product-list (Product ID / Hero image /
 * Name / SKU / Price + edit) plus Group & Unit columns. The live "Add Product"
 * button and per-row edit icon are rendered as a DISABLED Read-only badge —
 * the sandbox performs zero mutations.
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, DataListColumn, Badge } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useClientTable } from "@/lib/useClientTable";
import type { CustomProduct } from "@/lib/custom-products-api";
import { groupLabel } from "@/lib/custom-products-api";

const PAGE_SIZE = 20;

// Live's "Add Product" / edit controls are unavailable in the sandbox.
function ReadOnlyBadge({ label = "Read-only" }: { label?: string }) {
  return (
    <span
      title="Read-only in sandbox — mutations are not available"
      className="rounded px-2 py-1 text-xs font-medium cursor-not-allowed opacity-50 select-none"
      style={{ background: "#F3F1ED", color: "#847D77", border: "1px solid #E8E4DE" }}
    >
      {label}
    </span>
  );
}

function usd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price || 0);
}

const COLUMNS: DataListColumn<CustomProduct>[] = [
  {
    key: "name",
    label: "Product",
    cellClassName: "min-w-64",
    render: (row) => (
      <Link
        href={`/listings/custom/${row.id}`}
        className="flex items-center gap-3 group/product"
        style={{ textDecoration: "none" }}
      >
        <div
          className="h-10 w-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold"
          style={{ background: "#F3F1ED", color: "#847D77", flexShrink: 0 }}
        >
          {row.heroImage ? (
            <Image
              src={row.heroImage}
              alt={row.name}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              loading="lazy"
              unoptimized
            />
          ) : (
            (row.sku || row.name).slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p
            className="font-medium truncate max-w-xs group-hover/product:underline"
            style={{ color: "#1A1714" }}
          >
            {row.name || "—"}
          </p>
          <p className="text-xs truncate" style={{ color: "#847D77" }}>
            #{row.id}
          </p>
        </div>
      </Link>
    ),
  },
  {
    key: "sku",
    label: "SKU",
    render: (row) => (
      <span className="text-sm tabular-nums" style={{ color: "#635D58" }}>
        {row.sku || "—"}
      </span>
    ),
  },
  {
    key: "group",
    label: "Group",
    render: (row) => (
      <Badge variant={row.productGroup === "fabric" ? "blue" : "purple"}>
        {groupLabel(row.productGroup)}
      </Badge>
    ),
  },
  {
    key: "unit",
    label: "Unit",
    render: (row) => (
      <span className="text-sm" style={{ color: "#635D58" }}>
        {row.unit || "—"}
      </span>
    ),
  },
  {
    key: "price",
    label: "Price",
    render: (row) => (
      <span className="font-medium tabular-nums" style={{ color: "#1A1714" }}>
        {usd(row.price)}
      </span>
    ),
  },
  {
    key: "actions",
    label: "",
    render: () => <ReadOnlyBadge label="Edit" />,
  },
];

type GroupFilter = "all" | "fabric" | "finished";

export function CustomProductsClient({
  rows,
  error,
}: {
  rows: CustomProduct[];
  error: string | null;
}) {
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");

  const scoped = useMemo(
    () => (groupFilter === "all" ? rows : rows.filter((r) => r.productGroup === groupFilter)),
    [rows, groupFilter],
  );

  const table = useClientTable<CustomProduct>(scoped, {
    searchFields: (r) => [r.name, r.sku, r.id, r.remarks],
    pageSize: PAGE_SIZE,
  });

  const filterPanel = (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
        Group
      </span>
      <div className="flex gap-2">
        {(["all", "fabric", "finished"] as GroupFilter[]).map((g) => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className="rounded-lg border px-3 py-1 text-sm font-medium transition-colors"
            style={
              groupFilter === g
                ? { background: "#A86120", color: "white", borderColor: "#A86120" }
                : { background: "white", color: "#635D58", borderColor: "#E8E4DE" }
            }
          >
            {g === "all" ? "All groups" : groupLabel(g)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <span>Catalog</span>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Custom Products
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              Custom Products
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Made-to-spec product records ({rows.length}). Read-only mirror of the live
              custom-product catalogue.
            </p>
          </div>
          <ReadOnlyBadge label="+ Add Product" />
        </div>

        {error ? (
          <ErrorBanner message={error} />
        ) : (
          <DataList<CustomProduct>
            data={table.paged}
            columns={COLUMNS}
            getId={(row) => String(row.id)}
            total={table.filtered.length}
            page={table.page}
            pageSize={PAGE_SIZE}
            onPageChange={table.setPage}
            onSearch={table.setSearch}
            searchPlaceholder="Search by name, SKU, or id..."
            filterPanel={filterPanel}
            emptyMessage="No custom products match your search or filter."
          />
        )}
      </div>
    </WeaveShell>
  );
}
