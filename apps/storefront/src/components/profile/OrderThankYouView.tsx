'use client';

import React from 'react';
import Link from 'next/link';
import { OrderDetails } from '@/types/domain/profile';
import { OrderDetailView } from './OrderDetailView';

interface OrderThankYouViewProps {
  order: OrderDetails;
}

export const OrderThankYouView: React.FC<OrderThankYouViewProps> = ({ order }) => {
  return (
    <section className="w-full space-y-8 py-4">
      {/* Thank you Banner */}
      <div className="w-full flex flex-col justify-center items-center text-center space-y-4 max-w-3xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-[#52a183] shadow-xs">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Thank you for shopping with us!</h1>

        <p className="px-4 text-gray-600 text-sm md:text-base leading-relaxed">
          We are getting started on your order right away, and you will receive an order confirmation email shortly.
        </p>

        <p className="px-4 text-gray-700 text-xs md:text-sm leading-relaxed bg-[#FFFCF7] p-4 rounded-xl border border-amber-900/10 shadow-2xs">
          Your purchase not only brings beautiful, handcrafted fabric into your life but also{' '}
          <strong className="font-bold text-gray-900">empowers an artisan</strong> from a remote Indian village. By choosing our fabric,
          you help sustain their craft, support their livelihood, and connect their creation to the world. We appreciate your support and
          look forward to serving you again!
        </p>

        <Link
          href="/profile/order"
          className="text-[#6c5b48] hover:text-[#524436] font-semibold text-sm underline transition-colors"
        >
          Track and manage your orders
        </Link>

        <div className="w-full h-0.5 bg-[#6c5b48]/30 my-4"></div>
      </div>

      {/* Embedded Order Detail View */}
      <div className="w-full">
        <OrderDetailView order={order} showHeader={false} />
      </div>
    </section>
  );
};
