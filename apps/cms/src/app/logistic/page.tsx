'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Package, Truck, Tag, DollarSign, ArrowRight, Plus } from 'lucide-react';

export default function LogisticsHQPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-100 rounded-2xl text-2xl">🚚</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Logistics HQ</h1>
          <p className="text-xs text-slate-500 font-normal">
            Orders, shipping, discounts & forex — all in one place ✨
          </p>
        </div>
      </div>

      {/* Grid of 5 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Manage Order Card */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 group hover:border-slate-300 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-800 flex items-center justify-center text-2xl shadow-sm border border-slate-100">
              🛒
            </div>
            <h2 className="text-lg font-bold text-slate-900">Manage Order</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Track and fulfil customer orders across every workflow stage.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-start">
            <Link
              href="/logistic/order"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              <span>Open Orders</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Manage Custom Order Card */}
        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between space-y-6 group hover:border-emerald-200 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center text-2xl shadow-sm border border-slate-100">
              🧵
            </div>
            <h2 className="text-lg font-bold text-slate-900">Manage Custom Order</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Bespoke fabric & finished-product orders with custom pricing and per-item workflows.
            </p>
          </div>

          <div className="pt-4 border-t border-emerald-100 flex items-center justify-between gap-3">
            <Link
              href="/logistic/custom-order"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-bold text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Order</span>
            </Link>
            <Link
              href="/logistic/custom-order"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-emerald-700 transition-colors"
            >
              <span>Open Custom Orders</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Manage Shipping Card */}
        <div className="bg-indigo-50/40 p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between space-y-6 group hover:border-indigo-200 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-indigo-800 flex items-center justify-center text-2xl shadow-sm border border-slate-100">
              🚚
            </div>
            <h2 className="text-lg font-bold text-slate-900">Manage Shipping</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Set up shipping methods, zones and delivery charges.
            </p>
          </div>

          <div className="pt-4 border-t border-indigo-100 flex items-center justify-between gap-3">
            <Link
              href="/logistic/shipping"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-bold text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Shipping</span>
            </Link>
            <Link
              href="/logistic/shipping"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-indigo-700 transition-colors"
            >
              <span>Open Shipping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Manage Discount Card */}
        <div className="bg-amber-50/40 p-6 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between space-y-6 group hover:border-amber-200 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-amber-800 flex items-center justify-center text-2xl shadow-sm border border-slate-100">
              🏷️
            </div>
            <h2 className="text-lg font-bold text-slate-900">Manage Discount</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Create promo codes and discounts for the storefront.
            </p>
          </div>

          <div className="pt-4 border-t border-amber-100 flex items-center justify-between gap-3">
            <Link
              href="/logistic/discount"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-bold text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Discount</span>
            </Link>
            <Link
              href="/logistic/discount"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-amber-700 transition-colors"
            >
              <span>Open Discounts</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Manage Forex Card */}
        <div className="bg-rose-50/30 p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-between space-y-6 group hover:border-rose-200 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-rose-800 flex items-center justify-center text-2xl shadow-sm border border-slate-100">
              💱
            </div>
            <h2 className="text-lg font-bold text-slate-900">Manage Forex</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Manage currency exchange rates for international pricing.
            </p>
          </div>

          <div className="pt-4 border-t border-rose-100 flex items-center justify-between gap-3">
            <Link
              href="/logistic/forex"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-bold text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rate</span>
            </Link>
            <Link
              href="/logistic/forex"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-rose-700 transition-colors"
            >
              <span>Open Forex</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
