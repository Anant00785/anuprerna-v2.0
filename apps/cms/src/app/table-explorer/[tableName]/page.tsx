'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeading } from '@/components/ui/PageHeading';
import { TableExplorerService, TableDataResponse } from '@/services/table-explorer-service';
import { ArrowLeft, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TableExplorerDataPage() {
  const params = useParams();
  const tableName = params?.tableName ? String(params.tableName) : '';

  const [data, setData] = useState<TableDataResponse | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchKey, setSearchKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTableData = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    try {
      const res = await TableExplorerService.getTableData(tableName, pageNumber, pageSize, searchKey);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [tableName, pageNumber, pageSize, searchKey]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  const totalPages = data ? Math.ceil(data.totalRows / pageSize) : 1;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/table-explorer"
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading={`Table Explorer: ${tableName}`} />
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl shadow-2xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={`Search records in ${tableName}...`}
            value={searchKey}
            onChange={(e) => {
              setSearchKey(e.target.value);
              setPageNumber(0);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-semibold">
            <span>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageNumber(0);
              }}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button
            onClick={fetchTableData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Data Viewer */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                {(data?.columns || []).map((col) => (
                  <th key={col} className="px-5 py-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(data?.rows || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  {(data?.columns || []).map((col) => {
                    const val = row[col];
                    const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '-');
                    return (
                      <td key={col} className="px-5 py-3 max-w-xs truncate text-slate-800">
                        {valStr}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing Page <strong>{pageNumber + 1}</strong> of <strong>{totalPages}</strong> (
            {data?.totalRows || 0} total rows)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
              disabled={pageNumber === 0}
              className="px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageNumber >= totalPages - 1}
              className="px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
