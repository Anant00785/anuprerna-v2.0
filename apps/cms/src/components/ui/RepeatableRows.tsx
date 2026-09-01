"use client";

import React from "react";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { TextInput, Select } from "./FormField";
import { Toggle } from "./Toggle";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

export interface RepeatableColumn<R> {
  /** Key of the row object this column edits. */
  key: keyof R & string;
  /** Header label shown above the column. */
  label: string;
  /** Input kind. Defaults to "text". */
  type?: "text" | "number" | "toggle" | "select";
  /** Options for type="select". */
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  /** Tailwind width utility for the cell, e.g. "w-24". Defaults to flex-1. */
  width?: string;
  /** Step for number inputs. */
  step?: number;
}

export interface RepeatableRowsProps<R> {
  rows: R[];
  columns: RepeatableColumn<R>[];
  onChange: (rows: R[]) => void;
  /** Factory producing a fresh blank row when "Add" is clicked. */
  newRow: () => R;
  addLabel?: string;
  /** Show up/down reorder arrows on each row (default true). */
  reorder?: boolean;
  /** Message shown when there are no rows yet. */
  emptyMessage?: string;
}

// ── Component ───────────────────────────────────────────────────────────────
// Generic, business-logic-free reorderable list of typed row objects. The
// caller supplies a column config and a row factory; this component owns only
// add / remove / reorder / per-cell edit mechanics and renders design-system
// inputs (TextInput / Select / Toggle).

export function RepeatableRows<R>({
  rows,
  columns,
  onChange,
  newRow,
  addLabel = "Add row",
  reorder = true,
  emptyMessage = "No rows yet.",
}: RepeatableRowsProps<R>) {
  const setCell = (rowIndex: number, key: string, value: unknown) => {
    const next = rows.map((r, i) =>
      i === rowIndex ? ({ ...r, [key]: value } as R) : r,
    );
    onChange(next);
  };

  const removeRow = (rowIndex: number) => {
    onChange(rows.filter((_, i) => i !== rowIndex));
  };

  const move = (rowIndex: number, dir: -1 | 1) => {
    const target = rowIndex + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[rowIndex], next[target]] = [next[target], next[rowIndex]];
    onChange(next);
  };

  const addRow = () => onChange([...rows, newRow()]);

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      {rows.length > 0 && (
        <div
          className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: "#AAA39E" }}
        >
          {columns.map((c) => (
            <div key={c.key} className={cn(c.width ?? "flex-1")}>
              {c.label}
            </div>
          ))}
          {/* spacer for the per-row controls */}
          <div className={reorder ? "w-20" : "w-8"} />
        </div>
      )}

      {/* Rows */}
      {rows.length === 0 ? (
        <div
          className="rounded-lg border border-dashed px-3 py-4 text-center text-xs"
          style={{ borderColor: "#E8E4DE", color: "#AAA39E" }}
        >
          {emptyMessage}
        </div>
      ) : (
        rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
            style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}
          >
            {columns.map((c) => {
              const cellClass = cn(c.width ?? "flex-1");
              const value = row[c.key];
              if (c.type === "toggle") {
                return (
                  <div key={c.key} className={cn(cellClass, "flex items-center")}>
                    <Toggle
                      checked={Boolean(value)}
                      onChange={(v) => setCell(rowIndex, c.key, v)}
                    />
                  </div>
                );
              }
              if (c.type === "select") {
                return (
                  <div key={c.key} className={cellClass}>
                    <Select
                      options={c.options ?? []}
                      value={value as string | number}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const opt = (c.options ?? []).find(
                          (o) => String(o.value) === raw,
                        );
                        setCell(rowIndex, c.key, opt ? opt.value : raw);
                      }}
                    />
                  </div>
                );
              }
              return (
                <div key={c.key} className={cellClass}>
                  <TextInput
                    type={c.type === "number" ? "number" : "text"}
                    step={c.step}
                    placeholder={c.placeholder}
                    value={value === undefined || value === null ? "" : String(value)}
                    onChange={(e) =>
                      setCell(
                        rowIndex,
                        c.key,
                        c.type === "number"
                          ? e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                </div>
              );
            })}

            {/* Per-row controls */}
            <div className="flex items-center justify-end gap-0.5">
              {reorder && (
                <>
                  <button
                    type="button"
                    onClick={() => move(rowIndex, -1)}
                    disabled={rowIndex === 0}
                    className="rounded p-1 disabled:opacity-30 hover:bg-stone-200"
                    style={{ color: "#847D77" }}
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(rowIndex, 1)}
                    disabled={rowIndex === rows.length - 1}
                    className="rounded p-1 disabled:opacity-30 hover:bg-stone-200"
                    style={{ color: "#847D77" }}
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => removeRow(rowIndex)}
                className="rounded p-1 hover:bg-red-50"
                style={{ color: "#C0564A" }}
                aria-label="Remove row"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Add */}
      <button
        type="button"
        onClick={addRow}
        className="mt-1 inline-flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-stone-50"
        style={{ borderColor: "#E8E4DE", color: "#A86120" }}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );
}
