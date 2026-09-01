"use client";

import React, { useState } from "react";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Pagination } from "./Pagination";

// ── Types ─────────────────────────────────────────────────────────────────

export interface DataListColumn<T> {
  key: string;
  label: string;
  render: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
}

export interface BulkAction<T> {
  label: string;
  onClick: (selected: T[]) => void;
}

export interface DataListProps<T> {
  data: T[];
  columns: DataListColumn<T>[];
  getId: (row: T) => string;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  primaryAction?: { label: string; onClick: () => void };
  bulkActions?: BulkAction<T>[];
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  renderGridItem?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  defaultView?: "list" | "grid";
  /** Optional filter panel rendered below the toolbar when Filters is active */
  filterPanel?: React.ReactNode;
  /** When provided, rows become expandable: clicking a row toggles an inline
   *  panel rendered full-width beneath it. Clicks on links/buttons/inputs inside
   *  a row are ignored so those keep their own behaviour. */
  expandable?: (row: T) => React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────

export function DataList<T>({
  data,
  columns,
  getId,
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  primaryAction,
  bulkActions = [],
  searchPlaceholder = "Search...",
  onSearch,
  renderGridItem,
  loading = false,
  emptyMessage = "No items found",
  defaultView = "list",
  filterPanel,
  expandable,
}: DataListProps<T>) {
  const [view, setView] = useState<"list" | "grid">(defaultView);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize + 1;
  const pageEnd   = Math.min(page * pageSize, total);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onSearch?.(e.target.value);
  };

  const toggleAll = () => {
    if (selected.size === data.length && data.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map(getId)));
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = data.length > 0 && selected.size === data.length;
  const someSelected = selected.size > 0 && !allSelected;
  const selectedRows = data.filter((r) => selected.has(getId(r)));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Top action bar ── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: "#AAA39E" }}
          />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            className="form-input pl-9"
          />
        </div>

        {/* Bulk actions (appear when rows selected) */}
        {selected.size > 0 && bulkActions.map((action, i) => (
          <Button
            key={i}
            variant="secondary"
            size="sm"
            onClick={() => action.onClick(selectedRows)}
          >
            {action.label} ({selected.size})
          </Button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Filters toggle (only when a filter panel is actually provided) */}
        {filterPanel && (
          <Button
            variant={showFilters ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowFilters((f) => !f)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </Button>
        )}

        {/* View toggle */}
        {renderGridItem && (
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: "#E8E4DE" }}
          >
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-2 transition-colors",
                view === "list"
                  ? "bg-stone-100"
                  : "bg-white hover:bg-stone-50",
              )}
              title="List view"
            >
              <List className="h-3.5 w-3.5" style={{ color: "#635D58" }} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-2 border-l transition-colors",
                view === "grid"
                  ? "bg-stone-100"
                  : "bg-white hover:bg-stone-50",
              )}
              style={{ borderColor: "#E8E4DE" }}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" style={{ color: "#635D58" }} />
            </button>
          </div>
        )}

        {/* Primary action */}
        {primaryAction && (
          <Button variant="primary" size="sm" onClick={primaryAction.onClick}>
            + {primaryAction.label}
          </Button>
        )}
      </div>

      {/* ── Filter panel (shown when Filters is active and filterPanel provided) ── */}
      {showFilters && filterPanel && (
        <div
          className="rounded-xl border px-5 py-4"
          style={{ background: "#FAF9F7", borderColor: "#E8E4DE" }}
        >
          {filterPanel}
        </div>
      )}

      {/* ── Meta bar ── */}
      {total > 0 && (
        <div className="flex items-center justify-between text-xs" style={{ color: "#847D77" }}>
          <span>
            {total > pageSize
              ? `${pageStart.toLocaleString("en-IN")}–${pageEnd.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")}`
              : `${total.toLocaleString("en-IN")} item${total !== 1 ? "s" : ""}`}
          </span>
          {selected.size > 0 && (
            <span className="font-medium" style={{ color: "#A86120" }}>
              {selected.size} selected
            </span>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "#E8E4DE", borderTopColor: "#A86120" }}
          />
        </div>
      ) : view === "list" ? (
        <div
          className="rounded-xl border bg-white overflow-x-auto"
          style={{ borderColor: "#E8E4DE" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #F3F1ED", background: "#FAF9F7" }}>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider",
                      col.headerClassName,
                    )}
                    style={{ color: "#847D77" }}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-14 text-center text-sm"
                    style={{ color: "#AAA39E" }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, i) => {
                  const id = getId(row);
                  const isSelected = selected.has(id);
                  const isExpanded = expandable != null && expanded.has(id);
                  return (
                    <React.Fragment key={id}>
                    <tr
                      className={cn("transition-colors group", expandable ? "cursor-pointer" : "")}
                      style={{
                        borderBottom: isExpanded ? undefined : i < data.length - 1 ? "1px solid #F3F1ED" : undefined,
                        background: isSelected ? "#FFF8F0" : isExpanded ? "#FAF9F7" : undefined,
                      }}
                      onClick={
                        expandable
                          ? (e) => {
                              const t = e.target as HTMLElement;
                              if (t.closest("a, button, input, label")) return;
                              toggleExpand(id);
                            }
                          : undefined
                      }
                      onMouseEnter={(e) => {
                        if (!isSelected && !isExpanded) (e.currentTarget as HTMLElement).style.background = "#FAF9F7";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isExpanded) (e.currentTarget as HTMLElement).style.background = "";
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="h-3.5 w-3.5 rounded"
                        />
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn("px-4 py-3.5", col.cellClassName)}
                        >
                          {col.render(row, i)}
                        </td>
                      ))}
                      <td className="px-4 py-3.5">
                        {expandable ? (
                          <ChevronRight
                            className="h-4 w-4 transition-transform"
                            style={{ color: "#847D77", transform: isExpanded ? "rotate(90deg)" : "none" }}
                          />
                        ) : (
                          <button
                            className="rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-100"
                            style={{ color: "#847D77" }}
                            title="More actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && expandable && (
                      <tr
                        style={{
                          borderBottom: i < data.length - 1 ? "1px solid #F3F1ED" : undefined,
                          background: "#FDFCFA",
                        }}
                      >
                        <td colSpan={columns.length + 2} className="px-4">
                          {expandable(row)}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.map((row) => (
            <div key={getId(row)}>{renderGridItem?.(row)}</div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => onPageChange?.(p)} />
    </div>
  );
}
