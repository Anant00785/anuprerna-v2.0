'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  Star,
  Plus,
  ExternalLink,
  Edit2,
  XCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ReviewService, IReview } from '@/services/review-service';
import { ReviewModal } from '@/components/reviews/ReviewModal';

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REMOVED'>('PENDING');
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNo, setPageNo] = useState(0);
  const pageSize = 50;
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Review Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<IReview | null>(null);

  // Lightbox Modal State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fetchReviews = async (status: 'PENDING' | 'APPROVED' | 'REMOVED', page = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const data = await ReviewService.fetchReviewList(status, page, pageSize);
      setShowLoadMore(data.length === pageSize);
      if (append) {
        setReviews((prev) => [...prev, ...data]);
      } else {
        setReviews(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews from backend.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPageNo(0);
    fetchReviews(activeTab, 0, false);
  }, [activeTab]);

  const handleTabChange = (status: 'PENDING' | 'APPROVED' | 'REMOVED') => {
    if (activeTab === status) return;
    setActiveTab(status);
  };

  const handleLoadMore = () => {
    const nextPage = pageNo + 1;
    setPageNo(nextPage);
    fetchReviews(activeTab, nextPage, true);
  };

  const handleApprove = async (review: IReview) => {
    try {
      await ReviewService.updateReview({ ...review, status: 'APPROVED' });
      setToastMessage({ type: 'success', text: 'Review approved successfully' });
      fetchReviews(activeTab, 0, false);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to approve review' });
    }
  };

  const handleRemove = async (review: IReview) => {
    try {
      await ReviewService.updateReview({ ...review, status: 'REMOVED' });
      setToastMessage({ type: 'success', text: 'Review marked as removed' });
      fetchReviews(activeTab, 0, false);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to remove review' });
    }
  };

  const openEditModal = (review: IReview) => {
    setEditingReview(review);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingReview(null);
    setModalOpen(true);
  };

  const openLightbox = (imageStr?: string) => {
    if (!imageStr) return;
    const imgs = imageStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (imgs.length === 0) return;
    setLightboxImages(imgs);
    setLightboxIndex(0);
    setLightboxOpen(true);
  };

  const prepareProductUrl = (prod: any) => {
    if (!prod) return '#';
    const id = prod.id || 0;
    if (prod.productGroup === 'fabric' || prod.productGroup === 'swatch') {
      return `/manage-product/fabric-product`;
    }
    return `/manage-product/finished-product`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar with Add Review */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeading heading="Manage Product Reviews" />
          <p className="text-xs text-slate-500 font-normal mt-1">
            Approve customer reviews, inspect rating feedback, and post manual reviews ✨
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReviews(activeTab, 0, false)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </button>
        </div>
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

      {/* 3 Status Tabs */}
      <div className="flex items-center justify-center border-b border-slate-200 gap-8">
        {[
          { key: 'PENDING', label: 'Pending' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'REMOVED', label: 'Removed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key as any)}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === tab.key
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-200 text-center space-y-3">
          <span className="text-4xl">⭐</span>
          <h3 className="text-lg font-bold text-slate-800">No Reviews available!</h3>
          <p className="text-xs text-slate-400">There are no reviews under the {activeTab.toLowerCase()} status tab.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r, idx) => (
            <div key={r.id || idx} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              {/* Review Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{r.name}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900">{r.rating}.0</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            r.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <span className="text-xs text-slate-500 font-mono">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>

              <hr className="border-slate-100" />

              {/* Sub-Header Metadata Links */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-4">
                  {r.link && (
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                    >
                      <span>Review External Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {r.product && (
                    <Link
                      href={prepareProductUrl(r.product)}
                      target="_blank"
                      className="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-indigo-600 hover:underline"
                    >
                      <span>Product: {r.product.sku}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {r.orderId && (
                    <Link
                      href={`/logistic/order/${r.orderId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-indigo-600 hover:underline"
                    >
                      <span>Order: #{r.orderId}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                <span className="text-slate-500">
                  Location: {r.city ? `${r.city}, ` : ''}{r.country || 'N/A'}
                </span>
              </div>

              {/* Review Description */}
              <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1">
                {r.description || 'No description provided!'}
              </p>

              {/* Card Action Icons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                {r.productImages && r.productImages !== '' && (
                  <button
                    onClick={() => openLightbox(r.productImages)}
                    className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1 text-xs font-semibold"
                    title="View Media Photos"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <span>Photos</span>
                  </button>
                )}

                {r.adminAdded && (
                  <button
                    onClick={() => openEditModal(r)}
                    className="p-2 text-amber-600 hover:text-amber-700 rounded-xl hover:bg-amber-50 transition-all"
                    title="Edit Review"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                  <button
                    onClick={() => handleRemove(r)}
                    className="p-2 text-rose-600 hover:text-rose-700 rounded-xl hover:bg-rose-50 transition-all"
                    title="Remove Review"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}

                {(r.status === 'PENDING' || r.status === 'REMOVED') && (
                  <button
                    onClick={() => handleApprove(r)}
                    className="p-2 text-emerald-600 hover:text-emerald-700 rounded-xl hover:bg-emerald-50 transition-all"
                    title="Approve Review"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {showLoadMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Load More Reviews</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Review Modal */}
      <ReviewModal
        isOpen={modalOpen}
        initialData={editingReview}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchReviews(activeTab, 0, false)}
      />

      {/* Lightbox Photo Viewer Modal */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-3xl w-full flex items-center justify-center">
            {lightboxImages.length > 1 && (
              <button
                onClick={() =>
                  setLightboxIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1))
                }
                className="absolute left-2 p-2 text-white bg-slate-900/60 hover:bg-slate-900 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={lightboxImages[lightboxIndex]}
              alt=""
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />

            {lightboxImages.length > 1 && (
              <button
                onClick={() =>
                  setLightboxIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-2 p-2 text-white bg-slate-900/60 hover:bg-slate-900 rounded-full"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
