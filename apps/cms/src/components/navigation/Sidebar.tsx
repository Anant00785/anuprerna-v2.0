'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navMenuSections, NavMenuItem } from '@/lib/nav-menu';
import { ChevronRight, ChevronDown } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Auto expand parent menus if active link is child
    const initialExpanded: Record<string, boolean> = {};
    navMenuSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => pathname === child.link || pathname.startsWith(child.link + '/'));
          const isExactParent = pathname === item.link;
          if (hasActiveChild || isExactParent) {
            initialExpanded[item.title] = true;
          }
        }
      });
    });
    setExpandedItems(prev => ({ ...prev, ...initialExpanded }));
  }, [pathname]);

  const toggleExpand = (title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (link: string) => {
    if (link === '/dashboard') return pathname === '/dashboard';
    return pathname === link || pathname.startsWith(link + '/');
  };

  const isParentActive = (item: NavMenuItem) => {
    return !!(item.children?.some(c => isActive(c.link)));
  };

  return (
    <nav className={`wv-sidebar ${collapsed ? 'wv-sidebar--collapsed' : ''}`}>
      <div className="wv-sidebar__header">
        <span className="wv-sidebar__header-logo">🌸</span>
        {!collapsed && <span className="wv-sidebar__header-brand">Anuprerna</span>}
        <button
          className="wv-sidebar__header-toggle"
          onClick={() => setCollapsed(!collapsed)}
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <div className="wv-sidebar__nav">
        <Link
          href="/dashboard"
          className={`wv-sidebar__item ${isActive('/dashboard') ? 'wv-sidebar__item--active' : ''}`}
        >
          <span className="wv-sidebar__item-emoji">🏠</span>
          {!collapsed && <span className="wv-sidebar__item-label">Dashboard</span>}
        </Link>

        {navMenuSections.map((section, sIdx) => (
          <div key={sIdx}>
            {!collapsed ? (
              <div className="wv-sidebar__section-label">
                <span>{section.sectionEmoji}</span>
                <span>{section.sectionTitle}</span>
              </div>
            ) : (
              <div className="h-[1px] bg-white/10 my-2 mx-3" />
            )}

            {section.items.map((item, iIdx) => {
              const hasChildren = item.children && item.children.length > 0;
              const active = isActive(item.link);
              const parentActive = isParentActive(item);
              const isExpanded = !!expandedItems[item.title];

              if (hasChildren) {
                return (
                  <div key={iIdx}>
                    <Link
                      href={item.link}
                      className={`wv-sidebar__item ${active || parentActive ? 'wv-sidebar__item--active-parent' : ''}`}
                    >
                      <span className="wv-sidebar__item-emoji">{item.emoji}</span>
                      {!collapsed && <span className="wv-sidebar__item-label">{item.title}</span>}
                      {!collapsed && (
                        <button
                          type="button"
                          className="ml-auto text-white/50 hover:text-white p-1"
                          onClick={(e) => toggleExpand(item.title, e)}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                    </Link>

                    {!collapsed && isExpanded && (
                      <div className="pl-2 space-y-1">
                        {item.children?.map((child, cIdx) => (
                          <Link
                            key={cIdx}
                            href={child.link}
                            className={`wv-sidebar__child-item ${isActive(child.link) ? 'wv-sidebar__child-item--active' : ''}`}
                          >
                            <span className="wv-sidebar__child-emoji">{child.emoji}</span>
                            <span className="wv-sidebar__child-label">{child.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={iIdx}
                  href={item.link}
                  className={`wv-sidebar__item ${active ? 'wv-sidebar__item--active' : ''}`}
                >
                  <span className="wv-sidebar__item-emoji">{item.emoji}</span>
                  {!collapsed && <span className="wv-sidebar__item-label">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
