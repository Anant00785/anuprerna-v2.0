'use client';

import { useCurrency } from '@/contexts/CurrencyContext';

/**
 * Renders a product-card price routed through the header currency selector
 * (CurrencyContext), matching the PLP/PDP. Kept as a tiny client leaf so the
 * surrounding seo-landing cards can stay server components. Emits the formatted
 * amount only; the parent keeps the styling wrapper + /unit suffix.
 */
export default function CardPrice({ price }: { price: number }) {
  const { formatCode } = useCurrency();
  return <>{formatCode(price)}</>;
}
