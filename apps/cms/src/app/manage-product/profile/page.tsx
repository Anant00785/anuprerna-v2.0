'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function ProfileStudioPage() {
  const profileCards = [
    {
      badge: 'FINISHING',
      emoji: '✨',
      title: 'Finish',
      description: 'Custom finishing options applied at order time — borders, edging, washes, treatments.',
      route: '/manage-product/profile/finish',
      cta: 'Open Finish',
    },
    {
      badge: 'MATERIAL',
      emoji: '🧵',
      title: 'Fabric',
      description: 'The fabric profile attached to a product — weave, weight, composition, swatch behaviour.',
      route: '/manage-product/profile/fabric',
      cta: 'Open Fabric',
    },
    {
      badge: 'SIZING RULES',
      emoji: '📐',
      title: 'Custom Size',
      description: 'Rules that let buyers request custom sizes — input fields, unit, accepted range.',
      route: '/manage-product/profile/custom-size',
      cta: 'Open Custom Size',
    },
    {
      badge: 'SIZE TABLE',
      emoji: '📏',
      title: 'Size',
      description: 'Standard size tables and size-guide content shown on the product page.',
      route: '/manage-product/profile/size',
      cta: 'Open Size',
    },
    {
      badge: 'LABEL',
      emoji: '🏷️',
      title: 'Badge',
      description: 'Display badges (Handwoven, Limited Edition, Eco) shown over product images.',
      route: '/manage-product/profile/badge',
      cta: 'Open Badge',
    },
    {
      badge: 'PRICING',
      emoji: '💰',
      title: 'Volume Discount',
      description: 'Tiered quantity-discount rules — buy more, save more.',
      route: '/manage-product/profile/volume-discount',
      cta: 'Open Volume Discount',
    },
    {
      badge: 'SOURCING',
      emoji: '⌛',
      title: 'Made to Order',
      description: 'Made-to-order configuration — lead time, minimum quantity, deposit behaviour.',
      route: '/manage-product/profile/made-to-order',
      cta: 'Open Made to Order',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link
          href="/manage-product"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧩</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Profile Studio</h1>
            <p className="text-xs text-slate-500 font-normal">
              Reusable configuration profiles — attach them to sub-categories or products to drive storefront and checkout behaviour
            </p>
          </div>
        </div>
      </div>

      {/* 7 CARDS GRID (MATCHING SCREENSHOT 5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {profileCards.map(card => (
          <Link
            key={card.title}
            href={card.route}
            className="group bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{card.emoji}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 shadow-xs">
                  {card.badge}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              <span>{card.cta} →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
