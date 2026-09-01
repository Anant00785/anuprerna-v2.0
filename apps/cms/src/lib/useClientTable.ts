"use client";

import { useState, useMemo, useEffect } from "react";

/**
 * useClientTable — one hook for the search + filter + paginate pattern that was
 * hand-rolled in seven table views (WhatsApp consent/history, logistics
 * shipping/discount/forex, wholesale enrolled/eligible).
 *
 * Pass the already-tab-filtered rows plus a `searchFields` accessor; the hook
 * returns the current page slice, the full filtered set (for totals), and the
 * page/search state + setters. Page auto-resets to 1 whenever `rows` change
 * (tab switch) or the search term changes.
 */
export interface UseClientTableOptions<T> {
  /** Fields to match the free-text search against for a given row. */
  searchFields: (row: T) => (string | number | null | undefined)[];
  pageSize: number;
}

export interface ClientTable<T> {
  paged: T[];
  filtered: T[];
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (q: string) => void;
}

export function useClientTable<T>(
  rows: T[],
  { searchFields, pageSize }: UseClientTableOptions<T>,
): ClientTable<T> {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      searchFields(r).some((f) => f != null && String(f).toLowerCase().includes(q)),
    );
  }, [rows, search, searchFields]);

  // Reset to page 1 when the underlying rows (tab switch) or search term change.
  useEffect(() => {
    setPage(1);
  }, [rows, search]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  return { paged, filtered, page, setPage, search, setSearch };
}
