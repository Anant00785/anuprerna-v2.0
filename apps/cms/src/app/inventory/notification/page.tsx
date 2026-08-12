'use client';

import React, { useEffect, useState } from 'react';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  Bell,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Edit2,
  Trash2,
  X,
  Check,
  User,
  Package,
  Calendar,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { InventoryService, InventoryRestockRequest } from '@/services/inventory-service';

export default function StockNotificationPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<InventoryRestockRequest[]>([]);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter States
  const [searchEmail, setSearchEmail] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('');

  // Drawer Panel State
  const [selectedRequest, setSelectedRequest] = useState<InventoryRestockRequest | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Update Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [updatingRequest, setUpdatingRequest] = useState<InventoryRestockRequest | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [updating, setUpdating] = useState(false);

  // Delete Modal State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRestockRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await InventoryService.getRestockRequests();
      const sorted = [...data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRequests(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch restock requests from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestockRequests();
  }, []);

  // Filter Logic
  const filteredRequests = requests.filter((r) => {
    const emailStr = (r.tenant?.decryptedEmail || r.tenant?.email || '').toLowerCase();
    const prodNameStr = (r.product?.name || '').toLowerCase();
    const prodSkuStr = (r.product?.sku || '').toLowerCase();

    const emailMatch = !searchEmail || emailStr.includes(searchEmail.toLowerCase());
    const prodMatch =
      !searchProduct ||
      prodNameStr.includes(searchProduct.toLowerCase()) ||
      prodSkuStr.includes(searchProduct.toLowerCase());
    const statusMatch = !activeStatus || r.status === activeStatus;

    return emailMatch && prodMatch && statusMatch;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const notifiedCount = requests.filter((r) => r.status === 'NOTIFIED').length;

  const openStatusModal = (req: InventoryRestockRequest) => {
    setUpdatingRequest(req);
    setSelectedStatus(req.status || 'PENDING');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!updatingRequest) return;
    setUpdating(true);
    try {
      await InventoryService.updateRestockRequestStatus({
        id: updatingRequest.id,
        productId: updatingRequest.product?.id || 0,
        status: selectedStatus,
      });
      setToastMessage({ type: 'success', text: 'Request status updated successfully' });
      setStatusModalOpen(false);
      fetchRestockRequests();
      if (selectedRequest?.id === updatingRequest.id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: selectedStatus } : null));
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to update request status' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await InventoryService.deleteRestockRequest(deletingId);
      setToastMessage({ type: 'success', text: 'Restock request deleted' });
      setDeletingId(null);
      if (selectedRequest?.id === deletingId) {
        setPanelOpen(false);
        setSelectedRequest(null);
      }
      fetchRestockRequests();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete restock request' });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'NOTIFIED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'FULFILLED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeading heading="Stock Alerts & Restock Requests" />
          <p className="text-xs text-slate-500 font-normal mt-1">
            Customer out-of-stock &quot;notify me&quot; requests & inventory alert notifications 🔔
          </p>
        </div>

        <button
          onClick={fetchRestockRequests}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-slate-200/50 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveStatus('')}
          className={`px-4 py-2 rounded-2xl transition-all ${
            activeStatus === ''
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveStatus('PENDING')}
          className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
            activeStatus === 'PENDING'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <span>🕐</span> Pending ({pendingCount})
        </button>
        <button
          onClick={() => setActiveStatus('NOTIFIED')}
          className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
            activeStatus === 'NOTIFIED'
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
          }`}
        >
          <span>📬</span> Notified ({notifiedCount})
        </button>
        <button
          onClick={() => setActiveStatus('FULFILLED')}
          className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
            activeStatus === 'FULFILLED'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <span>✅</span> Fulfilled
        </button>
        <button
          onClick={() => setActiveStatus('CANCELLED')}
          className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
            activeStatus === 'CANCELLED'
              ? 'bg-rose-600 text-white font-bold shadow-sm'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <span>❌</span> Cancelled
        </button>
      </div>

      {/* Dual Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading restock requests...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">👤 CUSTOMER EMAIL</th>
                  <th className="px-6 py-4">📦 PRODUCT / SKU</th>
                  <th className="px-6 py-4 text-center">REQ. QTY</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4">📅 REQUEST DATE</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No restock requests found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedRequest(req);
                        setPanelOpen(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {req.tenant?.decryptedEmail || req.tenant?.email || 'Anonymous Customer'}
                            </p>
                            {(req.tenant?.decryptedFirstName || req.tenant?.firstName) && (
                              <p className="text-2xs text-slate-400 font-normal">
                                {req.tenant?.decryptedFirstName || req.tenant?.firstName}{' '}
                                {req.tenant?.decryptedLastName || req.tenant?.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {req.product?.heroImage ? (
                            <img
                              src={req.product.heroImage}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-2xs">
                              PROD
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {req.product?.name || 'Unknown Product'}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {req.product?.sku || `Group: ${req.productGroup || 'N/A'}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {req.requestedQuantity || 1} units
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openStatusModal(req)}
                            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
                            title="Update Status"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(req.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Detail Drawer */}
      {panelOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-base">Restock Request Details</h3>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Customer Profile</span>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>
                      {selectedRequest.tenant?.decryptedFirstName || selectedRequest.tenant?.firstName || 'Customer'}{' '}
                      {selectedRequest.tenant?.decryptedLastName || selectedRequest.tenant?.lastName || ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedRequest.tenant?.decryptedEmail || selectedRequest.tenant?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Requested Item</span>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedRequest.product?.heroImage && (
                      <img
                        src={selectedRequest.product.heroImage}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                    )}
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedRequest.product?.name}</p>
                      <p className="text-xs font-mono text-slate-500">SKU: {selectedRequest.product?.sku}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                    <span className="text-slate-500">Requested Quantity:</span>
                    <span className="font-bold text-slate-900">{selectedRequest.requestedQuantity || 1} units</span>
                  </div>

                  {selectedRequest.productGroup && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Product Group:</span>
                      <span className="font-semibold text-slate-700">{selectedRequest.productGroup}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Timeline Log</span>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Request Date:</span>
                    <span className="font-mono text-slate-800">
                      {selectedRequest.createdAt
                        ? new Date(selectedRequest.createdAt).toLocaleString('en-GB')
                        : 'N/A'}
                    </span>
                  </div>
                  {selectedRequest.notifiedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Notified Date:</span>
                      <span className="font-mono text-slate-800">
                        {new Date(selectedRequest.notifiedAt).toLocaleString('en-GB')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setDeletingId(selectedRequest.id)}
                className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
              >
                Delete Request
              </button>
              <button
                onClick={() => openStatusModal(selectedRequest)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalOpen && updatingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Update Restock Status</h3>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Change status for {updatingRequest.product?.name} ({updatingRequest.product?.sku})
            </p>

            <div className="space-y-2">
              {[
                { value: 'PENDING', label: 'Pending', emoji: '🕐', desc: 'Awaiting stock replenishment', color: 'border-amber-200 bg-amber-50/50' },
                { value: 'NOTIFIED', label: 'Notified', emoji: '📬', desc: 'Customer email alert sent', color: 'border-blue-200 bg-blue-50/50' },
                { value: 'FULFILLED', label: 'Fulfilled', emoji: '✅', desc: 'Stock restored & order fulfilled', color: 'border-emerald-200 bg-emerald-50/50' },
                { value: 'CANCELLED', label: 'Cancelled', emoji: '❌', desc: 'Request dismissed or discontinued', color: 'border-rose-200 bg-rose-50/50' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedStatus === opt.value
                      ? 'border-slate-900 ring-2 ring-slate-900 bg-white font-bold'
                      : `${opt.color} hover:bg-white`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <p className="text-xs text-slate-900">{opt.label}</p>
                      <p className="text-2xs text-slate-500 font-normal">{opt.desc}</p>
                    </div>
                  </div>
                  {selectedStatus === opt.value && <Check className="w-4 h-4 text-slate-900" />}
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Restock Request</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this customer restock notification request? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
