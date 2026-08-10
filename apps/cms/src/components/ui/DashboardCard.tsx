import React from 'react';
import Link from 'next/link';

interface DashboardCardProps {
  title: string;
  action: string;
  icon?: string;
  emoji?: string;
  subtitle?: string;
}

export function DashboardCard({ title, action, emoji = '📦', subtitle }: DashboardCardProps) {
  return (
    <Link href={action}>
      <div className="p-4 bg-white mb-6 w-full shadow hover:shadow-lg transition-shadow cursor-pointer rounded-lg border border-slate-100 flex items-center gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-tl from-[#46496E] to-[#7779A6] text-white text-2xl flex-shrink-0 shadow-sm">
          <span>{emoji}</span>
        </div>
        <div>
          <h5 className="mb-0 capitalize text-[1rem] font-semibold text-slate-800">{title}</h5>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Link>
  );
}
