"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pagination — shared Prev / numbered-pills / Next control. Extracted verbatim
 * from the pager that lived inside DataList so every list surface (Orders,
 * Custom Orders, Production Jobs) shows the same control. Windowed to 7 pills
 * with first/last clamping. Renders nothing when there is only one page.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-1 pt-2", className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="rounded-lg border p-2 transition-colors hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-40"
        style={{ borderColor: "#E8E4DE" }}
      >
        <ChevronLeft className="h-4 w-4" style={{ color: "#635D58" }} />
      </button>

      {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
        let p: number;
        if (totalPages <= 7) p = i + 1;
        else if (page <= 4) p = i + 1;
        else if (page >= totalPages - 3) p = totalPages - 6 + i;
        else p = page - 3 + i;
        if (p < 1 || p > totalPages) return null;
        const isActive = p === page;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={isActive ? "page" : undefined}
            className="h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors"
            style={
              isActive
                ? { background: "#A86120", color: "white" }
                : { color: "#635D58", background: "white", border: "1px solid #E8E4DE" }
            }
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="rounded-lg border p-2 transition-colors hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-40"
        style={{ borderColor: "#E8E4DE" }}
      >
        <ChevronRight className="h-4 w-4" style={{ color: "#635D58" }} />
      </button>
    </div>
  );
}
