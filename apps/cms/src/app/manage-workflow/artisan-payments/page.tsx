'use client';

import React from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import { CreditCard, DollarSign } from 'lucide-react';

export default function ArtisanPaymentsPage() {
  const payments = [
    { id: 'PAY-8801', artisan: 'Biren Das', craft: 'Kala Cotton Weaving', workUnits: '120 meters', amount: '₹18,000', status: 'Paid', date: '2026-08-01' },
    { id: 'PAY-8802', artisan: 'Parul Begum', craft: 'Jamdani Motif', workUnits: '45 meters', amount: '₹14,500', status: 'Pending', date: '2026-08-04' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeading heading="Artisan Payments & Wages Dashboard" />
        <button className="wv-btn flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span>Disburse Batch Payment</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Ref ID</th>
              <th className="px-6 py-4">Artisan Name</th>
              <th className="px-6 py-4">Craft Type</th>
              <th className="px-6 py-4">Work Delivered</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Payment Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.id}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{p.artisan}</td>
                <td className="px-6 py-4 text-slate-600">{p.craft}</td>
                <td className="px-6 py-4 text-slate-700">{p.workUnits}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{p.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="btn-transparent flex items-center gap-1 ml-auto">
                    <DollarSign className="w-3.5 h-3.5" /> Pay Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
