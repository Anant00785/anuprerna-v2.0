import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Money formatter that preserves 2 decimals and renders the currency CODE as a
 * prefix (e.g. "USD 1,234.56"). Deterministic (en-IN grouping) so SSR/client
 * match. Mirrors the Angular '{{currency}} {{value | number:\'1.2-2\'}}' pattern
 * used across the custom-order screens. Currencies are mixed (USD/INR/GBP), so a
 * code prefix is clearer than a locale-guessed symbol.
 */
export function formatMoney(amount?: number, currency = "INR"): string {
  const n = Number.isFinite(amount as number) ? (amount as number) : 0;
  const body = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${currency} ${body}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Format an epoch-milliseconds timestamp deterministically (en-IN, Asia/Kolkata)
 * so SSR and client output match exactly. Returns an em-dash for falsy/zero.
 */
export function formatEpoch(ms?: number): string {
  if (!ms || ms <= 0) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** Format an integer count deterministically (en-IN grouping). */
export function formatCount(n: number): string {
  return (n ?? 0).toLocaleString("en-IN");
}
