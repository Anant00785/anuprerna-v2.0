'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';

interface DashboardCardItem {
  emoji: string;
  title: string;
  action: string;
  bgClass: string;
  children?: { label: string; action: string }[];
}

interface DashboardSection {
  sectionEmoji: string;
  sectionTitle: string;
  items: DashboardCardItem[];
}

const dashboardSections: DashboardSection[] = [
  {
    sectionEmoji: '🧑‍🤝‍🧑',
    sectionTitle: 'People & Craft',
    items: [
      {
        emoji: '👥',
        title: 'Manage User',
        action: '/user',
        bgClass: 'bg-[#fef2f2]'
      },
      {
        emoji: '🧵',
        title: 'Manage Artisans',
        action: '/manage-artisans',
        bgClass: 'bg-[#edf7ed]',
        children: [{ label: '🤲 Skills', action: '/manage-skills' }]
      },
      {
        emoji: '📲',
        title: 'Manage Whatsapp',
        action: '/manage-whatsapp',
        bgClass: 'bg-[#edf7ed]',
        children: [
          { label: '✅ Consent Manager', action: '/manage-whatsapp/consent-manager' },
          { label: '📋 Audit Log', action: '/manage-whatsapp/audit_log' }
        ]
      }
    ]
  },
  {
    sectionEmoji: '🛍️',
    sectionTitle: 'Products & Content',
    items: [
      {
        emoji: '🎨',
        title: 'Manage Product',
        action: '/manage-product',
        bgClass: 'bg-[#f5f3ff]',
        children: [
          { label: 'Finished', action: '/manage-product/finished-product' },
          { label: 'Fabric', action: '/manage-product/fabric-product' },
          { label: 'Category', action: '/manage-product/product-category' },
          { label: 'Filters', action: '/manage-product/filter' },
          { label: 'SKU Groups', action: '/manage-product/sku-group' }
        ]
      },
      {
        emoji: '✍️',
        title: 'Manage Content',
        action: '/manage-content',
        bgClass: 'bg-[#fffbeb]',
        children: [
          { label: 'Story', action: '/manage-content/story' },
          { label: 'Blog', action: '/manage-content/blog' }
        ]
      },
      {
        emoji: '📚',
        title: 'Manage Catalogs',
        action: '/manage-catalog',
        bgClass: 'bg-[#ecfdf5]'
      },
      {
        emoji: '🔎',
        title: 'Filter Page SEO',
        action: '/filter-page-seo',
        bgClass: 'bg-[#eff6ff]'
      }
    ]
  },
  {
    sectionEmoji: '⚡',
    sectionTitle: 'Operations',
    items: [
      {
        emoji: '🚚',
        title: 'Manage Logistics',
        action: '/logistic',
        bgClass: 'bg-[#fefce8]'
      },
      {
        emoji: '🗄️',
        title: 'Manage Inventory',
        action: '/inventory',
        bgClass: 'bg-[#f5f3ff]'
      },
      {
        emoji: '💬',
        title: 'Manage Feedbacks',
        action: '/manage-feedback',
        bgClass: 'bg-[#f0fdfa]'
      },
      {
        emoji: '⭐',
        title: 'Manage Reviews',
        action: '/review',
        bgClass: 'bg-[#fffbeb]'
      },
      {
        emoji: '🌿',
        title: 'Manage Workflow',
        action: '/manage-workflow',
        bgClass: 'bg-[#f0fdf4]',
        children: [
          { label: 'Artisan Payments', action: '/manage-workflow/artisan-payments' }
        ]
      },
      {
        emoji: '💎',
        title: 'Wholesale Program',
        action: '/manage-loyalty-program',
        bgClass: 'bg-[#eff6ff]'
      },
      {
        emoji: '🌱',
        title: 'Impact Factor',
        action: '/manage-impact',
        bgClass: 'bg-[#f0fdf4]'
      }
    ]
  },
  {
    sectionEmoji: '🛠️',
    sectionTitle: 'Tools & Admin',
    items: [
      {
        emoji: '⏰',
        title: 'Cron Jobs',
        action: '/cron-job-management',
        bgClass: 'bg-[#fdf2f8]'
      },
      {
        emoji: '📊',
        title: 'Report Center',
        action: '/report-center',
        bgClass: 'bg-[#eff6ff]'
      },
      {
        emoji: '🤖',
        title: 'AI Embeddings',
        action: '/ai-embeddings',
        bgClass: 'bg-[#f5f3ff]'
      },
      {
        emoji: '✉️',
        title: 'Email Audit Log',
        action: '/email-audit-log',
        bgClass: 'bg-[#f8fafc]'
      },
      {
        emoji: '📈',
        title: 'Ads Conversion',
        action: '/ads-conversion',
        bgClass: 'bg-[#ecfdf5]'
      },
      {
        emoji: '🔍',
        title: 'Table Explorer',
        action: '/table-explorer',
        bgClass: 'bg-[#f0fdfa]'
      },
      {
        emoji: '🩺',
        title: 'Diagnostics',
        action: '/diagnostics',
        bgClass: 'bg-[#fef2f2]'
      },
      {
        emoji: '🪄',
        title: 'Squish Studio',
        action: '/image-optimization',
        bgClass: 'bg-[#fffbeb]'
      },
      {
        emoji: '⚙️',
        title: 'Settings',
        action: '/settings',
        bgClass: 'bg-[#f1f5f9]'
      }
    ]
  }
];

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto py-1">
      {/* Greeting Heading matching live Weave */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mb-1 tracking-tight">
          Hey there! 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Pick what you wanna work on today ✨
        </p>
      </div>

      {/* Dashboard Sections */}
      <div className="space-y-7">
        {dashboardSections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-lg">{section.sectionEmoji}</span>
              <span>{section.sectionTitle}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {section.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className={`${item.bgClass} rounded-2xl p-4 flex flex-col justify-between items-center text-center transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 border border-black/5 min-h-[125px]`}
                >
                  <Link
                    href={item.action}
                    className="w-full flex flex-col items-center justify-center flex-1"
                  >
                    <span className="text-3xl sm:text-3.5xl mb-2 select-none">
                      {item.emoji}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-[13px] tracking-tight hover:text-indigo-600 transition-colors">
                      {item.title}
                    </span>
                  </Link>

                  {item.children && item.children.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-black/5 w-full flex flex-wrap gap-1.5 justify-center items-center">
                      {item.children.map((child, cIdx) => (
                        <Link
                          key={cIdx}
                          href={child.action}
                          className="text-[10px] sm:text-[11px] bg-white/95 hover:bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200/80 font-medium transition-all shadow-2xs"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
