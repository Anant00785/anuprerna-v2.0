"use client";

/**
 * usePaginatedList — the reusable server-side-pagination engine for list
 * screens (Users, Listings, and every future paginated table in phase 2).
 *
 * Owns page / search (debounced) / loading / error / data / total and drives
 * an abortable fetch on every [page, debounced-search, deps] change. The caller
 * supplies a `fetcher` that returns { rows, total } for a given page — where the
 * data actually comes from (a Next /api route hitting the paginated wrapper) is
 * the caller's concern, so the hook stays screen-agnostic.
 *
 * Contract:
 *   - Changing the search box or any `deps` entry resets to page 1.
 *   - In-flight requests are aborted when inputs change (no race / stale paint).
 *   - `loading` is true during every fetch; `error` holds the last failure.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface PageResult<T> {
  rows: T[];
  total: number;
}

export interface FetcherArgs {
  page: number;
  pageSize: number;
  search: string;
  signal: AbortSignal;
}

export interface UsePaginatedListArgs<T> {
  fetcher: (args: FetcherArgs) => Promise<PageResult<T>>;
  pageSize?: number;
  debounceMs?: number;
  /** Extra values that, when changed, reset to page 1 and refetch (tab, filters). */
  deps?: unknown[];
}

export interface UsePaginatedListState<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setSearch: (q: string) => void;
  reload: () => void;
}

export function usePaginatedList<T>({
  fetcher,
  pageSize = 25,
  debounceMs = 300,
  deps = [],
}: UsePaginatedListArgs<T>): UsePaginatedListState<T> {
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [debounced, setDebounced] = useState("");
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Keep the latest fetcher without making it a fetch dependency (callers pass
  // an inline closure that changes identity every render).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const depsKey = JSON.stringify(deps);

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), debounceMs);
    return () => clearTimeout(t);
  }, [search, debounceMs]);

  // Reset to page 1 whenever the (debounced) search or any dep changes.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, depsKey]);

  // The abortable fetch.
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetcherRef
      .current({ page, pageSize, search: debounced, signal: ctrl.signal })
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setData(res.rows);
        setTotal(res.total);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted || (e as { name?: string })?.name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
        setData([]);
        setTotal(0);
        setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debounced, depsKey, reloadKey]);

  const setSearch = useCallback((q: string) => setSearchState(q), []);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { data, total, page, pageSize, search, loading, error, setPage, setSearch, reload };
}
