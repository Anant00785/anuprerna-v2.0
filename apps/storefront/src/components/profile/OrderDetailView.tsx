'use client';

import React, { useState } from 'react';
import { OrderDetails } from '@/types/domain/profile';

interface OrderDetailViewProps {
  order: OrderDetails;
  showHeader?: boolean;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ order, showHeader = true }) => {
  const [showOrderInfo, setShowOrderInfo] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const formatDate = (dateStr?: string | number) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setRatingModalOpen(false);
      setFeedbackSubmitted(false);
    }, 1500);
  };

  const inStockItems = order.items.filter((i) => i.orderCategory === 'IN_STOCK');
  const madeToOrderItems = order.items.filter((i) => i.orderCategory === 'MADE_TO_ORDER');
  const preOrderItems = order.items.filter((i) => i.orderCategory === 'PRE_ORDER');

  return (
    <div className="w-full space-y-6">
      {/* Page Title & Rate Experience Button */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
          <button
            onClick={() => setRatingModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#fffcf7] border-2 border-[#8E7862] text-[#8E7862] hover:border-[#6c5b48] hover:bg-[#8E7862]/10 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">star</span>
            Rate Order Experience
          </button>
        </div>
      )}

      {/* Summary Banner */}
      <div className="bg-[#FFFCF7] border border-amber-900/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
          <span>
            Ordered on <strong className="text-gray-900">{formatDate(order.createdAt)}</strong>
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>
            Order <strong className="text-gray-900">#{order.orderId}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">TOTAL:</span>
          <span className="text-lg font-bold text-gray-900">
            {order.currency} {order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Wholesale Program Banner if applicable */}
      {order.loyaltyOrder && (
        <div className="p-4 rounded-xl border-l-4 border-l-[#3a9173] bg-[#E8F0ED] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#3a9173] text-2xl font-bold">crown</span>
          <div>
            <p className="font-bold text-[#3a9173] text-base">Wholesale Program Order</p>
            {order.loyaltyDiscountAmount && (
              <p className="text-[#3a9173] text-xs sm:text-sm mt-0.5">
                You saved{' '}
                <strong className="font-bold">
                  {order.currency} {order.loyaltyDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>{' '}
                with wholesale partner discount.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Layout Grid: Left Order Info / Right Item details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Essentials & Addresses */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowOrderInfo(!showOrderInfo)}
              className="w-full flex justify-between items-center p-4 bg-[#FFFAF6] font-semibold text-gray-900 text-sm"
            >
              <span>Order Information</span>
              <span className="material-symbols-outlined">
                {showOrderInfo ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>

            {showOrderInfo && (
              <div className="p-4 space-y-4 text-xs">
                {/* Shipping Address */}
                <div className="p-3.5 rounded-lg bg-[#F7F2F4] space-y-1">
                  <h5 className="font-bold text-gray-900 text-sm mb-1">Shipping Address</h5>
                  <div className="font-semibold text-gray-800">{order.address.shippingAddress.name}</div>
                  <div className="text-gray-600 leading-relaxed">
                    {order.address.shippingAddress.addressLineOne},{' '}
                    {order.address.shippingAddress.addressLineTwo ? `${order.address.shippingAddress.addressLineTwo}, ` : ''}
                    {order.address.shippingAddress.city}, {order.address.shippingAddress.state} -{' '}
                    {order.address.shippingAddress.postalCode}
                  </div>
                  <div className="text-gray-500 pt-1">{order.address.shippingAddress.contactEmail}</div>
                </div>

                {/* Billing Address */}
                <div className="p-3.5 rounded-lg bg-[#E9F0EB] space-y-1">
                  <h5 className="font-bold text-gray-900 text-sm mb-1">Billing Address</h5>
                  <div className="font-semibold text-gray-800">{order.address.billingAddress.name}</div>
                  <div className="text-gray-600 leading-relaxed">
                    {order.address.billingAddress.addressLineOne},{' '}
                    {order.address.billingAddress.addressLineTwo ? `${order.address.billingAddress.addressLineTwo}, ` : ''}
                    {order.address.billingAddress.city}, {order.address.billingAddress.state} -{' '}
                    {order.address.billingAddress.postalCode}
                  </div>
                  <div className="text-gray-500 pt-1">{order.address.billingAddress.contactEmail}</div>
                </div>

                {/* Order Essentials */}
                <div className="p-3.5 rounded-lg bg-[#E0DEE4] space-y-2">
                  <h5 className="font-bold text-gray-900 text-sm mb-2">Order Essentials</h5>

                  <div className="flex justify-between items-center text-gray-700">
                    <span>Shipping Mode:</span>
                    <span className="font-medium text-right text-gray-900">{order.shippingMode.name}</span>
                  </div>

                  <div className="flex justify-between items-center text-gray-700">
                    <span>Sub Total:</span>
                    <span className="font-medium">
                      {order.currency} {order.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-gray-700">
                    <span>Shipping:</span>
                    <span className="font-medium">
                      {order.currency} {order.shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {order.loyaltyOrder && order.loyaltyDiscountAmount && (
                    <div className="flex justify-between items-center text-emerald-800 font-medium">
                      <span>Wholesale Discount:</span>
                      <span>
                        - {order.currency} {order.loyaltyDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-gray-900 font-bold text-sm pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>
                      {order.currency} {order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Shipments & Order Items Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          {/* Shipments section */}
          {order.fulfillments && order.fulfillments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-gray-900">Shipments</h4>
              {order.fulfillments.map((fulfillment, idx) => (
                <div key={fulfillment.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-100 pb-2">
                    <span className="font-bold text-sm text-gray-800">Shipment #{idx + 1}</span>
                    {fulfillment.trackingUrl && (
                      <a
                        href={fulfillment.trackingUrl}
                        target="_blank"
                        rel="nofollow noreferrer"
                        className="text-xs bg-[#B7A990] hover:bg-[#a3947b] text-white px-3 py-1 rounded-md font-medium transition-colors"
                      >
                        Track Shipment ({fulfillment.shippingCode})
                      </a>
                    )}
                  </div>

                  {fulfillment.note && <p className="text-xs text-gray-600 italic">{fulfillment.note}</p>}

                  <div className="space-y-2">
                    {fulfillment.fulfilledItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg">
                        {item.heroImage && (
                          <img src={item.heroImage} alt={item.productName} className="w-12 h-12 object-cover rounded-md" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{item.productName}</p>
                          <p className="text-[11px] text-gray-500">
                            Qty: {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* In-Stock Items Section */}
          {inStockItems.length > 0 && (
            <div className="bg-[#FFFAF6] rounded-xl p-4 border border-amber-900/10 space-y-4">
              <div className="flex justify-between items-center border-b border-amber-900/10 pb-3">
                <h5 className="font-bold text-gray-900 text-base">In-Stock Items</h5>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Active
                </span>
              </div>

              <div className="space-y-3">
                {inStockItems.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg p-4 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img src={product.heroImage} alt={product.productName} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <h6 className="font-bold text-gray-900 text-sm">{product.productName}</h6>
                      <p className="text-xs text-gray-500">
                        Quantity: <span className="font-semibold text-gray-800">{product.quantity} {product.unit}</span>
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        {order.currency} {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {product.trackingUrl && (
                        <a
                          href={product.trackingUrl}
                          target="_blank"
                          rel="nofollow noreferrer"
                          className="px-3 py-1.5 bg-[#93805e] text-white text-xs rounded-md text-center hover:bg-[#7e6d4e] transition-colors"
                        >
                          Track Item
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Made-To-Order Items Section */}
          {madeToOrderItems.length > 0 && (
            <div className="bg-[#FFFAF6] rounded-xl p-4 border border-amber-900/10 space-y-4">
              <div className="flex justify-between items-center border-b border-amber-900/10 pb-3">
                <h5 className="font-bold text-gray-900 text-base">Made To Order</h5>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                  In Production
                </span>
              </div>

              <div className="space-y-3">
                {madeToOrderItems.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg p-4 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img src={product.heroImage} alt={product.productName} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <h6 className="font-bold text-gray-900 text-sm">{product.productName}</h6>
                      <p className="text-xs text-gray-500">
                        Quantity: <span className="font-semibold text-gray-800">{product.quantity} {product.unit}</span>
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        {order.currency} {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-Order Items Section */}
          {preOrderItems.length > 0 && (
            <div className="bg-[#FFFAF6] rounded-xl p-4 border border-amber-900/10 space-y-4">
              <div className="flex justify-between items-center border-b border-amber-900/10 pb-3">
                <h5 className="font-bold text-gray-900 text-base">Pre-Order Items</h5>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  Reserved
                </span>
              </div>

              <div className="space-y-3">
                {preOrderItems.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg p-4 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img src={product.heroImage} alt={product.productName} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <h6 className="font-bold text-gray-900 text-sm">{product.productName}</h6>
                      <p className="text-xs text-gray-500">
                        Quantity: <span className="font-semibold text-gray-800">{product.quantity} {product.unit}</span>
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        {order.currency} {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rate Order Experience Modal */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setRatingModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-10 border border-gray-100">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Rate Order Experience</h3>
              <button
                onClick={() => setRatingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <span className="material-symbols-outlined text-emerald-500 text-5xl">task_alt</span>
                <h4 className="font-bold text-gray-900 text-base">Thank you for your feedback!</h4>
                <p className="text-xs text-gray-500">Your rating helps us continuously refine artisan quality.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="text-center space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">How was your overall ordering experience?</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-transform ${star <= rating ? 'text-amber-400 scale-110' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Feedback Comments</label>
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us about the fabric quality, packaging, or delivery..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRatingModalOpen(false)}
                    className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs text-white bg-[#8E7862] hover:bg-[#6c5b48] rounded-lg font-semibold shadow-xs"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
