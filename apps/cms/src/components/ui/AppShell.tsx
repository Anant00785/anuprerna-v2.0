"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronsLeft, ChevronsRight } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────

/** Viewport below which the sidebar defaults to the icon rail (Tailwind `lg`). */
const NARROW_PX = 1024;

// ── Types ─────────────────────────────────────────────────────────────────

/** Per-module feedback rollup — pending / fixed-by-Claude / resolved-awaiting-confirm. */
export interface FbCounts {
  pending: number;
  claudeDone: number;
  resolved: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  badgeGreen?: boolean;
  /** 3-state feedback badge (mirrors the assistance-app sidebar pattern). */
  fb?: FbCounts;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
  /** Section-level feedback rollup, rendered on the group header. */
  fb?: FbCounts;
}

export interface AppShellProps {
  /** Brand mark / wordmark rendered in the sidebar header */
  logo: React.ReactNode;
  /** Navigation groups. Each group has an optional section label + items. */
  nav: NavGroup[];
  /** Rendered on the right side of the top bar (user menu, notifications…) */
  topBarRight?: React.ReactNode;
  /** Breadcrumb or page title, rendered on the left of the top bar */
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}

// ── Feedback pills ──────────────────────────────────────────────────────────
// Up to 3 small pills, right-aligned. Zero-count buckets are omitted. Colours
// match the anuprerna-assistance sidebar: red = pending, light-green = fixed by
// Claude (awaiting confirm), dark-green = resolved (awaiting confirm).

function FbPills({ fb }: { fb?: FbCounts }) {
  if (!fb) return null;
  const { pending, claudeDone, resolved } = fb;
  if (!pending && !claudeDone && !resolved) return null;
  const base =
    "inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[10px] font-semibold leading-none";
  return (
    <span className="ml-auto inline-flex items-center gap-1">
      {pending ? (
        <span
          className={base}
          style={{ background: "#E5484D", color: "#fff" }}
          title={`${pending} pending`}
        >
          {pending}
        </span>
      ) : null}
      {claudeDone ? (
        <span
          className={base}
          style={{ background: "#D1FAE5", color: "#047857" }}
          title={`${claudeDone} fixed by Claude — awaiting confirm`}
        >
          ✓{claudeDone}
        </span>
      ) : null}
      {resolved ? (
        <span
          className={base}
          style={{ background: "#059669", color: "#fff" }}
          title={`${resolved} resolved — awaiting confirm`}
        >
          ✓{resolved}
        </span>
      ) : null}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export function AppShell({
  logo,
  nav,
  topBarRight,
  breadcrumb,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // ── Responsive collapse (audit 2026-08-16, B-2) ──────────────────────────
  // The toggle above always existed; nothing ever DROVE it, so at 390px the
  // 240px sidebar ate 62% of the viewport and left ~150px of content — a
  // regression against live, which collapses to an icon rail. Below NARROW_PX
  // the rail is the default; the button still works, so a deliberate expand
  // survives until the next breakpoint CROSSING (which re-asserts the default).
  //
  // Deliberately an effect, not an initial state: `useState(() => matchMedia…)`
  // would read a browser-only API during the server render and hydrate to a
  // different width than the server emitted. Starting expanded on both sides
  // and collapsing after mount keeps the first paint byte-identical, which is
  // what `.harness/check.mjs` fails on (it treats a hydration mismatch as an
  // error). One frame of a wide sidebar on a phone is the cost.
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW_PX - 0.02}px)`);
    setCollapsed(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#FAF9F7" }}>
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "relative flex flex-col border-r bg-white transition-all duration-200",
          collapsed ? "w-14" : "w-60",
        )}
        style={{ borderColor: "#E8E4DE" }}
      >
        {/* Logo row */}
        <div
          className="flex h-14 items-center justify-between border-b px-4"
          style={{ borderColor: "#E8E4DE" }}
        >
          {!collapsed && <div className="flex-1 min-w-0">{logo}</div>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto rounded-lg p-1.5 text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {nav.map((group, gi) => (
            <div
              key={gi}
              className={gi > 0 ? "mt-3 pt-3" : ""}
              style={gi > 0 ? { borderTop: "1px solid #F3F1ED" } : undefined}
            >
              {group.label && !collapsed && (
                <div className="flex items-center px-3 mb-1.5">
                  <p className="text-[10px] font-semibold tracking-widest uppercase"
                     style={{ color: "#AAA39E" }}>
                    {group.label}
                  </p>
                  <FbPills fb={group.fb} />
                </div>
              )}
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href + "/")) ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "font-medium"
                        : "hover:bg-stone-50",
                    )}
                    style={
                      isActive
                        ? { background: "#FEF3E2", color: "#8A4C19" }
                        : { color: "#635D58" }
                    }
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: isActive ? "#A86120" : "#AAA39E" }}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.fb ? (
                          <FbPills fb={item.fb} />
                        ) : item.badge != null ? (
                          <span
                            className={item.badgeGreen
                              ? "inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[10px] font-semibold leading-none"
                              : "rounded-full px-1.5 py-0.5 text-[10px] font-medium"}
                            style={item.badgeGreen
                              ? { background: "#059669", color: "#fff" }
                              : { background: "#F3F1ED", color: "#635D58" }}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-white px-4 sm:px-6"
          style={{ borderColor: "#E8E4DE" }}
        >
          <div className="flex items-center gap-4">
            {breadcrumb}
          </div>
          <div className="flex items-center gap-3">
            {topBarRight}
          </div>
        </header>

        {/* Content area */}
        {/* p-4 below sm: at 390 with the icon rail, 24px gutters cost 48 of the
            ~334px left for content — enough to push stat-card numbers into a
            mid-digit clip ("1,3" for 1,316). */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
