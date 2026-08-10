'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft } from 'lucide-react';

export default function UserCartDetailsPage() {
  const params = useParams();
  const uid = params?.uid ? String(params.uid) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/user" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading={`Cart Details for User: ${uid}`} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Cart Contents & Breakdown</h3>
        <p className="text-sm text-slate-600">
          Displaying active items currently saved in user&apos;s cart.
        </p>
      </div>
    </div>
  );
}
