'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  User,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Tag,
  CreditCard,
} from 'lucide-react';
import { FeedbackService, OrderFeedback } from '@/services/feedback-service';

export default function ViewOrderFeedbackPage() {
  const params = useParams();
  const feedbackId = Number(params?.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<OrderFeedback | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (feedbackId) {
      loadFeedbackDetails(feedbackId);
    }
  }, [feedbackId]);

  const loadFeedbackDetails = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await FeedbackService.getOrderFeedbackById(id);
      if (data && data.order) {
        setFeedback(data);
      } else {
        setError('Feedback record not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch feedback details.');
    } finally {
      setLoading(false);
    }
  };

  const getSentiment = (score: number) => {
    if (score >= 9) return { key: 'promoter', label: 'Promoter', emoji: '😍', bg: 'bg-emerald-600 text-white' };
    if (score >= 7) return { key: 'passive', label: 'Passive', emoji: '🙂', bg: 'bg-amber-500 text-white' };
    return { key: 'detractor', label: 'Detractor', emoji: '😞', bg: 'bg-rose-600 text-white' };
  };

  const getInitials = (name?: string) => {
    if (!name) return '🙂';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '🙂';
    const first = parts[0].charAt(0);
    const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + second).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-4xl bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading feedback details...</p>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
          {error || 'Feedback details not found.'}
        </div>
        <Link
          href="/manage-feedback"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feedback List</span>
        </Link>
      </div>
    );
  }

  const score = feedback.question1Answer || 0;
  const sentiment = getSentiment(score);
  const markerPercent = score < 1 ? 0 : ((score - 1) / 9) * 100;
  const order = feedback.order;

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/manage-feedback"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feedbacks</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">Feedback Record #{feedback.id}</span>
      </div>

      {/* Hero Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline">
            <span className="text-5xl font-black">{score}</span>
            <span className="text-slate-400 text-base font-semibold">/10</span>
          </div>
          <div className="space-y-1">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${sentiment.bg}`}>
              {sentiment.emoji} {sentiment.label}
            </span>
            <h2 className="font-bold text-lg text-white">{order?.tenant?.name || 'Customer Feedback'}</h2>
            <p className="text-xs text-slate-400 font-mono">
              Order #{order?.id} ·{' '}
              {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString('en-GB') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Questions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question 1: Satisfaction score meter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Question 1 — Recommendation Score
            </h3>
            <p className="text-sm font-bold text-slate-900 leading-snug">
              {feedback.question1 || 'On a scale of 1-10, how likely are you to recommend us to a friend or colleague?'}
            </p>

            <div className="space-y-2 pt-2">
              <div className="relative w-full h-4 bg-slate-100 rounded-full">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-slate-900 rounded-full transition-all"
                  style={{ width: `${(score / 10) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-slate-900 border-2 border-white rounded-full flex items-center justify-center text-2xs font-extrabold text-white shadow-md"
                  style={{ left: `${Math.max(5, Math.min(95, (score / 10) * 100))}%` }}
                >
                  {score}
                </div>
              </div>
              <div className="flex justify-between text-2xs font-semibold text-slate-400 pt-1">
                <span>😞 Least satisfied (1)</span>
                <span>Most satisfied (10) 😍</span>
              </div>
            </div>
          </div>

          {/* Question 2: Found it? */}
          {feedback.question2 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question 2 — Product Finding
              </h3>
              <p className="text-sm font-bold text-slate-900 leading-snug">{feedback.question2}</p>
              <div>
                {feedback.question2Answer ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" /> Yes, found what I needed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <XCircle className="w-4 h-4" /> No, couldn&apos;t find item
                  </span>
                )}
              </div>

              {!feedback.question2Answer && feedback.question2NegativeAnswer && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{feedback.question2Negative || 'What were you looking for?'}</span>
                  </p>
                  <p className="text-xs text-amber-800 italic leading-relaxed pl-5">
                    &quot;{feedback.question2NegativeAnswer}&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Question 3: Open Feedback */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Question 3 — Open Comments
            </h3>
            <p className="text-sm font-bold text-slate-900 leading-snug">
              {feedback.question3 || 'Any other feedback or suggestions for us?'}
            </p>
            {feedback.question3Answer ? (
              <blockquote className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 italic leading-relaxed font-medium">
                &quot;{feedback.question3Answer}&quot;
              </blockquote>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                💭 No written comment left.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Customer & Order Breakdown */}
        <div className="space-y-6">
          {/* Customer Pane */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Customer Information
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base border border-indigo-100">
                {getInitials(order?.tenant?.name)}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{order?.tenant?.name || 'Customer'}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {order?.tenant?.id || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{order?.tenant?.email || 'N/A'}</span>
              </div>
              {order?.tenant?.contactNumber && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{order.tenant.contactNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Financial Pane */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                <span>Order #{order?.id}</span>
              </h3>
              <span className="text-xs font-bold text-slate-900">
                ₹{(order?.total || order?.totalPrice || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">
                  ₹{(order?.subTotal || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Cost</span>
                <span className="font-semibold text-slate-800">
                  ₹{(order?.shippingCost || 0).toLocaleString('en-IN')}
                </span>
              </div>
              {order?.couponApplied && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Coupon ({order.couponCode})</span>
                  </span>
                  <span>−₹{(order.couponDiscountAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-2xs">
              {order?.paymentMode && (
                <span className="px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> {order.paymentMode}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-500">
                {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href={`/logistic/order/${order?.id}`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
              >
                <span>View Full Order Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
