"use client";

/**
 * PaginatedDataList — the reusable server-paginated list surface.
 *
 * Drops the usePaginatedList engine onto the design-system DataList: a caller
 * supplies a `fetcher` (returns one page of rows + total), the columns, and a
 * row id, and gets non-blocking load + skeleton, server-side search, and
 * prev/next pagination controls for free. This is the phase-2 building block —
 * any list screen becomes fast by swapping its client component for one of
 * these.
 */

import React from "react";
import { DataList, DataListColumn, BulkAction } from "./DataList";
import { usePaginatedList, FetcherArgs, PageResult } from "@/lib/usePaginatedList";

export interface PaginatedDataListProps<T> {
  fetcher: (args: FetcherArgs) => Promise<PageResult<T>>;
  columns: DataListColumn<T>[];
  getId: (row: T) => string;
  pageSize?: number;
  /** Values that reset to page 1 + refetch when changed (tab, filters). */
  deps?: unknown[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  filterPanel?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  bulkActions?: BulkAction<T>[];
  renderGridItem?: (row: T) => React.ReactNode;
  defaultView?: "list" | "grid";
}

export function PaginatedDataList<T>({
  fetcher,
  columns,
  getId,
  pageSize = 25,
  deps = [],
  searchPlaceholder,
  emptyMessage,
  filterPanel,
  primaryAction,
  bulkActions,
  renderGridItem,
  defaultView,
}: PaginatedDataListProps<T>) {
  const { data, total, page, setPage, setSearch, loading, error } = usePaginatedList<T>({
    fetcher,
    pageSize,
    deps,
  });

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div
          className="rounded-lg border px-4 py-2.5 text-sm"
          style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
        >
          Failed to load: {error}
        </div>
      )}
      <DataList
        data={data}
        columns={columns}
        getId={getId}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        filterPanel={filterPanel}
        primaryAction={primaryAction}
        bulkActions={bulkActions}
        renderGridItem={renderGridItem}
        defaultView={defaultView}
      />
    </div>
  );
}
