export interface NavMenuChild {
  title: string;
  icon?: string;
  emoji: string;
  link: string;
}

export interface NavMenuItem {
  title: string;
  emoji: string;
  icon?: string;
  link: string;
  children?: NavMenuChild[];
}

export interface NavMenuSection {
  sectionEmoji: string;
  sectionTitle: string;
  items: NavMenuItem[];
}

export const navMenuSections: NavMenuSection[] = [
  {
    sectionEmoji: '🧑‍🤝‍🧑',
    sectionTitle: 'People & Craft',
    items: [
      {
        title: 'Manage User',
        emoji: '👥',
        icon: 'people',
        link: '/user',
      },
      {
        title: 'Manage Artisans',
        emoji: '🧵',
        icon: 'person',
        link: '/manage-artisans',
        children: [
          {
            title: 'Manage Skills',
            emoji: '🙌',
            icon: 'handyman',
            link: '/manage-skills',
          }
        ]
      },
      {
        title: 'Manage Whatsapp',
        emoji: '📲',
        icon: 'WhatsApp',
        link: '/manage-whatsapp',
        children: [
          {
            title: 'Consent Manager',
            emoji: '✅',
            icon: 'verified_user',
            link: '/manage-whatsapp/consent-manager',
          },
          {
            title: 'Audit Log',
            emoji: '📋',
            icon: 'receipt_long',
            link: '/manage-whatsapp/audit_log',
          }
        ]
      }
    ]
  },
  {
    sectionEmoji: '🛍️',
    sectionTitle: 'Products & Content',
    items: [
      {
        title: 'Manage Content',
        emoji: '✍️',
        icon: 'content_copy',
        link: '/manage-content',
        children: [
          {
            title: 'Manage Story',
            emoji: '📖',
            icon: 'menu_book',
            link: '/manage-content/story',
          },
          {
            title: 'Manage Blog',
            emoji: '✏️',
            icon: 'rss_feed',
            link: '/manage-content/blog',
          }
        ]
      },
      {
        title: 'Manage Product',
        emoji: '🎨',
        icon: 'precision_manufacturing',
        link: '/manage-product',
        children: [
          {
            title: 'Category',
            emoji: '📂',
            icon: 'category',
            link: '/manage-product/product-category',
          },
          {
            title: 'Segment',
            emoji: '🗂️',
            icon: 'segment',
            link: '/manage-product/product-segment-category',
          },
          {
            title: 'Sub Category',
            emoji: '📁',
            icon: 'subtitles',
            link: '/manage-product/product-sub-category',
          },
          {
            title: 'Profile',
            emoji: '🎯',
            icon: 'tune',
            link: '/manage-product/profile',
          },
          {
            title: 'Filters',
            emoji: '🔧',
            icon: 'filter_alt',
            link: '/manage-product/filter',
          },
          {
            title: 'SKU Groups',
            emoji: '📦',
            icon: 'grid_view',
            link: '/manage-product/sku-group',
          },
          {
            title: 'Special Status',
            emoji: '🌟',
            icon: 'workspaces',
            link: '/manage-product/special-status',
          },
          {
            title: 'Tag',
            emoji: '🏷️',
            icon: 'sell',
            link: '/manage-product/tag',
          },
          {
            title: 'Finished Product',
            emoji: '✅',
            icon: 'inventory',
            link: '/manage-product/finished-product',
          },
          {
            title: 'Fabric Product',
            emoji: '🪡',
            icon: 'article',
            link: '/manage-product/fabric-product',
          }
        ]
      },
      {
        title: 'Manage Catalogs',
        emoji: '📚',
        icon: 'library_books',
        link: '/manage-catalog',
      },
      {
        title: 'Filter Page SEO',
        emoji: '🔎',
        icon: 'search',
        link: '/filter-page-seo',
      }
    ]
  },
  {
    sectionEmoji: '⚡',
    sectionTitle: 'Operations',
    items: [
      {
        title: 'Manage Logistics',
        emoji: '🚚',
        icon: 'store',
        link: '/logistic',
      },
      {
        title: 'Manage Inventory',
        emoji: '🗄️',
        icon: 'inventory',
        link: '/inventory',
      },
      {
        title: 'Manage Feedbacks',
        emoji: '💬',
        icon: 'question_answer',
        link: '/manage-feedback',
      },
      {
        title: 'Manage Reviews',
        emoji: '⭐',
        icon: 'reviews',
        link: '/review',
      },
      {
        title: 'Manage Workflow',
        emoji: '🌿',
        icon: 'account_tree',
        link: '/manage-workflow',
        children: [
          {
            title: 'Artisan Payments',
            emoji: '💸',
            icon: 'payments',
            link: '/manage-workflow/artisan-payments',
          }
        ]
      },
      {
        title: 'Wholesale Program',
        emoji: '💎',
        icon: 'paid',
        link: '/manage-loyalty-program',
      },
      {
        title: 'Impact Factor',
        emoji: '🌱',
        icon: 'eco',
        link: '/manage-impact',
      }
    ]
  },
  {
    sectionEmoji: '🛠️',
    sectionTitle: 'Tools & Admin',
    items: [
      {
        title: 'Cron Jobs',
        emoji: '⏰',
        icon: 'schedule',
        link: '/cron-job-management',
      },
      {
        title: 'Report Center',
        emoji: '📊',
        icon: 'download',
        link: '/report-center',
      },
      {
        title: 'AI Embeddings',
        emoji: '🤖',
        icon: 'blur_on',
        link: '/ai-embeddings',
      },
      {
        title: 'Email Audit Log',
        emoji: '✉️',
        icon: 'mail',
        link: '/email-audit-log',
      },
      {
        title: 'Ads Conversion',
        emoji: '📈',
        icon: 'campaign',
        link: '/ads-conversion',
      },
      {
        title: 'Table Explorer',
        emoji: '🔍',
        icon: 'table_view',
        link: '/table-explorer',
      },
      {
        title: 'Diagnostics',
        emoji: '🩺',
        icon: 'monitor_heart',
        link: '/diagnostics',
      },
      {
        title: 'Squish Studio',
        emoji: '🪄',
        icon: 'compress',
        link: '/image-optimization',
      },
      {
        title: 'Settings',
        emoji: '⚙️',
        icon: 'settings',
        link: '/settings',
      }
    ]
  }
];
