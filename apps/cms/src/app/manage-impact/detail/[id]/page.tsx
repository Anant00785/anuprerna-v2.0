'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { OrderImpactDashboard } from '@/components/manage-impact/OrderImpactDashboard';
import { ChevronLeft } from 'lucide-react';

export default function RegularOrderImpactDetailPage() {
  const params = useParams();
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
  const orderId = parseInt(idStr || '0', 10);

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <div>
        <Link
          href="/manage-impact"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Impact Factor</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          ORDER IMPACT
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
          Order #{orderId}
        </h1>
      </div>

      {/* Dashboard */}
      <OrderImpactDashboard orderId={orderId} custom={false} />
    </div>
  );
}
