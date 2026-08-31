'use client';
import { useCurrency } from '@/contexts/CurrencyContext';

// Small client price piece for the (server-rendered) RelatedProducts grid, so the
// price respects the active currency selector and renders in the SAME code style
// ("INR 432" / "USD 4.58") used on the PLP cards + PDP. Keeping just the price as a
// client island lets the surrounding card stay a server component.
export default function RelatedProductPrice({ price, unit }: { price: number; unit?: string }) {
  const { formatCode } = useCurrency();
  return (
    <p className='text-clay font-medium text-sm mt-1'>
      {formatCode(price)}
      <span className='text-bark font-normal'>/{unit?.toLowerCase()}</span>
    </p>
  );
}
