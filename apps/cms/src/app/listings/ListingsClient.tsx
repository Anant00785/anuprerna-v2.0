"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataListColumn, Badge, Button, Textarea, Select, statusBadgeVariant, PaginatedDataList } from "@/components/ui";
import { ListingRow, ListingStatus } from "@/lib/types";
import type { PageResult } from "@/lib/usePaginatedList";
import { formatPrice } from "@/lib/utils";
import type {
  CatalogCategory,
  CatalogSegment,
  CatalogSubCategory,
  CatalogSimpleItem,
} from "@/types/catalog";

const PAGE_SIZE = 50;

type TypeFilter = "all" | "fabric" | "finished";
type StatusFilter = "all" | ListingStatus;

interface Taxonomy {
  categories: CatalogCategory[];
  segments: CatalogSegment[];
  subCategories: CatalogSubCategory[];
  skuGroups: CatalogSimpleItem[];
  specialStatuses: CatalogSimpleItem[];
}

const EMPTY_TAXONOMY: Taxonomy = {
  categories: [],
  segments: [],
  subCategories: [],
  skuGroups: [],
  specialStatuses: [],
};

// ── Column definitions ─────────────────────────────────────────────────────

const COLUMNS: DataListColumn<ListingRow>[] = [
  {
    key: "name",
    label: "Product",
    cellClassName: "min-w-64",
    render: (row) => (
      <Link
        href={`/listings/${row.id}`}
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
            row.sku.slice(0, 2)
          )}
        </div>
        <div className="min-w-0">
          <p
            className="font-medium truncate max-w-xs group-hover/product:underline"
            style={{ color: "#1A1714" }}
          >
            {row.name}
          </p>
          <p className="text-xs truncate" style={{ color: "#847D77" }}>
            {row.sku}
          </p>
        </div>
      </Link>
    ),
  },
  {
    key: "category",
    label: "Category",
    render: (row) => (
      <span className="text-sm" style={{ color: "#635D58" }}>
        {row.subCategory || row.category || "—"}
      </span>
    ),
  },
  {
    key: "type",
    label: "Type",
    render: (row) => (
      <Badge variant={row.productType === "fabric" ? "blue" : "purple"}>
        {row.productType}
      </Badge>
    ),
  },
  {
    key: "price",
    label: "Price",
    render: (row) => (
      <span className="font-medium tabular-nums" style={{ color: "#1A1714" }}>
        {formatPrice(row.price)}
      </span>
    ),
  },
  {
    key: "stock",
    label: "Stock",
    render: (row) => (
      <span
        className="text-sm tabular-nums"
        style={{
          color:
            row.quantity === 0 ? "#B91C1C" : row.quantity < 5 ? "#B45309" : "#1A1714",
        }}
      >
        {row.quantity === 0 ? "Out of stock" : `${row.quantity} units`}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <Badge variant={statusBadgeVariant(row.status)}>
          {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
        </Badge>
        {row.disabled && <Badge variant="stone">Disabled</Badge>}
      </div>
    ),
  },
  {
    // Clone action (feedback a83db56c): opens the create form pre-filled from
    // this row's product, in the SAME window. Unique identifiers (SKU/Zoho/id)
    // are cleared server-side so it saves as a NEW listing.
    key: "actions",
    label: "",
    cellClassName: "text-right",
    render: (row) => (
      <Link
        href={`/listings/${row.id}/clone?type=${row.productType}`}
        title="Clone into a new listing"
        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[#F3F1ED]"
        style={{ color: "#635D58", borderColor: "#E8E4DE", textDecoration: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        Clone
      </Link>
    ),
  },
];

// ── Bulk price update drawer ────────────────────────────────────────────────
// Live: manage-product's "Bulk Price Update" quick action uploads a price list
// -> bulkUpdateProductPrice. Weave equivalent: paste "SKU,price" lines (one per
// product) -> PATCH /api/crud update/bulk/product-price. Sandbox-only write.

function BulkPriceDrawer({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const parsedCount = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && l.includes(",")).length;

  const doSave = async () => {
    setSaving(true);
    setResult(null);
    const productPriceList = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && l.includes(","))
      .map((l) => {
        const [sku, price] = l.split(",").map((s) => s.trim());
        return { sku, price: Number(price) };
      })
      .filter((r) => r.sku && Number.isFinite(r.price));

    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "update/bulk/product-price", method: "PATCH", body: { productPriceList } }),
      });
      const j = await res.json().catch(() => ({}));
      const ok = res.ok && j?.success !== false;
      setResult({ ok, message: ok ? `Updated ${productPriceList.length} product price(s) in the sandbox.` : (j?.message || `Failed (${res.status})`) });
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl border shadow-2xl max-w-lg w-full" style={{ borderColor: "#E8E4DE" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E8E4DE" }}>
          <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>Bulk price update</h3>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#847D77" }}>&times;</button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#FEF3C7", color: "#92400E" }}>
            Saves to the sandbox test DB only (never live). One row per line: <code>SKU,price</code>.
          </p>
          <Textarea
            className="min-h-[160px] font-mono text-sm"
            placeholder={"DPB1250009,950\nShiftDress,2200"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs" style={{ color: "#847D77" }}>{parsedCount} row(s) parsed</p>
          {result && (
            <div
              className="rounded-lg border px-3 py-2 text-xs"
              style={result.ok ? { background: "#ECFDF5", borderColor: "#A7F3D0", color: "#047857" } : { background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }}
            >
              {result.message}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          <Button variant="primary" size="sm" onClick={doSave} disabled={parsedCount === 0 || saving} loading={saving}>
            {saving ? "Updating…" : `Update ${parsedCount || ""} price(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export function ListingsClient() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showBulkPrice, setShowBulkPrice] = useState(false);

  // ── Taxonomy filters (category/segment/sub-category cascade; sku-group and
  // special-status are independent flat dimensions) ─────────────────────────
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(EMPTY_TAXONOMY);
  const [categoryId, setCategoryId] = useState(0);
  const [segmentId, setSegmentId] = useState(0);
  const [subCategoryId, setSubCategoryId] = useState(0);
  const [skuGroupId, setSkuGroupId] = useState(0);
  const [specialStatusId, setSpecialStatusId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/listings/taxonomy")
      .then((res) => res.json())
      .then((j: Partial<Taxonomy>) => {
        if (cancelled) return;
        setTaxonomy({
          categories: j.categories ?? [],
          segments: j.segments ?? [],
          subCategories: j.subCategories ?? [],
          skuGroups: j.skuGroups ?? [],
          specialStatuses: j.specialStatuses ?? [],
        });
      })
      .catch(() => {
        /* best-effort: filter dropdowns just render empty on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Segment options scoped to the chosen category; sub-category options
  // scoped to the chosen segment, or category alone if no segment is picked
  // yet — mirrors the live reference's cascading filter dropdowns.
  const segmentOpts = useMemo(
    () =>
      categoryId === 0
        ? taxonomy.segments
        : taxonomy.segments.filter((s) => (s.category?.id ?? s.categoryId) === categoryId),
    [taxonomy.segments, categoryId],
  );

  const subCategoryOpts = useMemo(() => {
    if (segmentId !== 0) {
      return taxonomy.subCategories.filter((s) => (s.segment?.id ?? s.segmentId) === segmentId);
    }
    if (categoryId !== 0) {
      return taxonomy.subCategories.filter((s) => (s.category?.id ?? s.categoryId) === categoryId);
    }
    return taxonomy.subCategories;
  }, [taxonomy.subCategories, categoryId, segmentId]);

  const onCategoryChange = useCallback((id: number) => {
    setCategoryId(id);
    setSegmentId(0);
    setSubCategoryId(0);
  }, []);

  const onSegmentChange = useCallback((id: number) => {
    setSegmentId(id);
    setSubCategoryId(0);
  }, []);

  const fetcher = useCallback(
    async ({ page, pageSize, search, signal }: { page: number; pageSize: number; search: string; signal: AbortSignal }): Promise<PageResult<ListingRow>> => {
      const p = new URLSearchParams({
        pageNumber: String(page - 1),
        pageSize: String(pageSize),
        search,
        productType: typeFilter,
        status: statusFilter,
        returnDisabledProducts: "true",
      });
      if (categoryId) p.set("category", String(categoryId));
      if (segmentId) p.set("segment", String(segmentId));
      if (subCategoryId) p.set("subCategory", String(subCategoryId));
      if (skuGroupId) p.set("skuGroup", String(skuGroupId));
      if (specialStatusId) p.set("specialStatus", String(specialStatusId));
      const res = await fetch(`/api/listings?${p.toString()}`, { signal });
      const j = await res.json();
      return { rows: (j.rows as ListingRow[]) ?? [], total: j.total ?? 0 };
    },
    [typeFilter, statusFilter, categoryId, segmentId, subCategoryId, skuGroupId, specialStatusId],
  );

  // ── Filter panel ────────────────────────────────────────────────────────
  const filterPanel = (
    <div className="flex flex-wrap gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
          Type
        </span>
        <div className="flex gap-2">
          {(["all", "fabric", "finished"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="rounded-lg border px-3 py-1 text-sm font-medium transition-colors"
              style={
                typeFilter === t
                  ? { background: "#A86120", color: "white", borderColor: "#A86120" }
                  : { background: "white", color: "#635D58", borderColor: "#E8E4DE" }
              }
            >
              {t === "all" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
          Status
        </span>
        <div className="flex gap-2">
          {(["all", "ACTIVE", "DRAFT", "INACTIVE"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-lg border px-3 py-1 text-sm font-medium transition-colors"
              style={
                statusFilter === s
                  ? { background: "#A86120", color: "white", borderColor: "#A86120" }
                  : { background: "white", color: "#635D58", borderColor: "#E8E4DE" }
              }
            >
              {s === "all" ? "All statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
          Category
        </span>
        <Select
          className="min-w-[160px]"
          options={taxonomy.categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All categories"
          value={categoryId || ""}
          onChange={(e) => onCategoryChange(Number(e.target.value) || 0)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
          Segment
        </span>
        <Select
          className="min-w-[160px]"
          options={segmentOpts.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="All segments"
          value={segmentId || ""}
          onChange={(e) => onSegmentChange(Number(e.target.value) || 0)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
          Sub-Category
        </span>
        <Select
          className="min-w-[160px]"
          options={subCategoryOpts.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="All sub-categories"
          value={subCategoryId || ""}
          onChange={(e) => setSubCategoryId(Number(e.target.value) || 0)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
          SKU Group
        </span>
        <Select
          className="min-w-[160px]"
          options={taxonomy.skuGroups.map((g) => ({ value: g.id, label: g.name }))}
          placeholder="All groups"
          value={skuGroupId || ""}
          onChange={(e) => setSkuGroupId(Number(e.target.value) || 0)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#847D77" }}>
          Special Status
        </span>
        <Select
          className="min-w-[160px]"
          options={taxonomy.specialStatuses.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="All"
          value={specialStatusId || ""}
          onChange={(e) => setSpecialStatusId(Number(e.target.value) || 0)}
        />
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
            Listings
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              Listings
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Manage your fabric and finished product catalogue.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => setShowBulkPrice(true)}>Bulk price update</Button>
            <Link href="/listings/new?type=fabric">
              <Button variant="primary" size="md">+ New fabric product</Button>
            </Link>
            <Link href="/listings/new?type=finished">
              <Button variant="secondary" size="md">+ New finished product</Button>
            </Link>
          </div>
        </div>

        <PaginatedDataList<ListingRow>
          fetcher={fetcher}
          columns={COLUMNS}
          getId={(row) => String(row.id)}
          pageSize={PAGE_SIZE}
          deps={[typeFilter, statusFilter, categoryId, segmentId, subCategoryId, skuGroupId, specialStatusId]}
          searchPlaceholder="Search by title, SKU, or category..."
          filterPanel={filterPanel}
          emptyMessage="No products match your search or filters."
        />
      </div>
      {showBulkPrice && <BulkPriceDrawer onClose={() => setShowBulkPrice(false)} />}
    </WeaveShell>
  );
}
