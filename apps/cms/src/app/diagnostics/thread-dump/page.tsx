'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft } from 'lucide-react';

export default function ThreadDumpDiagnosticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/diagnostics" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading="Thread Dump Inspector" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 font-mono text-xs text-slate-700 bg-slate-950 text-slate-200 overflow-x-auto">
        <p className="text-emerald-400 font-bold mb-2"># Active Worker Thread Stack Trace</p>
        <p>&quot;http-nio-8089-exec-1&quot; #42 daemon prio=5 os_prio=0 tid=0x00007f98140 RUNNABLE</p>
        <p className="pl-4">at java.net.SocketInputStream.socketRead0(Native Method)</p>
        <p className="pl-4">at com.anuprerna.weave.service.OrderService.processOrder(OrderService.java:142)</p>
      </div>
    </div>
  );
}
