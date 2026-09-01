/**
 * /dashboard — Overview dashboard with real KPI data (Milestone 3)
 *
 * KPIs fetched from live Loom via service token. Previously static numbers.
 * Note: "Open Orders" is intentionally omitted from the fast KPI path
 * (the order dump is ~46 MB); it shows as "—" with a label.
 */

import React from "react";
import { cookies } from "next/headers";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Card, CardHeader, CardTitle, KpiStrip, KpiItem } from "@/components/ui";
import { getDashboardCounts } from "@/lib/api";
import { getServiceToken } from "@/lib/loom-service-token";
import {
  Package,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star,
  Users,
  Boxes,
} from "lucide-react";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_LINKS = [
  { label: "Browse listings",     href: "/listings" },
  { label: "View orders",         href: "/orders" },
  { label: "Inventory",           href: "/inventory" },
  { label: "Catalog: categories", href: "/catalog/categories" },
  { label: "Reports",             href: "/reports" },
];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  const token = cookieToken ?? await getServiceToken();

  const counts = await getDashboardCounts(token);

  const kpis: KpiItem[] = [
    {
      label: "Total listings",
      value: counts.totalListings > 0 ? counts.totalListings.toLocaleString() : "—",
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: "Active listings",
      value: counts.activeListings > 0 ? counts.activeListings.toLocaleString() : "—",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      label: "Open orders",
      value: "—",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      label: "Out-of-stock alerts",
      value: counts.oosRequests > 0 ? counts.oosRequests.toLocaleString() : "0",
      icon: <Boxes className="h-4 w-4" />,
    },
  ];

  const topTasks = [
    counts.oosRequests > 0
      ? { icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, label: `${counts.oosRequests.toLocaleString()} out-of-stock requests pending`, href: "/inventory", count: counts.oosRequests, variant: "amber" }
      : null,
    { icon: <ShoppingCart className="h-4 w-4 text-blue-500" />, label: "View all orders", href: "/orders", count: null, variant: "blue" },
    { icon: <Star className="h-4 w-4 text-amber-500" />, label: "Reviews", href: "/reviews", count: null, variant: "amber" },
    { icon: <Users className="h-4 w-4 text-purple-500" />, label: "Artisan applications", href: "/artisans", count: null, variant: "purple" },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string; href: string; count: number | null; variant: string }>;

  return (
    <WeaveShell breadcrumb={
      <span className="font-serif text-lg font-medium" style={{ color: "#1A1714" }}>Dashboard</span>
    }>
      <div className="flex flex-col gap-6 max-w-6xl">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
            {greeting()}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Here&apos;s a live snapshot from Loom.
          </p>
        </div>

        <KpiStrip items={kpis} />

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Top tasks</CardTitle>
            </CardHeader>
            <div className="flex flex-col divide-y" style={{ borderColor: "#F3F1ED" }}>
              {topTasks.map((task, i) => (
                <a
                  key={i}
                  href={task.href}
                  className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "#FAF9F7" }}
                  >
                    {task.icon}
                  </div>
                  <span className="flex-1 text-sm" style={{ color: "#302C28" }}>{task.label}</span>
                  {task.count !== null && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: "#FEF3E2", color: "#A86120" }}
                    >
                      {task.count.toLocaleString()}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-stone-50"
                  style={{ color: "#635D58" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#C97C2A" }} />
                  {link.label}
                </a>
              ))}
            </div>
          </Card>
        </div>

        {/* Open orders note */}
        <div
          className="rounded-xl border px-5 py-4 text-sm"
          style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#635D58" }}
        >
          <strong style={{ color: "#302C28" }}>Open orders KPI:</strong> omitted from the fast dashboard load (the order
          dump is ~46 MB). Visit the{" "}
          <a href="/orders" className="hover:underline" style={{ color: "#A86120" }}>Orders</a> page for the full count.
          All other KPIs above are live from Loom.
        </div>
      </div>
    </WeaveShell>
  );
}
