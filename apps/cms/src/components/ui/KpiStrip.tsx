import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: string | number;
  /** Percentage change. Positive = up, negative = down, 0/undefined = neutral */
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface KpiStripProps {
  items: KpiItem[];
  className?: string;
}

export function KpiStrip({ items, className }: KpiStripProps) {
  return (
    <div className={cn("grid gap-4", className)}
         style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item, i) => (
        <KpiCard key={i} item={item} />
      ))}
    </div>
  );
}

function KpiCard({ item }: { item: KpiItem }) {
  const delta = item.delta;
  const isPositive = delta != null && delta > 0;
  const isNegative = delta != null && delta < 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 transition-shadow",
        item.onClick ? "cursor-pointer hover:shadow-card" : "",
      )}
      style={{ borderColor: "#E8E4DE" }}
      onClick={item.onClick}
    >
      {item.icon && (
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg"
             style={{ background: "#FEF3E2", color: "#A86120" }}>
          {item.icon}
        </div>
      )}
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#847D77" }}>
        {item.label}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
        {item.value}
      </p>
      {delta != null && (
        <div className={cn(
          "mt-2 flex items-center gap-1 text-xs font-medium",
          isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-stone-400",
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> :
           isNegative ? <TrendingDown className="h-3 w-3" /> :
           <Minus className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}%
          {item.deltaLabel && <span className="font-normal text-stone-400 ml-1">{item.deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
