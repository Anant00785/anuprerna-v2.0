'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeading } from '@/components/ui/PageHeading';
import { ArrowLeft, Loader2, Package, CheckCircle2, Clock, Calendar, Mail, User } from 'lucide-react';
import { LogisticService, CustomerOrder } from '@/services/logistic-service';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id ? String(params.id) : '';

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    LogisticService.getOrderById(orderId)
      .then(data => setOrder(data))
      .catch(err => setError(err.message || 'Failed to load order details.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/logistic/order" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeading heading={`Order Details: #${order?.orderId || orderId}`} />
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading order overview & workflow progress...</p>
        </div>
      ) : (
        order && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
                  <p className="text-xs text-slate-500">Order #{order.orderId || order.id}</p>
                </div>
                <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-xl text-xs">
                  {order.status || 'AWAITING'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="block text-slate-400 font-bold uppercase text-[10px] mb-1">Total Order Value</span>
                  <span className="font-black text-slate-900 text-base">{order.formattedTotal || `INR ${order.totalAmount || order.totalPrice || 0}`}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="block text-slate-400 font-bold uppercase text-[10px] mb-1">Payment Status</span>
                  <span className="font-bold text-emerald-600 text-sm">{order.paymentStatus || 'PAID'}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-900 text-sm">Ordered Items ({order.itemsCount || 1})</h3>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-bold text-slate-900">Standard Production Batch</p>
                      <p className="text-slate-500 text-[11px]">{order.productType || 'Fabric'} • In-progress</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800">4 ready</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Customer Details</h2>
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Name</span>
                    <span className="font-bold text-slate-900">{order.buyerName || order.customerName || 'Niharika Vivek'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Email</span>
                    <span className="font-medium text-slate-700">{order.customerEmail || order.email || 'niharikavivek9009@gmail.com'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
