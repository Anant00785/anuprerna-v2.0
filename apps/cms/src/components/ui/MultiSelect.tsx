"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Option {
  id: number | string;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  value: (number | string)[];
  onChange: (value: (number | string)[]) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

/** Chip-style multi-select with a searchable checkbox popover. */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  error,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = useMemo(
    () => options.filter((o) => value.includes(o.id)),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
  }, [options, query]);

  function toggle(id: number | string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "form-input flex min-h-[40px] w-full flex-wrap items-center gap-1.5 bg-white text-left",
          error && "border-red-400",
        )}
      >
        {selected.length === 0 && (
          <span style={{ color: "#AAA39E" }}>{placeholder}</span>
        )}
        {selected.map((o) => (
          <span
            key={String(o.id)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: "#FFF8F0", color: "#8A4C19" }}
          >
            {o.name}
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                toggle(o.id);
              }}
              className="cursor-pointer hover:text-red-600"
            >
              ×
            </span>
          </span>
        ))}
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
              placeholder="Search…"
              className="form-input h-8 text-sm"
            />
          </div>
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs" style={{ color: "#847D77" }}>
              No options.
            </p>
          )}
          {filtered.map((o) => {
            const isSel = value.includes(o.id);
            return (
              <button
                type="button"
                key={String(o.id)}
                onClick={() => toggle(o.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-stone-50"
                style={{ color: "#1A1714" }}
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded border text-[10px]"
                  style={{
                    borderColor: isSel ? "#A86120" : "#D8D3CC",
                    background: isSel ? "#A86120" : "white",
                    color: "white",
                  }}
                >
                  {isSel ? "✓" : ""}
                </span>
                {o.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
