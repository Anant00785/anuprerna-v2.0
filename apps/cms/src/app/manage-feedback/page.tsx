'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Loader2,
  ExternalLink,
  X,
  Star,
  User,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { FeedbackService, OrderFeedback } from '@/services/feedback-service';

export default function ManageFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'WITH_COMMENT' | 'WITH_RATING' | 'INCOMPLETE' | 'NO_RATING'>('WITH_COMMENT');
  const [searchQuery, setSearchQuery] = useState('');

  // Feedbacks state
  const [feedbacksWithComment, setFeedbacksWithComment] = useState<OrderFeedback[]>([]);
  const [feedbacksWithRating, setFeedbacksWithRating] = useState<OrderFeedback[]>([]);
  const [feedbacksIncomplete, setFeedbacksIncomplete] = useState<OrderFeedback[]>([]);
  const [feedbacksNoRating, setFeedbacksNoRating] = useState<OrderFeedback[]>([]);

  // Drawer State
  const [selectedFeedback, setSelectedFeedback] = useState<OrderFeedback | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await FeedbackService.getOrderFeedbackList();
      const sorted = [...data].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

      const unrated: OrderFeedback[] = [];
      const withComment: OrderFeedback[] = [];
      const withRating: OrderFeedback[] = [];
      const incomplete: OrderFeedback[] = [];

      sorted.forEach((fb) => {
        if (!(fb.question1Answer && fb.question1Answer > 0)) {
          unrated.push(fb);
        } else if (fb.question3Answer && fb.question3Answer.trim().length > 0) {
          withComment.push(fb);
        } else if (fb.question1Answer > 0 && fb.question2) {
          withRating.push(fb);
        } else {
          incomplete.push(fb);
        }
      });

      setFeedbacksWithComment(withComment);
      setFeedbacksWithRating(withRating);
      setFeedbacksIncomplete(incomplete);
      setFeedbacksNoRating(unrated);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer order feedback from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const getActiveList = (): OrderFeedback[] => {
    switch (activeTab) {
      case 'WITH_COMMENT':
        return feedbacksWithComment;
      case 'WITH_RATING':
        return feedbacksWithRating;
      case 'INCOMPLETE':
        return feedbacksIncomplete;
      case 'NO_RATING':
        return feedbacksNoRating;
      default:
        return feedbacksWithComment;
    }
  };

  const filteredList = getActiveList().filter((fb) => {
    const term = searchQuery.toLowerCase();
    const name = (fb.order?.tenant?.name || '').toLowerCase();
    const email = (fb.order?.tenant?.email || '').toLowerCase();
    const orderId = String(fb.order?.id || fb.order?.serialNo || '');
    return name.includes(term) || email.includes(term) || orderId.includes(term);
  });

  const getRatingBadge = (rating?: number) => {
    if (!rating || rating <= 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-500">
          No rating
        </span>
      );
    }
    if (rating <= 6) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
          {rating}<span className="text-2xs font-normal opacity-70">/10</span>
        </span>
      );
    }
    if (rating <= 8) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800">
          {rating}<span className="text-2xs font-normal opacity-70">/10</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
        {rating}<span className="text-2xs font-normal opacity-70">/10</span>
      </span>
    );
  };

  const getSnippet = (text?: string) => {
    if (!text) return '—';
    return text.length > 65 ? `${text.slice(0, 65)}…` : text;
  };

  const getNpsCategory = (score?: number) => {
    if (!score || score <= 0) return { label: 'Unrated', emoji: '💬', color: 'bg-slate-100 text-slate-700' };
    if (score >= 9) return { label: 'Promoter', emoji: '😍', color: 'bg-emerald-100 text-emerald-800' };
    if (score >= 7) return { label: 'Passive', emoji: '🙂', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Detractor', emoji: '😞', color: 'bg-rose-100 text-rose-800' };
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-2xl">💬</div>
          <div>
            <PageHeading heading="Order Feedback" />
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              How customers rated their order experience ✨
            </p>
          </div>
        </div>

        <button
          onClick={fetchFeedbacks}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('WITH_COMMENT')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'WITH_COMMENT'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>💬</span>
          <span>Complete with Feedback ({feedbacksWithComment.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('WITH_RATING')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'WITH_RATING'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>⭐</span>
          <span>Complete with Rating ({feedbacksWithRating.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('INCOMPLETE')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'INCOMPLETE'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>🕒</span>
          <span>Incomplete ({feedbacksIncomplete.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('NO_RATING')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'NO_RATING'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>🏴‍☠️</span>
          <span>No Rating ({feedbacksNoRating.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 pr-2">
          Showing: {filteredList.length}
        </span>
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
          <p className="text-sm text-slate-500 font-medium">Loading customer ratings & feedbacks...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">⭐ RATING</th>
                  <th className="px-6 py-4">👤 CUSTOMER</th>
                  <th className="px-6 py-4">🧾 ORDER #</th>
                  <th className="px-6 py-4">👍 FOUND IT?</th>
                  <th className="px-6 py-4">💬 COMMENT</th>
                  <th className="px-6 py-4">📅 DATE</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">💬</span>
                        <p className="text-xs font-medium">No feedback entries found in this category.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((fb) => (
                    <tr
                      key={fb.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedFeedback(fb);
                        setDrawerOpen(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        {getRatingBadge(fb.question1Answer)}
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {fb.order?.tenant?.name || 'Customer'}
                          </p>
                          <p className="text-xs font-mono text-slate-400">
                            {fb.order?.tenant?.email || 'N/A'}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">
                        #{fb.order?.id || fb.order?.serialNo || 'N/A'}
                      </td>

                      <td className="px-6 py-4">
                        {fb.question2 ? (
                          <div className="flex items-center gap-1.5">
                            {fb.question2Answer ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                👍 Yes
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                👎 No
                              </span>
                            )}
                            {!fb.question2Answer && fb.question2NegativeAnswer && (
                              <span title="Left negative details" className="text-amber-500 text-xs">
                                ⚠️
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-700 font-medium">
                        {fb.question3Answer ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-400">💬</span>
                            <span>{getSnippet(fb.question3Answer)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {fb.updatedAt || fb.createdAt
                          ? new Date(fb.updatedAt || fb.createdAt || 0).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedFeedback(fb);
                              setDrawerOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-2xs"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
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
      {drawerOpen && selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Title & Close */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Feedback #{selectedFeedback.id}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/manage-feedback/view/${selectedFeedback.id}`}
                    target="_blank"
                    className="p-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1"
                  >
                    <span>Full Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Hero NPS Card */}
              {(() => {
                const nps = getNpsCategory(selectedFeedback.question1Answer);
                return (
                  <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold">{selectedFeedback.question1Answer || 0}</span>
                        <span className="text-slate-400 text-sm font-semibold">/10</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${nps.color}`}>
                        {nps.emoji} {nps.label}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-base">{selectedFeedback.order?.tenant?.name || 'Customer'}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        Order #{selectedFeedback.order?.id} ·{' '}
                        {selectedFeedback.createdAt
                          ? new Date(selectedFeedback.createdAt).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Question 1: Satisfaction score */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  {selectedFeedback.question1 || 'On a scale of 1-10, how likely are you to recommend us?'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full"
                      style={{ width: `${((selectedFeedback.question1Answer || 0) / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {selectedFeedback.question1Answer || 0}/10
                  </span>
                </div>
              </div>

              {/* Question 2: Did you find what you were looking for? */}
              {selectedFeedback.question2 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-700">{selectedFeedback.question2}</p>
                  <div>
                    {selectedFeedback.question2Answer ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </div>

                  {!selectedFeedback.question2Answer && selectedFeedback.question2NegativeAnswer && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                      <p className="font-semibold text-amber-900 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{selectedFeedback.question2Negative || 'What were you looking for?'}</span>
                      </p>
                      <p className="text-amber-800 italic">"{selectedFeedback.question2NegativeAnswer}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Question 3: Open Feedback */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  {selectedFeedback.question3 || 'Any other feedback or suggestions for us?'}
                </p>
                {selectedFeedback.question3Answer ? (
                  <blockquote className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 italic leading-relaxed shadow-2xs">
                    "{selectedFeedback.question3Answer}"
                  </blockquote>
                ) : (
                  <p className="text-xs text-slate-400 italic">💭 No written comment left.</p>
                )}
              </div>

              {/* Order Info Breakdown */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                    <span>Order #{selectedFeedback.order?.id}</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    ₹{selectedFeedback.order?.total || selectedFeedback.order?.totalPrice || 0}
                  </span>
                </div>

                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Customer Name:</span>
                    <span className="font-semibold text-slate-800">{selectedFeedback.order?.tenant?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Email:</span>
                    <span className="font-mono text-slate-800">{selectedFeedback.order?.tenant?.email || '—'}</span>
                  </div>
                  {selectedFeedback.order?.tenant?.contactNumber && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-mono text-slate-800">{selectedFeedback.order?.tenant?.contactNumber}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/logistic/order/${selectedFeedback.order?.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    <span>View Order Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-5 py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
