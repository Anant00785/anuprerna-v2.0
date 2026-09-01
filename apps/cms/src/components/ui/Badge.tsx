import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "amber" | "stone" | "blue" | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green:  "bg-emerald-50 text-emerald-700",
  red:    "bg-red-50 text-red-700",
  amber:  "bg-amber-100 text-amber-800",
  stone:  "bg-stone-100 text-stone-600",
  blue:   "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
};

export function Badge({ variant = "stone", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Map a product status string to the right Badge variant */
export function statusBadgeVariant(status: string): BadgeVariant {
  const s = status?.toUpperCase();
  if (s === "ACTIVE")   return "green";
  if (s === "DRAFT")    return "amber";
  if (s === "INACTIVE") return "red";
  return "stone";
}
