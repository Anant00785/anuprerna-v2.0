"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell, NavGroup, FbCounts } from "@/components/ui/AppShell";
import { isAutomated } from "@/lib/feedback-classify";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  ShoppingCart,
  Boxes,
  Star,
  Paintbrush,
  BarChart2,
  GitBranch,
  Settings,
  LogOut,
  ChevronDown,
  Folder,
  Layers,
  FolderOpen,
  Hash,
  Award,
  SlidersHorizontal,
  Shapes,
  BookOpen,
  Images,
  Clock,
  Brain,
  MessageSquare,
  MessageCircle,
  ListChecks,
  Briefcase,
  Table2,
  ClipboardList,
  Route,
  MessagesSquare,
  Leaf,
  Truck,
  UserCheck,
  Scissors,
  FlaskConical,
  GitPullRequest,
} from "lucide-react";

// ── Nav config — mirrors the Weave route map ───────────────────────────────

const NAV_BASE: NavGroup[] = [
  {
    items: [
      { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard },
    ],
  },
  {
    // Products — everything that defines the catalog: the live listings plus all
    // the reference config (categories, segments, SKU groups, filters, profiles…).
    label: "Products",
    items: [
      { label: "Listings",       href: "/listings",               icon: Package },
      { label: "Categories",     href: "/catalog/categories",     icon: Folder },
      { label: "Segments",       href: "/catalog/segments",       icon: Layers },
      { label: "Sub-categories", href: "/catalog/sub-categories", icon: FolderOpen },
      { label: "SKU Groups",     href: "/catalog/sku-groups",     icon: Hash },
      { label: "Special Status", href: "/catalog/special-status", icon: Award },
      { label: "Filters",        href: "/catalog/filters",        icon: SlidersHorizontal },
      { label: "Profiles",       href: "/catalog/profiles",       icon: Shapes },
    ],
  },
  {
    // Customers — our ongoing users and everything about the relationship.
    label: "Customers",
    items: [
      { label: "Users",          href: "/users",          icon: Users },
      { label: "Reviews",        href: "/reviews",        icon: Star },
      { label: "Order Feedback", href: "/order-feedback", icon: MessageCircle },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Inventory",       href: "/inventory",                  icon: Boxes },
      { label: "Logistics",       href: "/logistics",                  icon: Truck },
      { label: "Wholesale",       href: "/wholesale",                  icon: UserCheck },
    ],
  },
  {
    // Workflow — the full order-to-production pipeline in one place:
    // order intake (orders / custom orders / custom products) through job
    // templates, live jobs, feedback and traceability. ArtisanFlow spine —
    // self-contained /artisanflow/* tree so it can later extract into its own app.
    label: "Workflow",
    items: [
      { label: "Orders",          href: "/orders",                     icon: ShoppingCart },
      { label: "Custom Orders",   href: "/artisanflow/custom-orders",  icon: ClipboardList },
      { label: "Custom Products", href: "/listings/custom",            icon: Scissors },
      { label: "Jobs Templates",    href: "/artisanflow/workflow",          icon: GitBranch },
      { label: "Production Jobs",   href: "/artisanflow",                   icon: ListChecks },
      { label: "All Jobs",          href: "/artisanflow/jobs",              icon: Briefcase },
      { label: "Jobs Feedback",     href: "/artisanflow/workflow/feedback", icon: MessageSquare },
      { label: "Traceability",      href: "/artisanflow/traceability",      icon: Route },
    ],
  },
  {
    label: "Artisans",
    items: [
      { label: "Artisans",   href: "/artisans",         icon: Paintbrush },
      { label: "Skills",     href: "/artisans/skills",  icon: BookOpen },
      { label: "Catalog",    href: "/artisans/catalog", icon: Images },
    ],
  },
  {
    // Content — stories, blogs, FAQs, and the story→product mapping review
    // (moved here from ArtisanFlow: it is content curation, not production).
    label: "Content",
    items: [
      { label: "Content",      href: "/content",      icon: FileText },
      { label: "Story Review", href: "/story-review", icon: ClipboardList },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Reports",        href: "/reports",         icon: BarChart2 },
      { label: "Cron Jobs",      href: "/cron-jobs",       icon: Clock },
      { label: "AI Embeddings",  href: "/ai-embeddings",   icon: Brain },
      { label: "WhatsApp",       href: "/whatsapp",        icon: MessageSquare },
      { label: "Table Explorer", href: "/table-explorer",  icon: Table2 },
      { label: "Page Feedback",  href: "/feedback",        icon: MessagesSquare },
      { label: "Settings",       href: "/settings",        icon: Settings },
      { label: "Rebuild Map",    href: "/rebuild-map",     icon: GitBranch },
      { label: "Impact Factor",  href: "/impact",          icon: Leaf },
      { label: "QA Center",      href: "/journey-tests",  icon: FlaskConical },
      { label: "Code Review",     href: "/code-review",    icon: GitPullRequest },
    ],
  },
];

// Dev-only tools — visible on local (:3010) for building/testing, but dropped
// from the sidebar (and their routes redirected, see middleware.ts) on Vercel
// via NEXT_PUBLIC_HIDE_DEV_TOOLS=1 (Rebuild Map reads VPS-local files and
// would throw a server-side exception in Vercel's serverless FS).
const HIDE_DEV = process.env.NEXT_PUBLIC_HIDE_DEV_TOOLS === "1";
const DEV_ONLY_HREFS = new Set(["/rebuild-map", "/journey-tests", "/code-review"]);

const NAV_VISIBLE: NavGroup[] = HIDE_DEV
  ? NAV_BASE.map((g) => ({ ...g, items: g.items.filter((i) => !DEV_ONLY_HREFS.has(i.href)) }))
  : NAV_BASE;

// ── Feedback bucketing ──────────────────────────────────────────────────────
// Weave feedback `status` values seen live: pending / claude_done (+ resolved /
// confirmed as they get used). Terminal states (confirmed, skipped) are excluded.

type FbRow = { status?: string; route?: string; submitterName?: string | null };

function bucketOf(status?: string): keyof FbCounts | null {
  const s = (status ?? "").toLowerCase();
  if (s === "confirmed" || s === "skipped") return null;
  if (s === "claude_done") return "claudeDone";
  if (s === "resolved" || s === "confirmed" || s === "skipped") return null; // done → drop from sidebar (record still shows on the Feedback page)
  return "pending"; // pending / open / undefined / ""
}

function emptyCounts(): FbCounts {
  return { pending: 0, claudeDone: 0, resolved: 0 };
}

function hasAny(c?: FbCounts): boolean {
  return !!c && (c.pending > 0 || c.claudeDone > 0 || c.resolved > 0);
}

// Longest-prefix match with a path boundary: a feedback route maps to the nav
// item whose href is the longest prefix such that the next char is "/" or EOS.
// So /artisanflow/workflow/job/x → the /artisanflow/workflow item (not the
// /artisanflow Production item); /artisanflow exact → Production.
function navHrefForRoute(route: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const h of hrefs) {
    if (route === h || route.startsWith(h + "/")) {
      if (best === null || h.length > best.length) best = h;
    }
  }
  return best;
}

// ── Logo ──────────────────────────────────────────────────────────────────

function WeaveLogo() {
  return (
    <Link href="/dashboard" className="flex flex-col leading-none group">
      <span
        className="font-serif text-xl font-semibold tracking-tight group-hover:opacity-80 transition-opacity"
        style={{ color: "#1A1714" }}
      >
        Weave
      </span>
      <span
        className="text-[10px] font-medium tracking-widest uppercase"
        style={{ color: "#AAA39E" }}
      >
        Anuprerna CMS
      </span>
    </Link>
  );
}

// ── Top-right user area ───────────────────────────────────────────────────

function UserMenu() {
  return (
    <div className="flex items-center gap-2">
      <button
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-stone-50"
        style={{ color: "#635D58" }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
          style={{ background: "#FEF3E2", color: "#A86120" }}
        >
          A
        </div>
        <span className="hidden sm:block font-medium" style={{ color: "#4A4540" }}>Admin</span>
        <ChevronDown className="h-3.5 w-3.5" style={{ color: "#AAA39E" }} />
      </button>

      <button
        type="button"
        title="Sign out"
        className="rounded-lg p-2 transition-colors hover:bg-stone-50"
        style={{ color: "#AAA39E" }}
        onClick={() => {
          fetch("/api/auth/login", { method: "DELETE" }).then(() => {
            window.location.href = "/login";
          });
        }}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Shell wrapper ─────────────────────────────────────────────────────────

interface WeaveShellProps {
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}

export function WeaveShell({ breadcrumb, children }: WeaveShellProps) {
  const pathname = usePathname();
  const [weaveRows, setWeaveRows] = useState<FbRow[]>([]);
  const [storefrontRows, setStorefrontRows] = useState<FbRow[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/feedback/all", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { weave?: FbRow[]; storefront?: FbRow[] }) => {
        if (!alive) return;
        setWeaveRows(d.weave ?? []);
        setStorefrontRows(d.storefront ?? []);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  // Flat list of every nav href, for longest-prefix mapping.
  const allHrefs = NAV_VISIBLE.flatMap((g) => g.items.map((i) => i.href));

  // Per-nav-item feedback buckets, from the weave route map. Automated rows
  // (e.g. Mission Control auto-posted task specs) are excluded so the badge
  // counts agree with the human-only default view on the Page Feedback
  // dashboard — see src/lib/feedback-classify.ts (single source of truth).
  const perItem: Record<string, FbCounts> = {};
  for (const row of weaveRows) {
    if (isAutomated(row.submitterName)) continue;
    const b = bucketOf(row.status);
    if (!b || !row.route) continue;
    const h = navHrefForRoute(row.route, allHrefs);
    if (!h) continue;
    (perItem[h] ??= emptyCounts())[b] += 1;
  }

  // The global /feedback inbox item shows a cross-app rollup (weave + storefront),
  // so it keeps surfacing everything (preserves the old totalOpenCount intent) —
  // human rows only, same automated exclusion as above.
  const globalFb = emptyCounts();
  for (const row of [...weaveRows, ...storefrontRows]) {
    if (isAutomated(row.submitterName)) continue;
    const b = bucketOf(row.status);
    if (b) globalFb[b] += 1;
  }

  const nav: NavGroup[] = NAV_VISIBLE.map((group) => {
    const items = group.items.map((item) => {
      if (item.href === "/feedback") {
        return hasAny(globalFb) ? { ...item, fb: globalFb } : item;
      }
      const fb = perItem[item.href];
      return hasAny(fb) ? { ...item, fb } : item;
    });
    // Section rollup = sum of route-mapped buckets across the group's items.
    // (Excludes the synthetic global /feedback bucket so headers aren't inflated.)
    const roll = emptyCounts();
    for (const it of group.items) {
      const f = perItem[it.href];
      if (f) {
        roll.pending += f.pending;
        roll.claudeDone += f.claudeDone;
        roll.resolved += f.resolved;
      }
    }
    return { ...group, items, fb: hasAny(roll) ? roll : undefined };
  });

  return (
    <AppShell
      logo={<WeaveLogo />}
      nav={nav}
      topBarRight={<UserMenu />}
      breadcrumb={breadcrumb}
    >
      {children}
    </AppShell>
  );
}
