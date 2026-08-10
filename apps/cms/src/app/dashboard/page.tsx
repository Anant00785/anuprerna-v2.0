'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';

interface DashboardCardItem {
  emoji: string;
  title: string;
  action: string;
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
      { emoji: '👥', title: 'Manage User', action: '/user' },
      {
        emoji: '🧵',
        title: 'Manage Artisans',
        action: '/manage-artisans',
        children: [{ label: '🙌 Skills', action: '/manage-skills' }]
      },
      {
        emoji: '📲',
        title: 'Manage Whatsapp',
        action: '/manage-whatsapp',
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
        children: [
          { label: '✅ Finished', action: '/manage-product/finished-product' },
          { label: '🪡 Fabric', action: '/manage-product/fabric-product' },
          { label: '📂 Category', action: '/manage-product/product-category' },
          { label: '🔍 Filters', action: '/manage-product/filter' },
          { label: '📦 SKU Groups', action: '/manage-product/sku-group' }
        ]
      },
      {
        emoji: '✍️',
        title: 'Manage Content',
        action: '/manage-content',
        children: [
          { label: '📖 Story', action: '/manage-content/story' },
          { label: '✏️ Blog', action: '/manage-content/blog' }
        ]
      },
      { emoji: '📚', title: 'Manage Catalogs', action: '/manage-catalog' }
    ]
  },
  {
    sectionEmoji: '⚡',
    sectionTitle: 'Operations',
    items: [
      { emoji: '🏪', title: 'Manage Logistics', action: '/logistic' },
      { emoji: '📦', title: 'Manage Inventory', action: '/inventory' },
      { emoji: '🌿', title: 'Manage Workflow', action: '/manage-workflow' },
      { emoji: '💎', title: 'Wholesale Program', action: '/manage-loyalty-program' },
      { emoji: '💬', title: 'Manage Feedback', action: '/manage-feedback' },
      { emoji: '⭐', title: 'Manage Reviews', action: '/review' }
    ]
  },
  {
    sectionEmoji: '🛠️',
    sectionTitle: 'Tools & Admin',
    items: [
      { emoji: '📅', title: 'Cron Jobs', action: '/cron-job-management' },
      { emoji: '📊', title: 'Report Center', action: '/report-center' },
      { emoji: '📈', title: 'Ads Conversion', action: '/ads-conversion' },
      { emoji: '🤖', title: 'AI Embeddings', action: '/ai-embeddings' },
      { emoji: '🔍', title: 'Table Explorer', action: '/table-explorer' },
      { emoji: '⚙️', title: 'Settings', action: '/settings' }
    ]
  }
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeading heading="Dashboard" />

      {/* Header Stats / Welcome Card */}
      <div className="mb-8 p-6 bg-gradient-to-r from-slate-800 to-indigo-900 text-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Welcome to Anuprerna Weave Console</h1>
        <p className="text-slate-300 text-sm max-w-2xl">
          Manage artisans, inventory, orders, products, content, and system workflows in real-time.
        </p>
      </div>

      {/* Dashboard Sections */}
      <div className="space-y-8">
        {dashboardSections.map((section, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="text-xl">{section.sectionEmoji}</span>
              <span>{section.sectionTitle}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-all flex flex-col justify-between"
                >
                  <Link href={item.action} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tl from-[#46496E] to-[#7779A6] text-white flex items-center justify-center text-xl shadow-sm">
                      {item.emoji}
                    </div>
                    <span className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                      {item.title}
                    </span>
                  </Link>

                  {item.children && item.children.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap gap-2">
                      {item.children.map((child, cIdx) => (
                        <Link
                          key={cIdx}
                          href={child.action}
                          className="text-xs bg-white text-slate-700 hover:text-indigo-600 px-2.5 py-1 rounded border border-slate-200 font-medium transition-colors"
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
