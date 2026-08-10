'use client';

import React, { useState } from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  REPORT_OPTIONS,
  IReportOption,
  IReportConfig,
  ReportService,
} from '@/services/report-service';
import { Download, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';

export default function ReportCenterPage() {
  const [selectedReport, setSelectedReport] = useState<IReportOption | null>(null);
  const [config, setConfig] = useState<IReportConfig>({
    includeDisabled: false,
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = REPORT_OPTIONS.find((r) => r.id === e.target.value);
    setSelectedReport(found || null);
    setErrorMessage(null);
  };

  const handleDownload = async () => {
    if (!selectedReport || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await ReportService.downloadReport(
        selectedReport.id,
        config,
        selectedReport.reportName
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Download failed! Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeading heading="Report Center" />

      {errorMessage && (
        <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Report Selector Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xs border border-slate-200 p-6 md:p-8 space-y-6">
        {/* Select Report Type */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-800">Select Report Type</label>
          <div className="relative">
            <select
              value={selectedReport?.id || ''}
              onChange={handleReportChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer pr-10"
            >
              <option value="" disabled>
                Choose a report...
              </option>
              {REPORT_OPTIONS.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 absolute right-3.5 top-3.5 pointer-events-none text-slate-400" />
          </div>
          {selectedReport && (
            <p className="text-sm text-slate-600 pt-1 leading-relaxed">
              {selectedReport.description}
            </p>
          )}
        </div>

        {/* Configuration & Action */}
        {selectedReport && (
          <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
            {/* Configuration Box */}
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Report Configuration
              </h4>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={config.includeDisabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, includeDisabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Include disabled products
                </span>
              </label>
            </div>

            {/* Submit / Download Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isProcessing ? 'Preparing Report Data...' : 'Download'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
