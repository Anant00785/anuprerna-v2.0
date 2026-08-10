'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { TableExplorerService, TableSummary } from '@/services/table-explorer-service';
import { Table, Search, RefreshCw } from 'lucide-react';

export default function TableExplorerPage() {
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const data = await TableExplorerService.getTables();
      setTables(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const filteredTables = tables.filter(
    (t) =>
      t.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeading heading="Database Table Explorer" />

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl shadow-2xs border border-slate-200 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search database tables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400"
        />
        <button
          onClick={fetchTables}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Table Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Row Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTables.map((t) => (
                <tr key={t.tableName} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600 flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{t.tableName}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{t.description}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {t.rowCount.toLocaleString()} rows
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/table-explorer/${t.tableName}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                    >
                      Explore Table Data
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTables.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            {loading ? 'Loading database tables...' : 'No matching tables found.'}
          </div>
        )}
      </div>
    </div>
  );
}
