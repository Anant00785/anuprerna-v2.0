"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Table2, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { formatCount } from "@/lib/utils";
import type { TableSummary } from "@/lib/admin-api";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const PAGE_SIZE = 50;

interface TableExplorerClientProps {
  tables: TableSummary[];
}

export function TableExplorerClient({ tables }: TableExplorerClientProps) {
  const [tableSearch, setTableSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [dataPage, setDataPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tables;
    const q = tableSearch.toLowerCase();
    return tables.filter((t) => t.tableName.toLowerCase().includes(q));
  }, [tables, tableSearch]);

  const fetchTableData = useCallback(async (tableName: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/table-explorer?table=${encodeURIComponent(tableName)}&page=${page}&size=${PAGE_SIZE}`);
      const json = await res.json() as { rows?: Record<string, unknown>[]; total?: number; error?: string };
      if (json.error) { setError(json.error); setTableData([]); }
      else { setTableData(json.rows ?? []); setTotalRows(json.total ?? 0); }
    } catch (e) {
      setError(String(e));
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectTable = (name: string) => {
    setSelectedTable(name);
    setDataPage(0);
    setSelectedRow(null);
    fetchTableData(name, 0);
  };

  const goToPage = (p: number) => {
    setDataPage(p);
    if (selectedTable) fetchTableData(selectedTable, p);
  };

  const selectedTableMeta = tables.find((t) => t.tableName === selectedTable);
  const totalDataPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Operations</span><span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Table Explorer</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Table Explorer</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>{formatCount(tables.length)} tables · click to browse rows</p>
          </div>
          <Table2 className="h-6 w-6" style={{ color: "#A86120" }} />
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left panel */}
          <div className="flex flex-col rounded-lg border overflow-hidden flex-shrink-0"
            style={{ borderColor: "#E8E4DE", width: "280px" }}>
            <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#E8E4DE" }}>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: "#E8E4DE" }}>
                <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#AAA39E" }} />
                <input type="text" placeholder="Search tables…" className="flex-1 text-xs outline-none bg-transparent"
                  style={{ color: "#1A1714" }} value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {filteredTables.map((t) => (
                <button key={t.tableName} type="button" onClick={() => selectTable(t.tableName)}
                  className="w-full flex flex-col items-start px-3 py-2 text-left border-b transition-colors hover:bg-stone-50"
                  style={{ borderColor: "#F3F1ED", background: selectedTable === t.tableName ? "#FEF3E2" : undefined }}
                >
                  <span className="text-xs font-medium" style={{ color: selectedTable === t.tableName ? "#A86120" : "#1A1714" }}>
                    {t.tableName}
                  </span>
                  <span className="text-[10px]" style={{ color: "#AAA39E" }}>
                    {formatCount(t.approximateRowCount)} rows · {formatBytes(t.sizeBytes)} · {t.columnCount} cols
                  </span>
                </button>
              ))}
              {filteredTables.length === 0 && (
                <div className="p-4 text-xs text-center" style={{ color: "#AAA39E" }}>No tables match</div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col rounded-lg border overflow-hidden" style={{ borderColor: "#E8E4DE" }}>
            {!selectedTable ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Table2 className="h-10 w-10 mx-auto mb-3" style={{ color: "#D1CCC6" }} />
                  <p className="text-sm" style={{ color: "#847D77" }}>Select a table to browse rows</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
                  style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}>
                  <div>
                    <span className="font-semibold text-sm" style={{ color: "#1A1714" }}>{selectedTable}</span>
                    {selectedTableMeta && (
                      <span className="ml-2 text-xs" style={{ color: "#847D77" }}>
                        ~{formatCount(selectedTableMeta.approximateRowCount)} rows · {selectedTableMeta.columnCount} cols
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#847D77" }}>Page {dataPage + 1} / {totalDataPages}</span>
                    <button type="button" disabled={dataPage === 0 || loading} onClick={() => goToPage(dataPage - 1)}
                      className="rounded p-1 hover:bg-stone-100 disabled:opacity-40" style={{ color: "#635D58" }}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={dataPage >= totalDataPages - 1 || loading} onClick={() => goToPage(dataPage + 1)}
                      className="rounded p-1 hover:bg-stone-100 disabled:opacity-40" style={{ color: "#635D58" }}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {loading && (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-sm" style={{ color: "#847D77" }}>Loading…</span>
                    </div>
                  )}
                  {!loading && error && (
                    <div className="p-4 text-sm" style={{ color: "#DC2626" }}>Error: {error}</div>
                  )}
                  {!loading && !error && tableData.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm" style={{ color: "#847D77" }}>No rows found.</p>
                    </div>
                  )}
                  {!loading && !error && tableData.length > 0 && (
                    <table className="w-full text-xs">
                      <tbody>
                        {tableData.map((row, ri) => (
                          <tr key={ri} className="cursor-pointer hover:bg-amber-50"
                            style={{ background: ri % 2 === 0 ? "#FFFFFF" : "#FAF9F7" }}
                            onClick={() => setSelectedRow(row)}
                          >
                            {Object.entries(row).map(([k, v]) => (
                              <td key={k} className="px-3 py-1.5 border-r border-b align-top"
                                style={{ borderColor: "#F3F1ED" }}>
                                <div className="font-medium text-[10px] mb-0.5" style={{ color: "#AAA39E" }}>{k}</div>
                                <div className="max-w-[180px] truncate" style={{ color: "#1A1714" }}
                                  title={v != null ? String(v) : ""}>
                                  {v == null ? <span style={{ color: "#D1CCC6" }}>null</span> : String(v)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedRow && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedRow(null)} />
          <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
              <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>Row Detail</h3>
              <button onClick={() => setSelectedRow(null)} className="rounded p-1 hover:bg-stone-100" style={{ color: "#847D77" }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-[11px] leading-relaxed overflow-auto rounded-lg border p-3"
                style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#3A352F" }}>
                {JSON.stringify(selectedRow, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </WeaveShell>
  );
}
