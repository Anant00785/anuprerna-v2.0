// components/product/LogisticsBlock.tsx
// Delivery + shopping-assurance block for the PDP.
// Placed ABOVE the buy-box in ProductInfoPanel.
import { addDaysUtc, formatDeliveryDate } from './delivery';

interface LogisticsBlockProps {
  /** true when product has ready stock (totalQuantity > 0 and orderable in-stock) */
  inStock: boolean;
  /** Concrete lead window (days) for made-to-order / custom / pre-order. When set,
   *  the estimated-delivery date + window copy use these real days instead of the
   *  generic in-stock/MTO defaults. */
  leadFromDays?: number | null;
  leadToDays?: number | null;
  /** e.g. 'Made to Order' | 'Pre-Order' — appended to make the ship model explicit. */
  orderTypeLabel?: string | null;
}


export default function LogisticsBlock({ inStock, leadFromDays, leadToDays, orderTypeLabel }: LogisticsBlockProps) {
  // Estimated delivery, computed by stock/order type:
  //   real lead days provided (MTO/custom/pre-order) -> quote the far end
  //   in-stock                                       -> ~2-3 days (+3)
  //   made-to-order (no explicit days)               -> ~1 month (+30)
  const hasLead = typeof leadToDays === 'number' && leadToDays > 0;
  const deliverDays = hasLead ? (leadToDays as number) : (inStock ? 3 : 30);
  const estimatedDelivery = addDaysUtc(deliverDays);
  const windowLabel = hasLead
    ? (typeof leadFromDays === 'number' && leadFromDays > 0 && leadFromDays !== leadToDays
        ? '~' + leadFromDays + '–' + leadToDays + ' days'
        : '~' + leadToDays + ' days')
    : (inStock ? '~2–3 days' : '~1 month');

  return (
    <div className='flex flex-col gap-3 rounded-xl border border-sand bg-cream px-4 py-3 text-sm'>
      {/* Single estimated-delivery line — the ONLY delivery estimate on the page */}
      <div className='flex items-start gap-2'>
        <span className='material-symbols-outlined text-[18px] text-clay'>local_shipping</span>
        <span className='text-black/70'>
          <span className='font-semibold text-black'>Estimated delivery:</span>{' '}
          <span suppressHydrationWarning>{formatDeliveryDate(estimatedDelivery)}</span>
          <span className='text-black/50'> ({windowLabel})</span>
          {orderTypeLabel ? <span className='text-black/50'> · {orderTypeLabel}</span> : null}
        </span>
      </div>

      {/* Shipping policy copy */}
      <div className='flex items-start gap-2'>
        <span className='material-symbols-outlined text-[18px] text-clay'>package_2</span>
        <span className='text-black/70'>
          Free shipping on orders above ₹5,000 · ₹150 flat on smaller orders
        </span>
      </div>

      {/* Returns copy */}
      <div className='flex items-start gap-2'>
        <span className='material-symbols-outlined text-[18px] text-clay'>assignment_return</span>
        <span className='text-black/70'>Easy 7-day returns on eligible items</span>
      </div>
    </div>
  );
}
