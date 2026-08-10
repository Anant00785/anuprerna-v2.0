'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Loader2, RefreshCw, Eye, Edit2, Ban, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { ProductService } from '@/services/product-service';

export default function FabricProductPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [disablingId, setDisablingId] = useState<number | null>(null);

  const fetchFabricProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ProductService.getFabricProducts();
      setFabrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch fabric products from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFabricProducts();
  }, []);

  const handleDisableToggle = async (id: number) => {
    setDisablingId(id);
    try {
      await ProductService.disableFabricProduct(id);
      fetchFabricProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle fabric status.');
    } finally {
      setDisablingId(null);
    }
  };

  // Metrics
  const statsTotal = fabrics.length;
  const statsActive = fabrics.filter(r => !r?.disabled && !r?.product?.disabled).length;
  const statsDisabled = fabrics.filter(r => !!r?.disabled || !!r?.product?.disabled).length;
  const statsOutOfStock = fabrics.filter(r => ((r?.total_quantity ?? r?.totalQuantity ?? r?.product?.totalQuantity ?? r?.quantity ?? 0) === 0)).length;

  const filteredFabrics = fabrics.filter(f => {
    const name = f.name || f.productName || f.title || f.product?.name || '';
    const sku = f.sku || f.product?.sku || f.id || '';
    const term = searchTerm.toLowerCase();
    return !searchTerm || name.toLowerCase().includes(term) || sku.toString().toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manage-product"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fabric Products</h1>
            <p className="text-xs text-slate-500">Manage handloom, organic cotton, silk, and blended fabric products</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFabricProducts}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Fabric Product</span>
          </button>
        </div>
      </div>

      {/* Summary Count Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{statsTotal}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL FABRICS</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{statsActive}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{statsDisabled}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DISABLED</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{statsOutOfStock}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OUT OF STOCK</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search fabric by name, composition or GSM..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading fabric products from live backend...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Fabric ID / SKU</th>
                <th className="px-6 py-3.5">Fabric Name</th>
                <th className="px-6 py-3.5">Weight / GSM</th>
                <th className="px-6 py-3.5">Width</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">MOQ</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFabrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No fabric products found.
                  </td>
                </tr>
              ) : (
                filteredFabrics.map((item, idx) => {
                  const f = item.product || item;
                  const isDisabled = !!f.disabled || !!item.disabled;
                  const idVal = f.id || item.id || idx + 1;
                  const skuVal = f.sku || item.sku || `FAB-${idVal}`;
                  const nameVal = f.name || f.productName || item.name || item.productName || 'Unnamed Fabric';
                  const gsmVal = f.gsm || item.gsm || f.weight || '110 GSM';
                  const widthVal = f.width || item.width || '44 in';
                  const priceVal = f.price || f.swatchPrice || item.price || item.swatchPrice || 'N/A';
                  const moqVal = f.moq || item.moq || '10m';

                  return (
                    <tr key={idVal} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{skuVal}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{nameVal}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{gsmVal}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{widthVal}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {typeof priceVal === 'number' ? `₹${priceVal}/m` : priceVal}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">{moqVal}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          !isDisabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {!isDisabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => alert(`View details for fabric ID #${idVal}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert(`Edit fabric ID #${idVal}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                            title="Edit Fabric"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDisableToggle(idVal)}
                            disabled={disablingId === idVal}
                            className={`p-1.5 rounded-lg ${
                              isDisabled
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isDisabled ? 'Enable Fabric' : 'Disable Fabric'}
                          >
                            {disablingId === idVal ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
