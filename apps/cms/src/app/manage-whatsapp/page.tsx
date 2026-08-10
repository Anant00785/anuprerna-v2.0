'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Receipt, ArrowRight } from 'lucide-react';

export default function ManageWhatsappPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">💬</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WhatsApp Business Integration</h1>
          <p className="text-sm text-slate-500 font-normal">
            Manage customer notification preferences, opt-in consents &amp; outbound message audit logs
          </p>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/manage-whatsapp/consent-manager"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Consent Manager
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage opt-in consent statuses, customer notification channels (Order Updates, Production BTS, Marketing), and consent expiry dates.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Open Consent Directory</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/manage-whatsapp/audit_log"
          className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Audit Log &amp; Delivery Monitor
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Inspect outbound HSM template notifications, delivery receipts (Sent, Delivered, Read), Freshchat delivery polling, and payload payloads.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Inspect Message Audit Logs</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
