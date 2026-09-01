"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchSelectOption {
  id: number | string;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  value: SearchSelectOption | null;
  onChange: (opt: SearchSelectOption | null) => void;
  placeholder?: string;
  /** Static option list, filtered client-side as the user types. */
  options?: SearchSelectOption[];
  /** Async lookup (e.g. server-side search) — takes precedence over `options`. */
  onSearch?: (query: string) => Promise<SearchSelectOption[]>;
  /** Minimum characters before onSearch fires. Default 1. */
  minChars?: number;
  clearable?: boolean;
  className?: string;
}

/** Searchable single-select combobox. Backed by a static list or an async lookup. */
export function SearchSelect({
  value,
  onChange,
  placeholder = "Search…",
  options,
  onSearch,
  minChars = 1,
  clearable = true,
  className,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [asyncResults, setAsyncResults] = useState<SearchSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!onSearch) return;
    if (query.trim().length < minChars) {
      setAsyncResults([]);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await onSearch(query.trim());
        if (reqId.current === id) setAsyncResults(res);
      } finally {
        if (reqId.current === id) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, onSearch, minChars]);

  // Static-options filter matches BOTH label and sublabel. The sublabel is not
  // decoration: the product/order pickers put the SKU there (and, where a line is
  // being chosen, "line #<id>"), so a label-only filter made the single most likely thing an
  // operator types into "Search products…" — the SKU — match nothing at all.
  const filtered = useMemo(() => {
    if (onSearch) return asyncResults;
    const q = query.trim().toLowerCase();
    if (!options) return [];
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? "").toLowerCase().includes(q),
    );
  }, [onSearch, asyncResults, options, query]);

  function select(opt: SearchSelectOption) {
    onChange(opt);
    setQuery("");
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setQuery("");
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="form-input flex h-9 w-full items-center justify-between gap-2 bg-white text-left text-sm"
      >
        {value ? (
          <span className="min-w-0 flex-1 truncate" style={{ color: "#1A1714" }}>
            {value.label}
            {value.sublabel && <span style={{ color: "#AAA39E" }}> · {value.sublabel}</span>}
          </span>
        ) : (
          <span className="truncate" style={{ color: "#AAA39E" }}>{placeholder}</span>
        )}
        {value && clearable && (
          <span role="button" tabIndex={-1} onClick={clear} className="flex-shrink-0" style={{ color: "#AAA39E" }}>
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-white py-1 shadow-lg"
          style={{ borderColor: "#E8E4DE" }}
        >
          <div className="px-2 pb-1">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="form-input h-8 text-sm"
            />
          </div>
          {loading && (
            <p className="px-3 py-2 text-xs" style={{ color: "#847D77" }}>Searching…</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="px-3 py-2 text-xs" style={{ color: "#847D77" }}>
              {onSearch && query.trim().length < minChars ? "Keep typing to search…" : "No options."}
            </p>
          )}
          {!loading &&
            filtered.map((o) => (
              <button
                type="button"
                key={String(o.id)}
                onClick={() => select(o)}
                className="flex w-full flex-col items-start px-3 py-1.5 text-left text-sm hover:bg-stone-50"
                style={{ color: "#1A1714" }}
              >
                <span className="truncate">{o.label}</span>
                {o.sublabel && (
                  <span className="truncate text-xs" style={{ color: "#AAA39E" }}>{o.sublabel}</span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
